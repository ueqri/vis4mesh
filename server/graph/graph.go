package graph

import (
	"log"
	"strconv"
	"sync"

	"github.com/ueqri/vis4mesh/server/reader"
	"github.com/ueqri/vis4mesh/server/stateless"
)

const numFlatWorkers = 2

var queriedMsgTypes []string
var numQueriedMsgTypes int

type Graph struct {
	elapse       uint
	mesh         *MeshInfo
	flat         *FlatInfo
	flatLock     *sync.Mutex
	flatWorkers  *sync.WaitGroup
	flatFinished int
	reader       reader.Reader
}

func MakeGraph(
	width, height uint16, timeSlice float64, elapse uint, rd reader.Reader,
) *Graph {
	g := &Graph{
		elapse:       elapse,
		mesh:         new(MeshInfo),
		flat:         new(FlatInfo),
		flatLock:     new(sync.Mutex),
		flatWorkers:  new(sync.WaitGroup),
		flatFinished: -1, // no flat info generated yet
		reader:       rd,
	}

	g.mesh.Init(width, height, timeSlice, elapse)
	go g.AsyncGenerateFlatInfo(1)

	queriedMsgTypes = stateless.GetQueriedMsgTypesList()
	numQueriedMsgTypes = len(queriedMsgTypes)

	return g
}

// query the counts of all channels across the mesh during [time, time + 1)
func (g *Graph) QueryTimeSliceAndAppend(time uint) {
	if g.mesh.Edges[0].CountBuffer[time] != nil {
		// if the time slice is queried before
		for i := range g.mesh.Edges {
			e := &g.mesh.Edges[i]
			e.Value = stateless.Uint64SliceValueAdd(e.Value, e.CountBuffer[time])
		}
	} else {
		for i := range g.mesh.Edges {
			e := &g.mesh.Edges[i]
			from := [3]int{int(e.SourceNode.X), int(e.SourceNode.Y), 0}
			to := [3]int{int(e.TargetNode.X), int(e.TargetNode.Y), 0}
			count := g.reader.Query(from, to, time)
			e.CountBuffer[time] = count
			// store counts in `Value` temporally
			e.Value = stateless.Uint64SliceValueAdd(e.Value, e.CountBuffer[time])
		}
	}
}

// query count of certain msg type across mesh during [time, time + frameSize)
func (g *Graph) QuerySnapshotOfFrame(time, frameSize, frameIdx uint,
) []*Snapshot {
	snapshots := make([]*Snapshot, numQueriedMsgTypes)
	for i, msgType := range queriedMsgTypes {
		snapshots[i] = &Snapshot{
			FrameIdx:         frameIdx,
			MsgExactType:     msgType,
			MsgTypeGroup:     stateless.GetGroupNameFromMsgTypeString(msgType),
			MsgDataOrCommand: stateless.GetDataOrCommandFromMsgTypeString(msgType),
			Count:            0,
		}
	}

	var fill uint
	for fill = 0; fill < frameSize; fill++ {
		now := time + uint(fill)
		if g.mesh.Edges[0].CountBuffer[now] != nil {
			// if current time slice is queried before
			for i := range g.mesh.Edges {
				e := &g.mesh.Edges[i]
				for msgTypeIdx, count := range e.CountBuffer[now] {
					snapshots[msgTypeIdx].Count += count
				}
			}
		} else {
			for i := range g.mesh.Edges {
				e := &g.mesh.Edges[i]
				from := [3]int{int(e.SourceNode.X), int(e.SourceNode.Y), 0}
				to := [3]int{int(e.TargetNode.X), int(e.TargetNode.Y), 0}
				count := g.reader.Query(from, to, now)
				e.CountBuffer[now] = count
				// sum the count of certain msg type across the mesh
				for msgTypeIdx, count := range e.CountBuffer[now] {
					snapshots[msgTypeIdx].Count += count
				}
			}
		}
	}
	return snapshots
}

func (g *Graph) AsyncGenerateFlatInfo(frameSize uint) {
	g.flatLock.Lock()
	g.flatFinished = -1 // no available flat info unless this event finishes
	g.flatLock.Unlock()

	frameSize = 1 // TODO: use custom frame size

	g.flat.snapshots = make([]Snapshot, g.elapse*uint(numQueriedMsgTypes))

	log.Printf("flat %d event with %d workers start", frameSize, numFlatWorkers)

	for i := 0; i < numFlatWorkers; i++ {
		g.flatWorkers.Add(1)
		go func(rank uint) {
			batch := g.elapse
			load := batch / numFlatWorkers
			rest := batch % numFlatWorkers

			var start, end uint
			if rank < rest {
				start = rank * (load + 1)
				end = start + load + 1
			} else {
				start = rank*load + rest
				end = start + load
			}

			for j := start; j < end; j++ {
				offset := j * uint(numQueriedMsgTypes)
				ss := g.QuerySnapshotOfFrame(j, frameSize, j)
				for msgTypeIdx := range queriedMsgTypes {
					g.flat.snapshots[uint(msgTypeIdx)+offset] = *ss[msgTypeIdx]
				}
			}

			g.flatWorkers.Done()
		}(uint(i))
	}

	g.flatWorkers.Wait()
	log.Printf("flat %d event done", frameSize)

	g.flatLock.Lock()
	g.flatFinished = int(frameSize) // assign to frame size
	g.flatLock.Unlock()
}

func (g *Graph) DumpFlatInfoToBytes() []byte {
	return stateless.JSONToBytes(g.flat.snapshots)
}

func (g *Graph) DumpMeshMetaToBytes() []byte {
	return stateless.JSONToBytes(g.mesh.Meta)
}

func (g *Graph) DumpNodeInfoToZippedBytes() []byte {
	arr := make([]string, 0, len(g.mesh.Nodes)*3)
	for _, node := range g.mesh.Nodes {
		id := strconv.FormatUint(uint64(node.ID), 10)
		// ... ID, Name, Detail ...
		arr = append(arr, id, node.Name, node.Detail)
	}
	return stateless.JSONToBytes(arr)
}

func (g *Graph) DumpEdgeInfoToZippedBytes() []byte {
	offsetOneEdge := 4 + numQueriedMsgTypes
	arr := make([]string, 0, len(g.mesh.Edges)*offsetOneEdge)
	for _, edge := range g.mesh.Edges {
		src := strconv.FormatUint(uint64(edge.Source), 10)
		tgt := strconv.FormatUint(uint64(edge.Target), 10)
		// ... Source, Target, Value[0], ..., Value[n], LinkName, Detail ...
		arr = append(arr, src, tgt)
		for msgTypeIdx := range queriedMsgTypes {
			val := strconv.FormatUint(edge.Value[msgTypeIdx], 10)
			arr = append(arr, val)
		}
		arr = append(arr, edge.LinkName, edge.Detail)
	}
	return stateless.JSONToBytes(arr)
}

func (g *Graph) CleanMeshEdgeValueInfo() {
	g.mesh.CleanEdgeValueInfo()
}

func (g *Graph) CheckAvailableFrameSizeOfFlatInfo() int {
	g.flatLock.Lock()
	sz := g.flatFinished
	g.flatLock.Unlock()
	return sz
}

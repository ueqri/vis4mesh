package main

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"strconv"
	"time"
)

const (
	col   int     = 8
	row   int     = 8
	slice float64 = 0.000001000
)

func FormatChannelName(e *EdgeInfo) string {
	return fmt.Sprintf(
		"GPU1.SW_%d_%d_0->GPU1.SW_%d_%d_0",
		e.SourceNode.X,
		e.SourceNode.Y,
		e.TargetNode.X,
		e.TargetNode.Y,
	)
}

type NodeInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	X    int    `json:"xid"`
	Y    int    `json:"yid"`
}

type EdgeInfo struct {
	SourceNode  *NodeInfo       `json:"-"`
	TargetNode  *NodeInfo       `json:"-"`
	CountRecord map[int64]int64 `json:"-"`
	LinkName    string          `json:"-"`
	Source      string          `json:"source"`
	Target      string          `json:"target"`
	Value       int64           `json:"value"`
	Details     string          `json:"details"`
}

type MeshInfo struct {
	Nodes []NodeInfo `json:"nodes"`
	Edges []EdgeInfo `json:"edges"`
}

func (e *EdgeInfo) UpdateValue(val int64) {
	e.Value = val
}

func (m *MeshInfo) InitNodes() {
	for i := 0; i < row; i++ {
		for j := 0; j < col; j++ {
			nodeIdx := i*col + j
			m.Nodes = append(m.Nodes, NodeInfo{
				X:    i,
				Y:    j,
				ID:   strconv.Itoa(nodeIdx),
				Name: fmt.Sprintf("Sw%d", nodeIdx),
			})
		}
	}
}

func (m *MeshInfo) InitEdgePool() {
	// Vertical direction
	for i := 1; i < row; i++ {
		for j := 0; j < col; j++ {
			cur := i*col + j
			north := cur - col
			m.Edges = append(m.Edges, EdgeInfo{
				SourceNode:  &m.Nodes[north],
				TargetNode:  &m.Nodes[cur],
				Source:      strconv.Itoa(north),
				Target:      strconv.Itoa(cur),
				CountRecord: make(map[int64]int64),
			})
			// reversed link
			m.Edges = append(m.Edges, EdgeInfo{
				SourceNode:  &m.Nodes[cur],
				TargetNode:  &m.Nodes[north],
				Source:      strconv.Itoa(cur),
				Target:      strconv.Itoa(north),
				CountRecord: make(map[int64]int64),
			})
		}
	}
	// Horizontal direction
	for i := 0; i < row; i++ {
		for j := 1; j < col; j++ {
			cur := i*col + j
			left := cur - 1
			m.Edges = append(m.Edges, EdgeInfo{
				SourceNode:  &m.Nodes[left],
				TargetNode:  &m.Nodes[cur],
				Source:      strconv.Itoa(left),
				Target:      strconv.Itoa(cur),
				CountRecord: make(map[int64]int64),
			})
			// reversed link
			m.Edges = append(m.Edges, EdgeInfo{
				SourceNode:  &m.Nodes[cur],
				TargetNode:  &m.Nodes[left],
				Source:      strconv.Itoa(cur),
				Target:      strconv.Itoa(left),
				CountRecord: make(map[int64]int64),
			})
		}
	}
}

func (m *MeshInfo) RandomEdges() []byte {
	rand.Seed(time.Now().Unix())
	for i := range m.Edges {
		m.Edges[i].UpdateValue((int64)(rand.Intn(10)))
		m.Edges[i].Details = strconv.Itoa(rand.Intn(50))
	}
	output, err := json.Marshal(m.Edges)
	if err != nil {
		panic(err)
	}
	return output
}

func (m *MeshInfo) InitMesh() {
	m.InitNodes()
	m.InitEdgePool()
}

func (m *MeshInfo) InstInitiate() []byte {
	output, err := json.Marshal(m)
	if err != nil {
		panic(err)
	}
	return output
}

func (m *MeshInfo) InstEdges() []byte {
	output, err := json.Marshal(m.Edges)
	if err != nil {
		panic(err)
	}
	return output
}

func (m *MeshInfo) CleanEdgeValueInfo() {
	for i := range m.Edges {
		e := &m.Edges[i]
		e.Value = 0
	}
}

// query the counts of all channels across the mesh during [time, time + 1)
func (m *MeshInfo) QueryTimeSliceAndAppend(time int64) {
	if _, ok := m.Edges[0].CountRecord[time]; ok {
		// if the time slice is queried before
		for i := range m.Edges {
			e := &m.Edges[i]
			e.Value += e.CountRecord[time]
		}
	} else {
		for i := range m.Edges {
			e := &m.Edges[i]
			count := redisReader.Query(FormatChannelName(e), time, time+1)
			// if count != 0 {
			// 	fmt.Printf("%d: %d@%s\n", count, time, FormatChannelName(e))
			// }
			e.CountRecord[time] = count
			e.Value += count // store counts in `Value` temporally
		}
	}
}

func (m *MeshInfo) NormalizeAndGenerateEdgeInfo() {
	var max int64 = 0
	for i := range m.Edges {
		e := &m.Edges[i]
		val := e.Value
		e.Details = fmt.Sprintf("exact count: %d", val)
		if max < val {
			max = val
		}
	}

	for i := range m.Edges {
		e := &m.Edges[i]
		if max != 0 {
			e.Value = e.Value * 9 / max // normalize
		} // else `Value` must be zero
	}
}

// Response for range [from, to) instruction
func (m *MeshInfo) InstRange(from, to int64) []byte {
	m.CleanEdgeValueInfo()
	for time := from; time < to; time++ {
		m.QueryTimeSliceAndAppend(time)
	}
	m.NormalizeAndGenerateEdgeInfo()

	output, err := json.Marshal(m.Edges)
	if err != nil {
		panic(err)
	}
	return output
}

func (m *MeshInfo) InstProgress() []byte {
	// TODO
	return []byte("")
}

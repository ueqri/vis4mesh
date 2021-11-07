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

type NodeInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	X    int    `json:"xid"`
	Y    int    `json:"yid"`
}

type EdgeInfo struct {
	SourceNode  *NodeInfo                    `json:"-"`
	TargetNode  *NodeInfo                    `json:"-"`
	CountRecord map[int64](map[string]int64) `json:"-"`
	LinkName    string                       `json:"-"`
	Source      string                       `json:"source"`
	Target      string                       `json:"target"`
	Value       map[string]int64             `json:"value"`
	Details     string                       `json:"details"`
}

type MeshInfo struct {
	Nodes []NodeInfo `json:"nodes"`
	Edges []EdgeInfo `json:"edges"`
}

func StringInt64MapValueAdd(
	dst map[string]int64,
	src map[string]int64,
) map[string]int64 {
	for k, v := range src {
		if _, ok := dst[k]; !ok {
			panic("Source map has a unique key not existing in destination map")
		}
		dst[k] += v
	}
	return dst
}

func (e *EdgeInfo) UpdateValue(val map[string]int64) {
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
				CountRecord: make(map[int64](map[string]int64)),
				Value:       make(map[string]int64),
			})
			// reversed link
			m.Edges = append(m.Edges, EdgeInfo{
				SourceNode:  &m.Nodes[cur],
				TargetNode:  &m.Nodes[north],
				Source:      strconv.Itoa(cur),
				Target:      strconv.Itoa(north),
				CountRecord: make(map[int64](map[string]int64)),
				Value:       make(map[string]int64),
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
				CountRecord: make(map[int64](map[string]int64)),
				Value:       make(map[string]int64),
			})
			// reversed link
			m.Edges = append(m.Edges, EdgeInfo{
				SourceNode:  &m.Nodes[cur],
				TargetNode:  &m.Nodes[left],
				Source:      strconv.Itoa(cur),
				Target:      strconv.Itoa(left),
				CountRecord: make(map[int64](map[string]int64)),
				Value:       make(map[string]int64),
			})
		}
	}
}

func randomValueMap() map[string]int64 {
	val := make(map[string]int64)
	for _, msgType := range queriedMsgTypes {
		val[msgType] = (int64)(rand.Intn(10))
	}
	return val
}

func (m *MeshInfo) RandomEdges() []byte {
	rand.Seed(time.Now().Unix())
	for i := range m.Edges {
		m.Edges[i].UpdateValue(randomValueMap())
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
		e.Value = make(map[string]int64)
		for _, msgType := range queriedMsgTypes {
			e.Value[msgType] = 0
		}
	}
}

// query the counts of all channels across the mesh during [time, time + 1)
func (m *MeshInfo) QueryTimeSliceAndAppend(time int64) {
	if _, ok := m.Edges[0].CountRecord[time]; ok {
		// if the time slice is queried before
		for i := range m.Edges {
			e := &m.Edges[i]
			e.Value = StringInt64MapValueAdd(e.Value, e.CountRecord[time])
		}
	} else {
		for i := range m.Edges {
			e := &m.Edges[i]
			from := [3]int{e.SourceNode.X, e.SourceNode.Y, 0}
			to := [3]int{e.TargetNode.X, e.TargetNode.Y, 0}
			count := redisReader.Query(from, to, time, time+1)
			e.CountRecord[time] = count
			// store counts in `Value` temporally
			e.Value = StringInt64MapValueAdd(e.Value, e.CountRecord[time])
		}
	}
}

// Deprecated: Normalize in frontend side
// func (m *MeshInfo) NormalizeAndGenerateEdgeInfo() {
// 	var max int64 = 0
// 	for i := range m.Edges {
// 		e := &m.Edges[i]
// 		val := e.Value
// 		e.Details = fmt.Sprintf("exact count: %d", val)
// 		if max < val {
// 			max = val
// 		}
// 	}

// 	for i := range m.Edges {
// 		e := &m.Edges[i]
// 		if max != 0 {
// 			e.Value = e.Value * 9 / max // normalize
// 		} // else `Value` must be zero
// 	}
// }

// Response for range [from, to) instruction
func (m *MeshInfo) InstRange(from, to int64) []byte {
	m.CleanEdgeValueInfo()
	for time := from; time < to; time++ {
		m.QueryTimeSliceAndAppend(time)
	}
	// m.NormalizeAndGenerateEdgeInfo()

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

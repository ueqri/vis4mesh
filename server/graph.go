package main

import (
	"fmt"
	"strconv"
)

type NodeInfo struct {
	X      int    `json:"-"`
	Y      int    `json:"-"`
	ID     string `json:"id"`
	Name   string `json:"label,omitempty"`
	Detail string `json:"detail"`
}

type EdgeInfo struct {
	SourceNode  *NodeInfo                    `json:"-"`
	TargetNode  *NodeInfo                    `json:"-"`
	CountRecord map[int64](map[string]int64) `json:"-"`
	Source      string                       `json:"source"`
	Target      string                       `json:"target"`
	Value       map[string]int64             `json:"value"`
	LinkName    string                       `json:"label,omitempty"`
	Detail      string                       `json:"detail"`
}

type MeshInfo struct {
	Meta  map[string]string `json:"meta"`
	Nodes []NodeInfo        `json:"nodes"`
	Edges []EdgeInfo        `json:"edges"`
}

func (e *EdgeInfo) SumValue() (sum int64) {
	for _, msgType := range queriedMsgTypes {
		sum += e.Value[msgType]
	}
	return
}

func (e *EdgeInfo) UpdateValue(val map[string]int64) {
	e.Value = val
}

func (m *MeshInfo) ParseMeta() (col, row int, slice float64) {
	col, err := strconv.Atoi(m.Meta["width"])
	if err != nil {
		panic(err)
	}
	row, err = strconv.Atoi(m.Meta["height"])
	if err != nil {
		panic(err)
	}
	slice, err = strconv.ParseFloat(m.Meta["slice"], 64)
	if err != nil {
		panic(err)
	}
	return
}

func (m *MeshInfo) initNodes() {
	col, row, _ := m.ParseMeta()
	for i := 0; i < row; i++ {
		for j := 0; j < col; j++ {
			nodeIdx := i*col + j
			m.Nodes = append(m.Nodes, NodeInfo{
				X:      i,
				Y:      j,
				ID:     strconv.Itoa(nodeIdx),
				Name:   fmt.Sprintf("Sw%d", nodeIdx),
				Detail: fmt.Sprintf("Sw[%d, %d]", i, j), // TODO: use node type
			})
		}
	}
}

func (m *MeshInfo) initEdgePool() {
	col, row, _ := m.ParseMeta()
	// Vertical direction
	for i := 1; i < row; i++ {
		for j := 0; j < col; j++ {
			cur := i*col + j
			north := cur - col
			m.Edges = append(m.Edges, EdgeInfo{
				SourceNode:  &m.Nodes[north],
				TargetNode:  &m.Nodes[cur],
				CountRecord: make(map[int64](map[string]int64)),
				Source:      strconv.Itoa(north),
				Target:      strconv.Itoa(cur),
				Value:       make(map[string]int64),
				// `label` is not used in backend, to display the
				// counts of certain msg types in frontend instead
				LinkName: "",
				// `detail` is mainly used to display the details of
				// each message type in frontend, here is only an
				// trivial example to show information about an edge
				Detail: "normal edge",
			})
			// reversed link
			m.Edges = append(m.Edges, EdgeInfo{
				SourceNode:  &m.Nodes[cur],
				TargetNode:  &m.Nodes[north],
				CountRecord: make(map[int64](map[string]int64)),
				Source:      strconv.Itoa(cur),
				Target:      strconv.Itoa(north),
				Value:       make(map[string]int64),
				LinkName:    "",
				Detail:      "normal edge",
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
				CountRecord: make(map[int64](map[string]int64)),
				Source:      strconv.Itoa(left),
				Target:      strconv.Itoa(cur),
				Value:       make(map[string]int64),
				LinkName:    "",
				Detail:      "normal edge",
			})
			// reversed link
			m.Edges = append(m.Edges, EdgeInfo{
				SourceNode:  &m.Nodes[cur],
				TargetNode:  &m.Nodes[left],
				CountRecord: make(map[int64](map[string]int64)),
				Source:      strconv.Itoa(cur),
				Target:      strconv.Itoa(left),
				Value:       make(map[string]int64),
				LinkName:    "",
				Detail:      "normal edge",
			})
		}
	}
}

func (m *MeshInfo) Init(width, height int, timeSlice float64, elapse int64) {
	// initiate meta
	m.Meta = make(map[string]string)
	m.Meta["width"] = fmt.Sprintf("%d", width)
	m.Meta["height"] = fmt.Sprintf("%d", height)
	m.Meta["slice"] = fmt.Sprintf("%.9f", timeSlice)
	m.Meta["elapse"] = fmt.Sprintf("%d", elapse) // time slice count of simulation

	m.initNodes()
	m.initEdgePool()
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

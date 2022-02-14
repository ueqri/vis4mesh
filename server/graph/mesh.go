package graph

import (
	"fmt"
)

// Uint16 for node coordinate, [0, 65535]
// Uint32 for node ID, [0, 4294967295]
// Uint64 for message count, [0, ~1.8 * 10^19]
// Uint for time slice, on 64-bit machine equals to Uint64

type NodeInfo struct {
	// Data only for backend compution
	X uint16 `json:"-"`
	Y uint16 `json:"-"`

	// Data for JSON-format serialization to feed frontend as node info
	ID     uint32 `json:"id"`
	Name   string `json:"label,omitempty"`
	Detail string `json:"detail"`
}

type EdgeInfo struct {
	// Data only for backend compution
	SourceNode  *NodeInfo    `json:"-"`
	TargetNode  *NodeInfo    `json:"-"`
	CountBuffer []([]uint64) `json:"-"`

	// Data for JSON-format serialization to feed frontend as edge info
	Source   uint32   `json:"source"`
	Target   uint32   `json:"target"`
	Value    []uint64 `json:"value"`
	LinkName string   `json:"label,omitempty"`
	Detail   string   `json:"detail"`
}

type MeshInfo struct {
	width  uint16            `json:"-"`
	height uint16            `json:"-"`
	elapse uint              `json:"-"`
	Meta   map[string]string `json:"meta"`
	Nodes  []NodeInfo        `json:"nodes"`
	Edges  []EdgeInfo        `json:"edges"`
}

func (m *MeshInfo) initNodes() {
	col, row := m.width, m.height
	var i, j uint16
	var nodeIdx uint32
	for i = 0; i < row; i++ {
		for j = 0; j < col; j++ {
			nodeIdx = uint32(i)*uint32(col) + uint32(j)
			m.Nodes = append(m.Nodes, NodeInfo{
				X:      i,
				Y:      j,
				ID:     nodeIdx,
				Name:   fmt.Sprintf("Sw%d", nodeIdx),
				Detail: fmt.Sprintf("Sw[%d, %d]", i, j), // TODO: use node type
			})
		}
	}
}

func (m *MeshInfo) initEdgePool() {
	col, row := m.width, m.height
	// Vertical direction
	var i, j uint16
	var cur uint32
	for i = 1; i < row; i++ {
		for j = 0; j < col; j++ {
			cur = uint32(i)*uint32(col) + uint32(j)
			north := cur - uint32(col)
			m.Edges = append(m.Edges, EdgeInfo{
				SourceNode:  &m.Nodes[north],
				TargetNode:  &m.Nodes[cur],
				CountBuffer: make([]([]uint64), m.elapse),
				Source:      north,
				Target:      cur,
				Value:       make([]uint64, 0),
				// `label` is not used in backend, to display the
				// counts of certain msg types in frontend instead
				LinkName: "",
				// `detail` is mainly used to display the details of
				// each message type in frontend, here is only an
				// trivial example to show information about an edge
				Detail: "normal",
			})
			// reversed link
			m.Edges = append(m.Edges, EdgeInfo{
				SourceNode:  &m.Nodes[cur],
				TargetNode:  &m.Nodes[north],
				CountBuffer: make([]([]uint64), m.elapse),
				Source:      cur,
				Target:      north,
				Value:       make([]uint64, 0),
				LinkName:    "",
				Detail:      "normal",
			})
		}
	}
	// Horizontal direction
	for i = 0; i < row; i++ {
		for j = 1; j < col; j++ {
			cur = uint32(i)*uint32(col) + uint32(j)
			left := cur - 1
			m.Edges = append(m.Edges, EdgeInfo{
				SourceNode:  &m.Nodes[left],
				TargetNode:  &m.Nodes[cur],
				CountBuffer: make([]([]uint64), m.elapse),
				Source:      left,
				Target:      cur,
				Value:       make([]uint64, 0),
				LinkName:    "",
				Detail:      "normal",
			})
			// reversed link
			m.Edges = append(m.Edges, EdgeInfo{
				SourceNode:  &m.Nodes[cur],
				TargetNode:  &m.Nodes[left],
				CountBuffer: make([]([]uint64), m.elapse),
				Source:      cur,
				Target:      left,
				Value:       make([]uint64, 0),
				LinkName:    "",
				Detail:      "normal",
			})
		}
	}
}

func (m *MeshInfo) CleanEdgeValueInfo() {
	for i := range m.Edges {
		e := &m.Edges[i]
		e.Value = make([]uint64, numQueriedMsgTypes)
	}
}

func (m *MeshInfo) Init(width, height uint16, timeSlice float64, elapse uint) {
	m.width = width
	m.height = height
	m.elapse = elapse

	m.Meta = make(map[string]string)
	m.Meta["width"] = fmt.Sprintf("%d", width)
	m.Meta["height"] = fmt.Sprintf("%d", height)
	m.Meta["slice"] = fmt.Sprintf("%.9f", timeSlice)
	m.Meta["elapse"] = fmt.Sprintf("%d", elapse) // time slice count of simulation

	m.initNodes()
	m.initEdgePool()
}

package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"os"
	"strconv"
	"time"
)

const (
	col       int     = 8
	row       int     = 8
	totalTime float64 = 0.000010543
	slice     float64 = 0.000001000
)

var maxCount int64

func FormatChannelName(e *EdgeInfo) string {
	return fmt.Sprintf(
		"GPU1.GPU1_SW_%d_%d_0_Port[0-4]-GPU1_SW_%d_%d_0_Port[0-4]",
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
	SourceNode *NodeInfo `json:"-"`
	TargetNode *NodeInfo `json:"-"`
	ValueList  []int64   `json:"-"`
	LinkName   string    `json:"-"`
	Source     string    `json:"source"`
	Target     string    `json:"target"`
	Value      int64     `json:"value"`
	Details    string    `json:"details"`
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
				SourceNode: &m.Nodes[north],
				TargetNode: &m.Nodes[cur],
				Source:     strconv.Itoa(north),
				Target:     strconv.Itoa(cur),
			})
			// reversed link
			m.Edges = append(m.Edges, EdgeInfo{
				SourceNode: &m.Nodes[cur],
				TargetNode: &m.Nodes[north],
				Source:     strconv.Itoa(cur),
				Target:     strconv.Itoa(north),
			})
		}
	}
	// Horizontal direction
	for i := 0; i < row; i++ {
		for j := 1; j < col; j++ {
			cur := i*col + j
			left := cur - 1
			m.Edges = append(m.Edges, EdgeInfo{
				SourceNode: &m.Nodes[left],
				TargetNode: &m.Nodes[cur],
				Source:     strconv.Itoa(left),
				Target:     strconv.Itoa(cur),
			})
			// reversed link
			m.Edges = append(m.Edges, EdgeInfo{
				SourceNode: &m.Nodes[cur],
				TargetNode: &m.Nodes[left],
				Source:     strconv.Itoa(cur),
				Target:     strconv.Itoa(left),
			})
		}
	}
}

func JSONPrettyPrint(in []byte) string {
	var out bytes.Buffer
	err := json.Indent(&out, []byte(in), "", "\t")
	if err != nil {
		panic(err)
	}
	return out.String()
}

func WriteStringToFile(data, file string) {
	f, err := os.Create(file)
	if err != nil {
		log.Fatal(err)
	}

	writer := bufio.NewWriter(f)
	defer f.Close()

	fmt.Fprintln(writer, data)
	writer.Flush()
}

func (m *MeshInfo) RandomEdges() []byte {
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
	rand.Seed(time.Now().Unix())
	// for i := range m.Edges {
	// 	go func(e *EdgeInfo) {
	// 		var t float64 = 0.000000000
	// 		for t < totalTime {
	// 			count := queryEachChannel(FormatChannelName(e), t, t+slice)
	// 			e.ValueList = append(e.ValueList, count)
	// 			t += slice
	// 		}
	// 	}(&m.Edges[i])
	// }
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

func instRange(from, to int64) string {
	// SQLCompute()
	return ""
}

func instProgress() string {
	return ""
	// return fmt.Sprintf("%d %", processed/totalTime)
}

package main

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"time"
)

// Response for init instruction
func (m *MeshInfo) InstInitiate() []byte {
	m.CleanEdgeValueInfo()
	output, err := json.Marshal(m)
	if err != nil {
		panic(err)
	}
	return output
}

// Response for range [from, to) instruction
func (m *MeshInfo) InstRange(from, to int64) []byte {
	// `range 0 0` as an alias of init instruction
	if from <= 0 && to <= 0 {
		return m.InstInitiate()
	}

	m.CleanEdgeValueInfo()

	for time := from; time < to; time++ {
		m.QueryTimeSliceAndAppend(time)
	}

	output, err := json.Marshal(m)
	if err != nil {
		panic(err)
	}
	return output
}

func (m *MeshInfo) InstRandom() []byte {
	m.CleanEdgeValueInfo()
	rand.Seed(time.Now().Unix())

	for i := range m.Edges {
		m.Edges[i].UpdateValue(randomValueMap())
		m.Edges[i].Detail = fmt.Sprintf("Sum: %d", m.Edges[i].SumValue())
		m.Edges[i].LinkName = fmt.Sprintf("%d", m.Edges[i].SumValue())
	}

	output, err := json.Marshal(m)
	if err != nil {
		panic(err)
	}
	return output
}

// Potential instrcution to get only nodes
func (m *MeshInfo) InstNodes() []byte {
	output, err := json.Marshal(m.Nodes)
	if err != nil {
		panic(err)
	}
	return output
}

// Potential instrcution to get only edges
func (m *MeshInfo) InstEdges() []byte {
	output, err := json.Marshal(m.Edges)
	if err != nil {
		panic(err)
	}
	return output
}

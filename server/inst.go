package main

import (
	"fmt"
	"log"
	"math/rand"
	"time"
)

// Response for init instruction
func (m *MeshInfo) InstInitiate() []byte {
	m.CleanEdgeValueInfo()
	return JSONToBytes(m)
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

	return JSONToBytes(m)
}

func (m *MeshInfo) InstRandom() []byte {
	m.CleanEdgeValueInfo()
	rand.Seed(time.Now().Unix())

	for i := range m.Edges {
		m.Edges[i].UpdateValue(randomValueMap())
		m.Edges[i].Detail = fmt.Sprintf("Sum: %d", m.Edges[i].SumValue())
		m.Edges[i].LinkName = fmt.Sprintf("%d", m.Edges[i].SumValue())
	}

	return JSONToBytes(m)
}

func (f *FlatInfo) InstFlat(m *MeshInfo, frameSize int) []byte {
	f.snapshots = f.snapshots[:0]
	log.Printf("flat %d start", frameSize)
	var frameIdx int64
	var timeElapse int64 = 52
	var now int64 = 0
	for ; now < timeElapse; frameIdx++ {
		f.QuerySnapshotOfFrame(m, now, frameSize, frameIdx)
		now += int64(frameSize)
	}
	log.Printf("flat %d done", frameSize)
	return JSONToBytes(f.snapshots)
}

// Potential instrcution to get only nodes
func (m *MeshInfo) InstNodes() []byte {
	return JSONToBytes(m.Nodes)
}

// Potential instrcution to get only edges
func (m *MeshInfo) InstEdges() []byte {
	return JSONToBytes(m.Edges)
}

package graph

import (
	"fmt"
	"io/ioutil"
	"path/filepath"
	"strconv"

	"github.com/ueqri/vis4mesh/server/util"
	"gitlab.com/akita/util/v2/tracing"
)

type Graph struct {
	mesh    *tracing.MeshInfo
	dirRoot string
}

func MakeGraph(dirRoot string) *Graph {
	return &Graph{
		mesh:    tracing.MakeMeshInfoFromFiles(dirRoot),
		dirRoot: dirRoot,
	}
}

func (g *Graph) DumpFlatInfoToBytes() []byte {
	flat := filepath.Join(g.dirRoot, "flat.json")
	if util.CheckFileExist(flat) {
		content, err := ioutil.ReadFile(flat)
		if err != nil {
			panic(err)
		}
		return content
	} else {
		panic(fmt.Sprintf("`%s` is not existed and flat info is not loaded", flat))
	}
}

func (g *Graph) DumpMeshMetaToBytes() []byte {
	return util.JSONToBytes(g.mesh.Meta)
}

// TODO: use zipped format in akita/util and support end-to-end data forward,
// which saves disk storage of metrics and improve intermediate processing
// overhead.

func (g *Graph) DumpNodeInfoToZippedBytes() []byte {
	arr := make([]string, 0, len(g.mesh.Nodes)*3)
	for _, node := range g.mesh.Nodes {
		id := strconv.FormatUint(uint64(node.ID), 10)
		// ... ID, Name, Detail ...
		arr = append(arr, id, node.Name, node.Detail)
	}
	return util.JSONToBytes(arr)
}

func (g *Graph) DumpEdgeInfoToZippedBytes() []byte {
	numMsgTypes := tracing.NumMeshMsgTypesToTrace
	offsetOneEdge := 4 + numMsgTypes
	arr := make([]string, 0, len(g.mesh.Edges)*offsetOneEdge)
	for _, edge := range g.mesh.Edges {
		src := strconv.FormatUint(uint64(edge.Source), 10)
		tgt := strconv.FormatUint(uint64(edge.Target), 10)
		// ... Source, Target, Value[0], ..., Value[n], LinkName, Detail ...
		arr = append(arr, src, tgt)
		for idx := 0; idx < numMsgTypes; idx++ {
			val := strconv.FormatUint(edge.Value[idx], 10)
			arr = append(arr, val)
		}
		arr = append(arr, edge.LinkName, edge.Detail)
	}
	return util.JSONToBytes(arr)
}

func (g *Graph) CleanState() {
	g.mesh.MoveMeshToTimeRange(0, 0)
}

func (g *Graph) MoveToTimeRange(from, to uint) {
	g.mesh.MoveMeshToTimeRange(from, to)
}

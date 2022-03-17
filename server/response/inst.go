package response

import "fmt"

var cleanState bool = false

// Response for init instruction
func (r *WebSocketResponse) InstInitiate(what string) []byte {
	if !cleanState {
		r.model.CleanState()
		cleanState = true // init inst always keeps the graph state clean
	}
	switch what {
	case "meta":
		return r.model.DumpMeshMetaToBytes()
	case "node":
		return r.model.DumpNodeInfoToZippedBytes()
	case "edge":
		return r.model.DumpEdgeInfoToZippedBytes()
	default:
		panic("Invalid init-type instruction [ " + what + " ]")
	}
}

// Response of zipped edges for range [from, to) instruction
func (r *WebSocketResponse) InstRangeReturnZippedEdges(from, to uint) []byte {
	// `range 0 0` as an alias of init instruction
	if from <= 0 && to <= 0 {
		panic(fmt.Sprintf("Invalid range-type instruction [ %d, %d ]", from, to))
	}

	if !cleanState {
		r.model.CleanState()
	}

	cleanState = false // range inst always keeps the graph state dirty

	r.model.MoveToTimeRange(from, to)

	return r.model.DumpEdgeInfoToZippedBytes()
}

func (r *WebSocketResponse) InstFlat(frameSize uint) []byte {
	if frameSize != 1 {
		panic("Vis4Mesh server only support frame size 1 for mesh flat so far")
	}
	return r.model.DumpFlatInfoToBytes()
}

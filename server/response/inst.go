package response

import "fmt"

var cleanState bool = false

// Response for init instruction
func (r *WebSocketResponse) InstInitiate(what string) []byte {
	if !cleanState {
		r.model.CleanMeshEdgeValueInfo()
		cleanState = true
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
		r.model.CleanMeshEdgeValueInfo()
	}

	for time := from; time < to; time++ {
		r.model.QueryTimeSliceAndAppend(time)
	}

	return r.model.DumpEdgeInfoToZippedBytes()
}

func (r *WebSocketResponse) InstFlat(frameSize uint) []byte {
	if frameSize != 1 {
		panic("Vis4Mesh server only support frame size 1 for mesh flat so far")
	}

	if !cleanState {
		r.model.CleanMeshEdgeValueInfo()
	}

	avail := r.model.CheckAvailableFrameSizeOfFlatInfo()
	if avail > 0 {
		if uint(avail) == frameSize {
			return r.model.DumpFlatInfoToBytes()
		} else {
			go r.model.AsyncGenerateFlatInfo(frameSize)
		}
	}
	return []byte("!wait")
}

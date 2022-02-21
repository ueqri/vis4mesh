package response

type Model interface {
	CleanState()
	MergeEdgesDuringTimeSlice(time uint)
	CheckAvailableFrameSizeOfFlatInfo() int
	AsyncGenerateFlatInfo(frameSize uint)

	DumpMeshMetaToBytes() []byte
	DumpNodeInfoToZippedBytes() []byte
	DumpEdgeInfoToZippedBytes() []byte
	DumpFlatInfoToBytes() []byte
}

type WebSocketResponse struct {
	model Model
}

func MakeWebSocketResponse(model Model) *WebSocketResponse {
	return &WebSocketResponse{
		model: model,
	}
}

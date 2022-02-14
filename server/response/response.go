package response

import "github.com/ueqri/vis4mesh/server/graph"

type WebSocketResponse struct {
	model *graph.Graph
}

func MakeWebSocketResponse(model *graph.Graph) *WebSocketResponse {
	return &WebSocketResponse{
		model: model,
	}
}

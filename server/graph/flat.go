package graph

type Snapshot struct {
	FrameIdx         uint   `json:"id"`
	MsgExactType     string `json:"type"`
	MsgTypeGroup     string `json:"group"`
	MsgDataOrCommand string `json:"doc"`
	Count            uint64 `json:"count"`
}

type FlatInfo struct {
	snapshots []Snapshot
}

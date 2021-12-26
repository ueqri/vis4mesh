package main

type Snapshot struct {
	FrameIdx         int64  `json:"id"`
	MsgExactType     string `json:"type"`
	MsgTypeGroup     string `json:"group"`
	MsgDataOrCommand string `json:"doc"`
	Count            int64  `json:"count"`
}

type FlatInfo struct {
	snapshots []Snapshot
}

// query count of certain msg type across mesh during [time, time + frameSize)
func (f *FlatInfo) QuerySnapshotOfFrame(
	m *MeshInfo, time int64, frameSize int, frameIdx int64,
) {
	snapshots := make(map[string]*Snapshot, len(queriedMsgTypes))
	for _, msgType := range queriedMsgTypes {
		snapshots[msgType] = &Snapshot{
			FrameIdx:         frameIdx,
			MsgExactType:     msgType,
			MsgTypeGroup:     msgTypesGroupMap[msgType],
			MsgDataOrCommand: msgDataOrCommandMap[msgType],
			Count:            0,
		}
	}

	for fill := 0; fill < frameSize; fill++ {
		now := time + int64(fill)
		if _, ok := m.Edges[0].CountRecord[now]; ok {
			// if current time slice is queried before
			for i := range m.Edges {
				e := &m.Edges[i]
				for msgType, count := range e.CountRecord[now] {
					snapshots[msgType].Count += count
				}
			}
		} else {
			for i := range m.Edges {
				e := &m.Edges[i]
				from := [3]int{e.SourceNode.X, e.SourceNode.Y, 0}
				to := [3]int{e.TargetNode.X, e.TargetNode.Y, 0}
				count := redisReader.Query(from, to, now, now+1)
				e.CountRecord[now] = count
				// sum the count of certain msg type across the mesh
				for msgType, count := range e.CountRecord[now] {
					snapshots[msgType].Count += count
				}
			}
		}
	}

	for _, msgType := range queriedMsgTypes {
		f.snapshots = append(f.snapshots, *snapshots[msgType])
	}
}

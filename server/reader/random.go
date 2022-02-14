package reader

import (
	"math/rand"
	"time"

	"github.com/ueqri/vis4mesh/server/stateless"
)

type RandomReader struct{}

func (r *RandomReader) Init() {
	rand.Seed(time.Now().Unix())
}

func (r *RandomReader) Query(
	fromTile, toTile [3]int, time uint,
) map[string]uint64 {
	count := make(map[string]uint64)
	queriedMsgTypes := stateless.GetQueriedMsgTypesList()
	for _, msgType := range queriedMsgTypes {
		count[msgType] = (uint64)(rand.Intn(10))
	}
	return count
}

func (r *RandomReader) GetMaxTimeSlice() uint {
	return (uint)(rand.Intn(15))
}

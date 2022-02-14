package reader

type Reader interface {
	Init()
	Query(fromTile, toTile [3]int, time uint) []uint64
	GetMaxTimeSlice() uint
}

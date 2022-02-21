package archive

import (
	"fmt"
	"path/filepath"

	util "github.com/ueqri/vis4mesh/server/stateless"
)

type LoadedArchive struct {
	cleaned bool
}

func LoadArchive(path string) *LoadedArchive {
	path = util.ExpandTilde(path)

	a := &LoadedArchive{
		cleaned: false,
	}
	checkArchiveIntegrity(path)
	return a
}

func (a *LoadedArchive) CleanState() {
	a.cleaned = true
}

func (a *LoadedArchive) MergeEdgesDuringTimeSlice(time uint) {

}

func (a *LoadedArchive) CheckAvailableFrameSizeOfFlatInfo() int {
	return 0
}

func (a *LoadedArchive) AsyncGenerateFlatInfo(frameSize uint) {

}

func (a *LoadedArchive) DumpMeshMetaToBytes() []byte {
	return nil
}

func (a *LoadedArchive) DumpNodeInfoToZippedBytes() []byte {
	return nil
}

func (a *LoadedArchive) DumpEdgeInfoToZippedBytes() []byte {
	return nil
}

func (a *LoadedArchive) DumpFlatInfoToBytes() []byte {
	return nil
}

func checkArchiveIntegrity(path string) {
	if !util.CheckDirectoryExist(path) {
		panic(fmt.Sprintf("%s is not existed", path))
	}

	// meta
	meta := filepath.Join(path, "meta.json")
	if !util.CheckFileExist(meta) {
		panic(fmt.Sprintf("Meta file expected in %s is not existed", meta))
	}

	// flat
	flat := filepath.Join(path, "flat.json")
	if !util.CheckFileExist(flat) {
		panic(fmt.Sprintf("Flat file expected in %s is not existed", flat))
	}

	// range

}

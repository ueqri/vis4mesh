package stateless

var queriedMsgTypes = []string{
	"*cache.FlushReq",
	"*cache.FlushRsp",
	"*mem.DataReadyRsp",
	"*mem.ReadReq",
	"*mem.WriteDoneRsp",
	"*mem.WriteReq",
	"*protocol.FlushReq",
	"*protocol.LaunchKernelReq",
	"*protocol.MapWGReq",
	// "*protocol.MemCopyD2HReq",
	// "*protocol.MemCopyH2DReq",
	"*protocol.WGCompletionMsg",
	"*vm.TranslationReq",
	"*vm.TranslationRsp",
}

var msgTypesGroupMap = map[string]string{
	"*cache.FlushReq":           "Others",
	"*cache.FlushRsp":           "Others",
	"*mem.DataReadyRsp":         "Read",
	"*mem.ReadReq":              "Read",
	"*mem.WriteDoneRsp":         "Write",
	"*mem.WriteReq":             "Write",
	"*protocol.FlushReq":        "Others",
	"*protocol.LaunchKernelReq": "Others",
	"*protocol.MapWGReq":        "Others",
	"*protocol.WGCompletionMsg": "Others",
	"*vm.TranslationReq":        "Translation",
	"*vm.TranslationRsp":        "Translation",
}

var msgDataOrCommandMap = map[string]string{
	"*cache.FlushReq":           "C",
	"*cache.FlushRsp":           "C",
	"*mem.DataReadyRsp":         "D",
	"*mem.ReadReq":              "C",
	"*mem.WriteDoneRsp":         "C",
	"*mem.WriteReq":             "D",
	"*protocol.FlushReq":        "C",
	"*protocol.LaunchKernelReq": "C",
	"*protocol.MapWGReq":        "C",
	"*protocol.WGCompletionMsg": "C",
	"*vm.TranslationReq":        "C",
	"*vm.TranslationRsp":        "D",
}

func GetQueriedMsgTypesList() []string {
	return queriedMsgTypes
}

func GetGroupNameFromMsgTypeID(id uint8) string {
	return msgTypesGroupMap[queriedMsgTypes[id]]
}

func GetGroupNameFromMsgTypeString(str string) string {
	return msgTypesGroupMap[str]
}

func GetDataOrCommandFromMsgTypeID(id uint8) string {
	return msgDataOrCommandMap[queriedMsgTypes[id]]
}

func GetDataOrCommandFromMsgTypeString(str string) string {
	return msgDataOrCommandMap[str]
}

// TODO: use msg type ID instead of string in map

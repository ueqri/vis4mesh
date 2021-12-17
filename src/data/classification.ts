export const MsgGroupsDomain = ["Translation", "Read", "Write", "Others"];
export const NumMsgGroups = MsgGroupsDomain.length;

export const MsgGroupsMap: Object = {
  "*cache.FlushReq": "Others",
  "*cache.FlushRsp": "Others",
  "*mem.DataReadyRsp": "Read",
  "*mem.ReadReq": "Read",
  "*mem.WriteDoneRsp": "Write",
  "*mem.WriteReq": "Write",
  "*protocol.FlushReq": "Others",
  "*protocol.LaunchKernelReq": "Others",
  "*protocol.MapWGReq": "Others",
  "*protocol.WGCompletionMsg": "Others",
  "*vm.TranslationReq": "Translation",
  "*vm.TranslationRsp": "Translation",
};

export const MsgTypes = Object.keys(MsgGroupsMap);
export const NumMsgTypes = MsgTypes.length;

export const DataOrCommandMap: Object = {
  "*cache.FlushReq": "C",
  "*cache.FlushRsp": "C",
  "*mem.DataReadyRsp": "D",
  "*mem.ReadReq": "C",
  "*mem.WriteDoneRsp": "C",
  "*mem.WriteReq": "D",
  "*protocol.FlushReq": "C",
  "*protocol.LaunchKernelReq": "C",
  "*protocol.MapWGReq": "C",
  "*protocol.WGCompletionMsg": "C",
  "*vm.TranslationReq": "C",
  "*vm.TranslationRsp": "D",
};

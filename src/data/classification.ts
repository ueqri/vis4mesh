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

function reverseObject(obj: Object): Object {
  const rev = {};
  Object.keys(obj).forEach((key) => {
    if (rev[obj[key]]) {
      rev[obj[key]].push(key);
    } else {
      rev[obj[key]] = [key];
    }
  });
  return rev;
}

export const MsgGroupsReverseMap = reverseObject(MsgGroupsMap);

export const DataOrCommandDomain = ["D", "C"];
export const NumDataOrCommand = DataOrCommandDomain.length;
export const DataOrCommandDomainNameExtend = (v: string) => {
  if (v === "D") {
    return "Data";
  } else if (v === "C") {
    return "Command";
  } else {
    console.error("Invalid input in DataOrCommandDomainNameExtend");
    return "Invalid";
  }
};

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

export const DataOrCommandReverseMap = reverseObject(DataOrCommandMap);

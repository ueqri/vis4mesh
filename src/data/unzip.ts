import { MsgTypes, NumMsgTypes } from "./classification";
import { EdgeData, NodeData, ZippedResponse } from "./data";

export function ZippedResponseToNodeDataArray(d: ZippedResponse): NodeData[] {
  let len: number = d.length;
  // ... ID, Name, Detail ...
  let step: number = 3;
  let nodes = new Array<NodeData>();
  for (let i = 0; i < len; i += step) {
    nodes.push({ id: d[i], label: d[i + 1], detail: d[i + 2] });
  }
  return nodes;
}

export function ZippedResponseToEdgeDataArray(d: ZippedResponse): EdgeData[] {
  let len: number = d.length;
  // ... Source, Target, Value[0], ..., Value[n], LinkName, Detail ...
  let step: number = NumMsgTypes + 4;
  let labelOffset: number = NumMsgTypes + 2;
  let edges = new Array<EdgeData>();
  for (let i = 0; i < len; i += step) {
    let value = new Object();
    MsgTypes.forEach((t, idx) => {
      value[t] = Number(d[i + idx + 2]);
    });
    edges.push({
      source: d[i],
      target: d[i + 1],
      value: value,
      label: d[i + labelOffset],
      detail: d[i + labelOffset + 1],
    });
  }
  return edges;
}

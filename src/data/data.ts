export interface MetaData {
  width: number;
  height: number;
  slice: number;
  elapse: number;
  hops_per_unit: number;
  num_hop_units: number;
}

export interface NodeData {
  id: string;
  label?: string;
  detail: string;
}

export interface EdgeData {
  source: string;
  target: string;
  value: number[];
  label?: string;
  detail: string;
}

export interface SnapShotData {
  id: number; // frame ID
  type: string; // message type
  group: string; // group of the certain message type, e.g. Read, Write
  doc: string; // data or command message, e.g. D, C
  count: number; // count of the certain message type during this frame
  max_flits: number; // maximum channel flit number of the mesh at certain time
  hop_units: number;
  transfer_type: number;
}

export type FlatData = SnapShotData[];

export type DataPortMetaResponse = MetaData;
export type DataPortFlatResponse = FlatData;
export interface DataPortRangeResponse {
  meta: MetaData; // metadata contains graph size, definition of time slice, etc
  nodes: NodeData[];
  edges: EdgeData[];
}

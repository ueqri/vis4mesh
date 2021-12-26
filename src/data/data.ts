export interface NodeData {
  id: string;
  label?: string;
  detail: string;
}

export interface EdgeData {
  source: string;
  target: string;
  value: Object;
  label?: string;
  detail: string;
}

export interface DataPortRangeResponse {
  meta: Object; // metadata contains graph size, definition of time slice, etc
  nodes: NodeData[];
  edges: EdgeData[];
}

export interface SnapShotData {
  id: number; // frame ID
  type: string; // message type
  group: string; // group of the certain message type, e.g. Read, Write
  doc: string; // data or command message, e.g. D, C
  count: number; // count of the certain message type during this frame
}

export type DataPortFlatResponse = SnapShotData[];

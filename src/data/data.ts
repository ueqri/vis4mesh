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

export interface DataPortResponse {
  meta: Object; // metadata contains graph size, definition of time slice, etc
  nodes: NodeData[];
  edges: EdgeData[];
}

export interface RenderEngineNode {
  id: number;
  width: number;
  height: number;
  posX: number;
  posY: number;
  label: RenderEngineLabel;
  fill: string;
  stroke: string;
}

export interface RenderEngineEdge {
  srcX: number;
  dstX: number;
  srcY: number;
  dstY: number;
  level: number; // each level from [0, 9] corresponds to specific color
  width: number;
  label: RenderEngineLabel;
  opacity: number;
  rtl: boolean;
  connection: number[]; // two element, i.e. IDs of source and destination
}

export interface RenderEngineLabel {
  posX: number;
  posY: number;
  text: string;
}

export const ZoomWindowSize = 200;
export const SubDisplaySize = 100;
export const RectCornerRadius = 0.05;
export const ArrowWidth = 5 / 3.8;

export interface RectNode {
  scale: number;
  idx: number;
  idy: number;
  size: number;
  x: number;
  y: number;
  color: string;
  level: number;
}

export interface NodeCaption {
  x: number;
  y: number;
  size: number;
  text: string;
}

export interface LineLink {
  start: RectNode;
  connection: number[];
  idx: number;
  idy: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  value: number;
  dasharray: string;
  direction: number; // S N E W
  colorLevel: number;
  level: number;
  opacity: number;
}

export interface LinkText {
  x: number;
  y: number;
  label: string;
  opacity: number;
}

export interface ClientSize {
  width: number;
  height: number;
}

export const ZoomWindowSize = 50;
export const SubDisplaySize = 200;
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
}

export interface LineLink {
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
  direction: number;
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

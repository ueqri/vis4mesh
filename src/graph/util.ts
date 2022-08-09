import * as d3 from "d3";

const directionY = [0, 0, 1, -1];
const directionX = [1, -1, 0, 0]; // S N E W

export function ReverseMapping(
  coord: number[],
  transform: d3.ZoomTransform
): number[] {
  const scale = transform.k;
  const translate_x = transform.x;
  const translate_y = transform.y;

  const x_ = (coord[0] - translate_x) / scale;
  const y_ = (coord[1] - translate_y) / scale;

  return [x_, y_];
}

export function ColorScheme(lv: number): string {
  // [0, 9] maps Blue-Yellow-Red color platte
  return d3.interpolateReds((lv + 1) / 10);
}

export function GetLinkDst([x, y]: [number, number], direction: number) {
  let dx = x + directionX[direction];
  let dy = y + directionY[direction];
  return `(${dx}, ${dy})`;
}

export function DirectionOffset(
  [x, y]: [number, number],
  direction: number,
  offset: number
): [number, number] {
  switch (direction) {
    case 0:
      return [x, y + offset];
    case 1:
      return [x, y - offset];
    case 2:
      return [x + offset, y];
    case 3:
      return [x - offset, y];
  }
  return [0, 0];
}
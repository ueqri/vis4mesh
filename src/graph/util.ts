import * as d3 from "d3";

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

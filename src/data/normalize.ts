import { EdgeData } from "../data";

// TODO: add different normalize
export function DataNormalize(edges: EdgeData[]) {
  let max: number = 0;
  edges.forEach((e) => {
    if (max < e.dynamicWeight!) {
      max = e.dynamicWeight!;
    }
  });
  edges.forEach((e) => {
    if (max != 0) {
      e.dynamicWeight = Math.round((e.dynamicWeight! * 9) / max);
    }
  });
}

import { EdgeData } from "data/data";
import { MsgTypesInOrder } from "data/classification";

export interface AbstractNode {
  x: number;
  y: number;
  data: number[][];
}

export class AbstractLayer {
  scale: number;
  height: number;
  width: number;
  nodes: AbstractNode[][];

  constructor(
    scale: number,
    height: number,
    width: number,
    edges: EdgeData[],
    subLayer?: AbstractLayer
  ) {
    this.scale = scale;
    this.height = height;
    this.width = width;
    this.nodes = [];
    console.log("build layer scale: ", scale);
    if (scale === 1) {
      this.nodes = this.buildFromFlatData(height, width, edges);
    } else {
      let valuelength = MsgTypesInOrder.length;
      for (let i = 0; i < height; i++) {
        let row: AbstractNode[] = [];
        for (let j = 0; j < width; j++) {
          let value: number[][] = [];
          let si = i * 4;
          let sj = j * 4;

          console.log(subLayer!.nodes[si][sj + 3].data)
          let sum = subLayer!.nodes[si][sj + 3].data[0];
          for (let k = si + 1; k < si + 4; k++) {
            let tile = subLayer!.nodes[k][sj + 3].data[0];
            for (let idx = 0; idx < length; idx++) {
              sum[idx] += tile[idx];
            }
          }
          value.push(sum);
        
          sum = subLayer!.nodes[si][sj].data[1];
          for (let k = si + 1; k < si + 4; k++) {
            let tile = subLayer!.nodes[k][sj].data[1];
            for (let idx = 0; idx < length; idx++) {
              sum[idx] += tile[idx];
            }
          }
          value.push(sum);

          sum = subLayer!.nodes[si+3][sj].data[2];
          for (let k = sj + 1; k < sj + 4; k++) {
            let tile = subLayer!.nodes[si+3][k].data[2];
            for (let idx = 0; idx < length; idx++) {
              sum[idx] += tile[idx];
            }
          }
          value.push(sum);

          sum = subLayer!.nodes[si][sj].data[3];
          for (let k = sj + 1; k < sj + 4; k++) {
            let tile = subLayer!.nodes[si][k].data[3];
            for (let idx = 0; idx < length; idx++) {
              sum[idx] += tile[idx];
            }
          }
          value.push(sum);

          row.push({ x: i, y: j, data: value });
        }
        this.nodes.push(row);
      }
    }
  }

  buildFromFlatData(
    width: number,
    height: number,
    edges: EdgeData[]
  ): AbstractNode[][] {
    let nodes: AbstractNode[][] = [];
    for (let i = 0; i < height; i++) {
      let row: AbstractNode[] = [];
      for (let j = 0; j < width; j++) {
        let value: number[][] = [[], [], [], []];
        row.push({ x: i, y: j, data: value });
      }
      nodes.push(row);
    }
    for (let edge of edges) {
      // deal with flat structre,  a better idea: the order is specific
      let x = Math.floor(parseInt(edge.source) / width);
      let y = parseInt(edge.source) % width;
      let dx = Math.floor(parseInt(edge.target) / width);
      let dy = parseInt(edge.target) % width;
      if (dy === y + 1) {
        nodes[x][y].data[0] = edge.value;
      } else if (dy === y - 1) {
        nodes[x][y].data[1] = edge.value;
      } else if (dx === x + 1) {
        nodes[x][y].data[2] = edge.value;
      } else {
        nodes[x][y].data[3] = edge.value;
      }
    }
    return nodes;
  }
}

export function BuildAbstractLayers(
  tile_width: number,
  tile_height: number,
  init_scale: number,
  rangedEdges: EdgeData[]
): AbstractLayer[] {
  let layers: AbstractLayer[] = [];

  layers.push(new AbstractLayer(1, tile_height, tile_width, rangedEdges));
  for (let i = 4; i <= init_scale; i *= 4) {
    let layer = new AbstractLayer(
      i,
      tile_width / i,
      tile_height / i,
      [],
      layers[layers.length - 1]
    );
    layers.push(layer);
  }
  return layers;
}

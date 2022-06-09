import { MsgTypesInOrder } from "data/classification";
import { EdgeDisplay } from "display/data";
import EdgeTrafficCheckboxes from "filterbar/edgecheckbox";

export interface AbstractNode {
  x: number;
  y: number;
  data: number[];
  level: number[];
}

export class AbstractLayer {
  scale: number;
  height: number;
  width: number;
  linkValueMax: number = 0;
  nodes: AbstractNode[][];
  uppers: Array<number> = new Array<number>(10).fill(0);

  constructor(
    scale: number,
    height: number,
    width: number,
    edges: EdgeDisplay[],
    subLayer?: AbstractLayer
  ) {
    this.scale = scale;
    this.height = height;
    this.width = width;
    this.nodes = [];
    if (scale === 1) {
      this.nodes = this.buildFromFlatData(height, width, edges);
    } else {
      this.buildFromPrecedingLayer(subLayer!);
    }
    this.initLinearNormalize();
  }

  buildFromPrecedingLayer(subLayer: AbstractLayer) {
    let valuelength = MsgTypesInOrder.length;
    for (let i = 0; i < this.height; i++) {
      let row: AbstractNode[] = [];
      for (let j = 0; j < this.width; j++) {
        let value: number[] = [0, 0, 0, 0];
        let si = i * 4;
        let sj = j * 4;

        let sum = 0;
        for (let k = si; k < si + 4; k++) {
          let tile = subLayer!.nodes[k][sj + 3].data[0];
          for (let idx = 0; idx < length; idx++) {
            sum[idx] += tile[idx];
          }
        }
        value[0] = sum;

        sum = 0;
        for (let k = si; k < si + 4; k++) {
          sum += subLayer.nodes[k][sj].data[1];
        }
        value[1] = sum;

        sum = 0;
        for (let k = sj; k < sj + 4; k++) {
          sum += subLayer.nodes[si + 3][k].data[2];
        }
        value[2] = sum;

        sum = 0;
        for (let k = sj; k < sj + 4; k++) {
          sum += subLayer.nodes[si][k].data[3];
        }
        value[3] = sum;

        //prepare for linear normalization
        for (let x of value) {
          this.linkValueMax = Math.max(this.linkValueMax, x);
        }
        row.push({ x: i, y: j, data: value, level: [0, 0, 0, 0] });
      }
      this.nodes.push(row);
    }
  }

  buildFromFlatData(
    width: number,
    height: number,
    edges: EdgeDisplay[]
  ): AbstractNode[][] {
    let nodes: AbstractNode[][] = [];
    for (let i = 0; i < height; i++) {
      let row: AbstractNode[] = [];
      for (let j = 0; j < width; j++) {
        let value: number[] = [0, 0, 0, 0];
        row.push({ x: i, y: j, data: value, level: [0, 0, 0, 0]});
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
        nodes[x][y].data[0] = edge.weight;
      } else if (dy === y - 1) {
        nodes[x][y].data[1] = edge.weight;
      } else if (dx === x + 1) {
        nodes[x][y].data[2] = edge.weight;
      } else {
        nodes[x][y].data[3] = edge.weight;
      }
      this.linkValueMax = Math.max(this.linkValueMax, edge.weight);
    }
    return nodes;
  }

  initLinearNormalize() {
    // List of upper bound of each level at the current rendering
    for (let row of this.nodes) {
      for (let node of row) {
        for (let i = 0; i < 4; i++) {
          let val = node.data[i];
          let lv: number = 0;
          if (this.linkValueMax != 0) {
            lv = Math.floor((val * 9) / this.linkValueMax);
          }
          if (val > this.uppers[lv]) {
            this.uppers[lv] = val;
          }
          // WARNING!!: useful? a reference to this.node.xx???
          node.level[i] = lv;
        }
      }
    }
    this.uppers.forEach((u, i) => {
      if (u === 0) {
        this.uppers[i] = Math.floor(((i + 1) * this.linkValueMax) / 10);
      }
    });
    EdgeTrafficCheckboxes.applyUpperBound(this.uppers);
  }

}

export function BuildAbstractLayers(
  tile_width: number,
  tile_height: number,
  init_scale: number,
  rangedEdges: EdgeDisplay[]
): AbstractLayer[] {
  let buildStart = performance.now();
  let layers: AbstractLayer[] = [];

  let start = performance.now();
  layers.push(new AbstractLayer(1, tile_height, tile_width, rangedEdges));
  let end = performance.now();
  console.log(`build from source data: time spent ${end - start}ms`);
  for (let i = 4; i <= init_scale; i *= 4) {
    let start = performance.now();
    let layer = new AbstractLayer(
      i,
      tile_width / i,
      tile_height / i,
      [],
      layers[layers.length - 1]
    );
    layers.push(layer);
    let end = performance.now();
    console.log(
      `load layer[${layers.length - 1}] of scale ${i}: time spent ${
        end - start
      }ms`
    );
  }
  let buildEnd = performance.now();
  console.log(`build layers: time spent ${buildEnd - buildStart}ms`);
  return layers;
}

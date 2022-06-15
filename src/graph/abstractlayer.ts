import { MsgTypesInOrder } from "data/classification";
import { EdgeDisplay } from "display/data";
import EdgeTrafficCheckboxes from "filterbar/edgecheckbox";

export interface AbstractNode {
  x: number;
  y: number;
  level: number;
  dataFlow: number;
  edgeData: number[];
  edgeLevel: number[];
}

export class AbstractLayer {
  scale: number;
  height: number;
  width: number;
  nodeValueMax: number = 0;
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
        for (let k = sj; k < sj + 4; k++) {
          sum += subLayer.nodes[si+3][k].edgeData[0];
        }
        value[0] = sum;

        sum = 0;
        for (let k = sj; k < sj + 4; k++) {
          sum += subLayer.nodes[si][k].edgeData[1];
        }
        value[1] = sum;

        sum = 0;
        for (let k = si; k < si + 4; k++) {
          sum += subLayer.nodes[k][sj+3].edgeData[2];
        }
        value[2] = sum;

        sum = 0;
        for (let k = si; k < si + 4; k++) {
          sum += subLayer.nodes[k][sj].edgeData[3];
        }
        value[3] = sum;

        //prepare for linear normalization
        for (let x of value) {
          this.linkValueMax = Math.max(this.linkValueMax, x);
        }
        row.push({
          x: i,
          y: j,
          dataFlow: 0,
          level: 0,
          edgeData: value,
          edgeLevel: [0, 0, 0, 0],
        });
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
        row.push({
          x: i,
          y: j,
          dataFlow: 0,
          level: 0,
          edgeData: value,
          edgeLevel: [0, 0, 0, 0],
        });
      }
      nodes.push(row);
    }
    // S N E W
    for (let edge of edges) {
      // deal with flat structre,  a better idea: the order is specific
      let x = Math.floor(parseInt(edge.source) / width);
      let y = parseInt(edge.source) % width;
      let dx = Math.floor(parseInt(edge.target) / width);
      let dy = parseInt(edge.target) % width;
      if (dx === x + 1) {
        nodes[x][y].edgeData[0] = edge.weight;
      } else if (dx === x - 1) {
        nodes[x][y].edgeData[1] = edge.weight;
      } else if (dy === y + 1) {
        nodes[x][y].edgeData[2] = edge.weight;
      } else {
        nodes[x][y].edgeData[3] = edge.weight;
      }
      nodes[x][y].dataFlow += edge.weight;
      this.linkValueMax = Math.max(this.linkValueMax, edge.weight);
    }
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        this.nodeValueMax = Math.max(this.nodeValueMax, nodes[i][j].dataFlow);
      }
    }
    return nodes;
  }

  initLinearNormalize() {
    // List of upper bound of each edgeLevel at the current rendering
    for (let row of this.nodes) {
      for (let node of row) {
        // calc node level
        if (this.nodeValueMax != 0) {
          node.level = Math.floor((node.dataFlow * 9) / this.nodeValueMax);
        }
        // calc link level
        for (let i = 0; i < 4; i++) {
          let val = node.edgeData[i];
          let lv: number = 0;
          if (this.linkValueMax != 0) {
            lv = Math.floor((val * 9) / this.linkValueMax);
          }
          if (val > this.uppers[lv]) {
            this.uppers[lv] = val;
          }
          node.edgeLevel[i] = lv;
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
  // console.log(`build from source edgeData: time spent ${end - start}ms`);
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
  }
  let buildEnd = performance.now();
  console.log(`build layers: time spent ${buildEnd - buildStart}ms`);
  return layers;
}

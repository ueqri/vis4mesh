import * as d3 from "d3";
import { RenderEngineNode, RenderEngineEdge } from "./data";
import { Direction, GridBoard, NodeBorder } from "./grid";
import AbstractNode, { ReestablishLinks } from "display/abstractnode";
import Event from "event";
import EdgeTrafficCheckboxes from "filterbar/edgecheckbox";
import RenderSVG, { RemoveElementInsideSVGGroup } from "./render";
import {
  PackNodesWithIDs,
  UnpackNodeWithID,
  GenerateBlockListsFromNonBaseNodes,
} from "display/abstractnode";

const ev = {
  EdgeTraffic: "FilterETCheckbox",
  ZoomIn: "GraphZoomIn",
  ZoomOut: "GraphZoomOut",
};

const edgeWidth = 5;
const edgeOffset = edgeWidth / 2 + 2;
const arrowWidth = edgeWidth / 3.8;
const zoomStep = 4;

//
// SVG
//

const svg = d3.create("svg"); //.attr("transform", `scale(2.25)`);

const g = svg.append("g");
g.append("svg:defs")
  .selectAll("marker")
  .data(["end"]) // different link/path types can be defined here
  .enter()
  .append("svg:marker") // this section adds in the arrows
  .attr("id", String)
  .attr("viewBox", "0 -5 10 10")
  .attr("refX", arrowWidth * 5.5)
  .attr("refY", 0)
  .attr("markerWidth", arrowWidth)
  .attr("markerHeight", arrowWidth)
  .attr("orient", "auto")
  .append("svg:path")
  .attr("d", "M0,-5L10,0L0,5");

//
// Zoom & Drag
//

let prevTransform: number = 1;
let zoomIn: number = 0;
let zoomOut: number = 0;
const zoom = d3
  .zoom()
  .scaleExtent([0.1, 25])
  .on("zoom", (e) => {
    const k = e.transform.k;
    g.attr("transform", e.transform);
    if (k == prevTransform) {
      // Drag only
    } else if (k < prevTransform) {
      zoomOut++;
      zoomIn = 0;
      if (Math.abs(zoomOut % zoomStep) === 0) {
        console.log("smaller");
        Event.FireEvent(ev.ZoomOut, undefined);
      }
    } else {
      zoomIn++;
      zoomOut = 0;
      if (Math.abs(zoomIn % zoomStep) === 0) {
        console.log("bigger");
        Event.FireEvent(ev.ZoomIn, undefined);
      }
    }
    prevTransform = e.transform.k;
  });

svg.call(zoom as any).on("dblclick.zoom", null);

class RenderEngine {
  grid!: GridBoard;
  nodes: RenderEngineNode[];
  edges: RenderEngineEdge[];
  checked: boolean[];
  nodeMap: { [id: number]: AbstractNode };

  gridDim!: number;
  zoomDim!: number;

  constructor() {
    this.nodes = new Array<RenderEngineNode>();
    this.edges = new Array<RenderEngineEdge>();
    this.checked = Array<boolean>(10).fill(true); // edge traffic checkbox
    this.nodeMap = {};
    this.zoomDim = 8;

    Event.AddStepListener(ev.EdgeTraffic, (levels: number[]) => {
      this.checked = Array<boolean>(10).fill(false);
      levels.forEach((lv) => (this.checked[lv] = true));
      SetEdgeOpacity(this.edges, this.checked);
      RenderSVG(g, this.nodes, this.edges, this.nodeMap);
    });
    Event.AddStepListener(ev.ZoomIn, () => this.zoomIn());
    Event.AddStepListener(ev.ZoomOut, () => this.zoomOut());
  }

  resize(dim: number) {
    this.grid = new GridBoard(dim);
    this.gridDim = dim;
    // const span = grid.span();
    // svg.attr("viewBox", `0 0 ${span} ${span}`);
  }

  join(nodeMap: { [id: number]: AbstractNode }, zoomToDim?: number) {
    this.nodeMap = nodeMap;

    if (zoomToDim === undefined) {
      zoomToDim = this.zoomDim;
      this.zoomDim = this.gridDim;
    }
    this.zoomTransform(zoomToDim); // transform `nodeMap` with zoom dimension

    const data = Object.values(this.nodeMap);

    this.clear();

    this.yieldBlockOnGrid(data);
    this.grid.deflate(Math.round(this.gridDim / this.zoomDim));
    // console.log(this.grid.span());

    this.generateREDataAndRender(data);
  }

  node(): SVGSVGElement {
    return svg.node()!;
  }

  clear() {
    // this.grid.clear();
    this.grid = new GridBoard(this.gridDim);
    this.nodes = new Array<RenderEngineNode>();
    this.edges = new Array<RenderEngineEdge>();
  }

  yieldBlockOnGrid(data: AbstractNode[]) {
    data.sort((a, b) => a.id - b.id);
    data.forEach((d) => this.grid.yield(d.id, d.allocX, d.allocY));
  }

  generateREDataAndRender(data: AbstractNode[]) {
    data.forEach((d) => {
      const border = this.grid.nodeBorder(d.id);
      this.nodes.push(GenerateRENode(d, border));
      this.edges = [...this.edges, ...GenerateREEdge(d, border, this.grid)];
    });
    LinearNormalize(this.edges);
    SetEdgeOpacity(this.edges, this.checked);
    RenderSVG(g, this.nodes, this.edges, this.nodeMap);
  }

  zoomTransform(zoomToDim: number) {
    // Pack nodes of origin data (passed from Display) to produce intermediate
    // nodes to generate RenderEngine data and render zoomed graph.
    if (zoomToDim > this.gridDim) {
      console.error("RenderEngine cannot zoom in further than grid size");
      return;
    }

    if (this.gridDim % zoomToDim !== 0) {
      console.warn("RenderEngine only support dimension of the power of 2");
      return;
    }

    if (this.zoomDim < zoomToDim) {
      // Unpack nodes
      const times = Math.log2(zoomToDim / this.zoomDim);
      for (let i = 0; i < times; i++) {
        const ids = Object.keys(this.nodeMap);
        ids.forEach((id) => UnpackNodeWithID(this.nodeMap, Number(id)));
      }
    } else if (this.zoomDim > zoomToDim) {
      // Pack nodes
      const times = Math.log2(this.zoomDim / zoomToDim);
      for (let i = 0; i < times; i++) {
        GenerateBlockListsFromNonBaseNodes(
          2,
          this.zoomDim,
          this.gridDim
        ).forEach((blk) => {
          PackNodesWithIDs(this.nodeMap, blk, this.gridDim);
        });
        ReestablishLinks(Object.values(this.nodeMap));
        this.zoomDim /= 2;
      }
    }

    // this.nodeMap = Object.assign({}, this.originData);
    // const blockDim = Math.round(this.gridDim / zoomToDim);
    // if (blockDim > 1) {
    //   GenerateBlockListsFromBaseNodes(blockDim, this.gridDim).forEach((blk) => {
    //     PackNodesWithIDs(this.nodeMap, blk, this.gridDim);
    //   });
    // } else {
    //   // Reestablishing is needed to clone base links to update link information
    //   // when zoomed to full dimension.
    //   ReestablishLinks(Object.values(this.nodeMap));
    // }

    this.zoomDim = zoomToDim;
  }

  zoomIn() {
    if (this.zoomDim < this.gridDim) {
      RemoveElementInsideSVGGroup(g);
      this.join(this.nodeMap, this.zoomDim * 2);
    }
  }

  zoomOut() {
    if (this.zoomDim > 1) {
      RemoveElementInsideSVGGroup(g);
      this.join(this.nodeMap, Math.round(this.zoomDim / 2));
    }
  }
}

function GenerateRENode(d: AbstractNode, b: NodeBorder): RenderEngineNode {
  return {
    id: d.id, // preserved for node brush and interaction
    width: b.right - b.left,
    height: b.down - b.top,
    posX: b.left,
    posY: b.top,
    label: {
      posX: (b.left + b.right) / 2,
      posY: (b.top + b.down) / 2,
      text: d.label,
    },
    fill: "#8fbed1",
    stroke: "#599dbb",
  };
}

function GenerateREEdge(
  node: AbstractNode,
  b: NodeBorder,
  grid: GridBoard
): RenderEngineEdge[] {
  const src = node.id;
  const edges = new Array<RenderEngineEdge>();
  node.link.forEach((lk) => {
    const dst = lk.dst;
    const meta = {
      level: lk.weight, // use real count before normalization
      width: edgeWidth,
      opacity: 1, // display by normal, would be changed on filter event
      connection: [src, dst],
    };

    const d = grid.nodeBorder(dst);
    const overlap = grid.overlappedBorder(src, dst);
    const mid = (overlap.posBegin! + overlap.posEnd!) / 2;
    switch (grid.direction(src, dst)) {
      case Direction.N: {
        const conn = {
          srcX: mid - edgeOffset,
          dstX: mid - edgeOffset,
          srcY: b.top,
          dstY: d.down,
        };
        const label = {
          posX: mid - edgeOffset * 3,
          posY: (b.top + d.down) / 2,
          text: lk.label,
        };
        edges.push({ ...meta, ...conn, label: label, rtl: false });
        break;
      }
      case Direction.S: {
        const conn = {
          srcX: mid + edgeOffset,
          dstX: mid + edgeOffset,
          srcY: b.down,
          dstY: d.top,
        };
        const label = {
          posX: mid + edgeOffset * 3,
          posY: (b.down + d.top) / 2,
          text: lk.label,
        };
        edges.push({ ...meta, ...conn, label: label, rtl: true });
        break;
      }
      case Direction.E: {
        const conn = {
          srcX: b.right,
          dstX: d.left,
          srcY: mid - edgeOffset,
          dstY: mid - edgeOffset,
        };
        const label = {
          posX: (b.right + d.left) / 2,
          posY: mid - edgeOffset * 3,
          text: lk.label,
        };
        edges.push({ ...meta, ...conn, label: label, rtl: true });
        break;
      }
      case Direction.W: {
        const conn = {
          srcX: b.left,
          dstX: d.right,
          srcY: mid + edgeOffset,
          dstY: mid + edgeOffset,
        };
        const label = {
          posX: (b.left + d.right) / 2,
          posY: mid + edgeOffset * 3,
          text: lk.label,
        };
        edges.push({ ...meta, ...conn, label: label, rtl: false });
        break;
      }
    }
  });
  return edges;
}

function LinearNormalize(data: RenderEngineEdge[]) {
  let max: number = 0;
  data.forEach((e) => (max = max < e.level ? e.level : max));

  // List of upper bound of each level at the current rendering
  let uppers: Array<number> = new Array<number>(10).fill(0);
  data.forEach((e) => {
    let lv: number = 0;
    if (max != 0) {
      lv = Math.floor((e.level * 9) / max);
    }
    if (e.level > uppers[lv]) {
      uppers[lv] = e.level;
    }
    e.level = lv;
  });
  uppers.forEach((u, i) => {
    if (u === 0) {
      uppers[i] = Math.floor(((i + 1) * max) / 10);
    }
  });

  EdgeTrafficCheckboxes.applyUpperBound(uppers);
}

function SetEdgeOpacity(data: RenderEngineEdge[], checked: boolean[]) {
  data.forEach((e) => {
    e.opacity = checked[e.level] === true ? 1 : 0.02;
  });
}

function GetCenterPositionOfSVG(): [number, number] {
  let rootSize = (svg.node() as Element).getBoundingClientRect();
  let groupSize = (g.node() as Element).getBoundingClientRect();

  let x = rootSize.x - groupSize.x + (rootSize.width - groupSize.width) / 2;
  let y = rootSize.y - groupSize.y + (rootSize.height - groupSize.height) / 2;

  console.log(x, y);
  return [x, y];
}

export default new RenderEngine();

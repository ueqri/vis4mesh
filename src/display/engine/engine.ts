import * as d3 from "d3";
import { RenderEngineNode, RenderEngineEdge } from "./data";
import { Direction, GridBoard, NodeBorder } from "./grid";
import AbstractNode from "display/abstractnode";
import Event from "event";
import EdgeTrafficCheckboxes from "filterbar/edgecheckbox";
import RenderSVG from "./render";

const ev = {
  EdgeTraffic: "FilterETCheckbox",
  ZoomIn: "GraphZoomIn",
  ZoomOut: "GraphZoomOut",
};

const edgeWidth = 5;
const edgeOffset = edgeWidth / 2 + 2;
const arrowWidth = edgeWidth / 3.8;

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
let zoomLevel: number = 0;
const zoom = d3
  .zoom()
  .scaleExtent([0.1, 25])
  .on("zoom", (e) => {
    g.attr("transform", e.transform);
    const k = e.transform.k;
    if (k == prevTransform) {
      // Drag only
    } else if (k < prevTransform) {
      console.log("smaller");
      zoomLevel--;
    } else {
      console.log("bigger");
      zoomLevel++;
    }
    prevTransform = e.transform.k;
  });

svg.call(zoom as any).on("dblclick.zoom", null);

class RenderEngine {
  data: AbstractNode[];
  grid!: GridBoard;
  nodes: RenderEngineNode[];
  edges: RenderEngineEdge[];
  checked: boolean[];
  nodeMap: { [id: number]: AbstractNode };

  constructor() {
    this.data = [];
    this.nodes = new Array<RenderEngineNode>();
    this.edges = new Array<RenderEngineEdge>();
    this.checked = Array<boolean>(10).fill(true); // edge traffic checkbox
    this.nodeMap = {};

    Event.AddStepListener(ev.EdgeTraffic, (levels: number[]) => {
      this.checked = Array<boolean>(10).fill(false);
      levels.forEach((lv) => (this.checked[lv] = true));
      SetEdgeOpacity(this.edges, this.checked);
      this.render();
    });
  }

  resize(dim: number) {
    this.grid = new GridBoard(dim);
    // const span = grid.span();
    // svg.attr("viewBox", `0 0 ${span} ${span}`);
  }

  join(data: AbstractNode[]) {
    this.data = data;

    this.grid.clear();
    this.nodes = new Array<RenderEngineNode>();
    this.edges = new Array<RenderEngineEdge>();

    this.data.sort((a, b) => a.id - b.id);
    this.data.forEach((d) => this.grid.yield(d.id, d.allocX, d.allocY));

    // GenerateREDataAndRender();
    this.data.forEach((d) => {
      const border = this.grid.nodeBorder(d.id);
      this.nodes.push(GenerateRENode(d, border));
      this.edges = [...this.edges, ...GenerateREEdge(d, border, this.grid)];
      this.nodeMap[d.id] = d;
    });
    LinearNormalize(this.edges);
    SetEdgeOpacity(this.edges, this.checked);
    this.render();
  }

  placeNodesOnGrid() {}

  protected render() {
    RenderSVG(g, this.nodes, this.edges, this.nodeMap);
  }

  node(): SVGSVGElement {
    return svg.node()!;
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

export default new RenderEngine();

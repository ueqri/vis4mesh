import * as d3 from "d3";
import { RenderEngineNode, RenderEngineEdge } from "./data";
import { Direction, GridBoard, NodeBorder } from "./grid";
import AbstractNode from "display/abstractnode";
import Event from "event";
import EdgeTrafficCheckboxes from "filterbar/edgecheckbox";

const ev = {
  EdgeTraffic: "FilterETCheckbox",
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
const zoom = d3
  .zoom()
  .scaleExtent([0.1, 25])
  .on("zoom", (e) => {
    g.attr("transform", e.transform);
    const k = e.transform.k;
    if (k == prevTransform) {
      // drag only
    } else if (k < prevTransform) {
      console.log("smaller");
    } else {
      console.log("bigger");
    }
    prevTransform = e.transform.k;
  });
svg.call(zoom as any);

let grid: GridBoard;
let nodes = new Array<RenderEngineNode>();
let edges = new Array<RenderEngineEdge>();
let checked = Array<boolean>(10).fill(true); // edge traffic checkbox

class RenderEngine {
  constructor() {
    Event.AddStepListener(ev.EdgeTraffic, (levels: number[]) => {
      checked = Array<boolean>(10).fill(false);
      levels.forEach((lv) => (checked[lv] = true));
      SetEdgeOpacity(edges);
      this.render();
    });
  }

  resize(dim: number) {
    grid = new GridBoard(dim);
    // const span = grid.span();
    // svg.attr("viewBox", `0 0 ${span} ${span}`);
  }

  join(data: AbstractNode[]) {
    nodes = new Array<RenderEngineNode>();
    edges = new Array<RenderEngineEdge>();
    grid.clear();
    // TODO
    data.sort((a, b) => a.id - b.id);
    data.forEach((d) => grid.yield(d.id, d.allocX, d.allocY));
    // console.log(grid.grid);
    // grid.deflate(4);
    // console.log(grid.grid);
    data.forEach((d) => {
      const border = grid.nodeBorder(d.id);
      nodes.push(GenerateRENode(d, border));
      edges = [...edges, ...GenerateREEdge(d, border)];
    });
    LinearNormalize(edges);
    SetEdgeOpacity(edges);
    this.render();
  }

  placeNodesOnGrid() {}

  protected render() {
    //
    // Edges
    //

    g.selectAll("line")
      .data(edges)
      .join(
        function (enter) {
          return enter.append("line").attr("marker-end", "url(#end)");
        },
        function (update) {
          return update;
        },
        function (exit) {
          return exit.remove();
        }
      )
      .attr("x1", (d) => d.srcX)
      .attr("x2", (d) => d.dstX)
      .attr("y1", (d) => d.srcY)
      .attr("y2", (d) => d.dstY)
      .attr("stroke-dasharray", (d) => {
        if (d.rtl) {
          return "2,1"; // dash style: bottom -> top / right -> left
        } else {
          return "5,0"; // solid style: top -> bottom / left -> right
        }
      })
      .attr("stroke-width", (d) => d.width)
      .attr("opacity", (d) => d.opacity)
      .attr("stroke", (d) => ColorScheme(d.level));

    g.selectAll(".edge-label")
      .data(edges)
      .join(
        function (enter) {
          return enter
            .append("text")
            .attr("class", "edge-label")
            .attr("dy", ".35em")
            .attr("dominant-baseline", "middle");
        },
        function (update) {
          return update;
        },
        function (exit) {
          return exit.remove();
        }
      )
      .attr("x", (d) => d.label.posX)
      .attr("y", (d) => d.label.posY)
      .text((d) => (d.opacity === 1 ? d.label.text : ""));

    //
    // Nodes
    //

    g.selectAll("rect")
      .data(nodes)
      .join(
        function (enter) {
          return enter
            .append("rect")
            .attr("width", (d) => d.width)
            .attr("height", (d) => d.height)
            .attr("rx", 1.5) // corner radius
            .attr("ry", 1.5)
            .attr("stroke", (d) => d.stroke)
            .attr("stroke-width", "0.2%")
            .attr("fill", (d) => d.fill);
        },
        function (update) {
          return update;
        },
        function (exit) {
          return exit.remove();
        }
      )
      .attr("x", (d) => d.posX)
      .attr("y", (d) => d.posY);

    g.selectAll(".node-label")
      .data(nodes)
      .join(
        function (enter) {
          return enter
            .append("text")
            .attr("class", "node-label")
            .attr("dominant-baseline", "middle");
        },
        function (update) {
          return update;
        },
        function (exit) {
          return exit.remove();
        }
      )
      .attr("x", (d) => d.label.posX)
      .attr("y", (d) => d.label.posY)
      .text((d) => d.label.text);
  }

  node(): SVGSVGElement {
    return svg.node()!;
  }
}

function GenerateRENode(d: AbstractNode, b: NodeBorder): RenderEngineNode {
  return {
    id: d.id, // preserved for node brush
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

function GenerateREEdge(node: AbstractNode, b: NodeBorder): RenderEngineEdge[] {
  const src = node.id;
  const edges = new Array<RenderEngineEdge>();
  node.link.forEach((lk) => {
    const dst = lk.dst;
    const meta = {
      level: lk.weight, // use real count before normalization
      width: edgeWidth,
      opacity: 1, // display by normal, would be changed on filter event
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

function ColorScheme(lv: number): string {
  // [0, 9] maps Blue-Yellow-Red color platte
  return d3.interpolateRdYlBu((9 - lv) / 9);
}

function LinearNormalize(data: RenderEngineEdge[]) {
  let max: number = 0;
  data.forEach((e) => (max = max < e.level ? e.level : max));

  // List of upper bound of each level at the current rendering
  let uppers: Array<number> = new Array<number>(10).fill(0);
  edges.forEach((e) => {
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

function SetEdgeOpacity(data: RenderEngineEdge[]) {
  data.forEach((e) => {
    e.opacity = checked[e.level] === true ? 1 : 0.02;
  });
}

export default new RenderEngine();

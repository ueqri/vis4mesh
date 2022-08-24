import {
  RectNode,
  LineLink,
  LinkText,
  RectCornerRadius,
  ArrowWidth,
} from "./common";
import TooltipInteraction from "./interaction/tooltip";
import ClickInteraction from "./interaction/click";
import {
  ColorScheme,
  GetLinkDst,
  GetRectIdentity,
  GetLineIdentity,
  DirectionOffset,
} from "./util";
import { MainView } from "./graph";
import Minimap from "./minimap";
import sidecanvas from "./interaction/sidecanvas";
import * as d3 from "d3";

export class Render {
  mainview: MainView;
  pinMap: Map<
    string,
    d3.Selection<SVGCircleElement, unknown, HTMLElement, any>
  >;
  readonly grid = d3.select("#graph").append("svg").append("g");

  constructor(mainview: MainView) {
    this.mainview = mainview;
    d3.select("#graph")
      .select("svg")
      .on("click", () => ClickInteraction.reset());
    this.grid
      .append("svg:defs")
      .selectAll("marker")
      .data(["end"]) // different link/path types can be defined here
      .enter()
      .append("svg:marker") // this section adds in the arrows
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", ArrowWidth * 5.5)
      .attr("refY", 0)
      .attr("markerWidth", ArrowWidth)
      .attr("markerHeight", ArrowWidth)
      .attr("orient", "auto")
      .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5");

    this.pinMap = new Map();
  }

  SetPins(level: number) {
    let op = 0;
    if (level === 0) {
      op = 1;
    }
    for (let [x, y] of this.pinMap) {
      y.attr("opacity", op).raise();
    }
  }

  Transform(transform: string) {
    this.grid.attr("transform", transform);
  }

  draw_rect(nodes: RectNode[]) {
    const mainview = this.mainview;
    this.grid
      .selectAll<SVGSVGElement, RectNode>("rect")
      .data<RectNode>(nodes, (d) => GetRectIdentity(d))
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("x", (d) => d.x)
            .attr("y", (d) => d.y)
            .attr("rx", (d) => RectCornerRadius * d.size)
            .attr("ry", (d) => RectCornerRadius * d.size)
            .attr("width", (d) => d.size)
            .attr("height", (d) => d.size)
            .attr("fill", (d) => d.color)
            .attr("stroke", "#599dbb")
            .attr("stroke-width", (d) => d.scale * 0.02),
        (update) =>
          update
            .transition()
            .duration(300)
            .attr("x", (d) => d.x)
            .attr("y", (d) => d.y)
            .attr("rx", (d) => RectCornerRadius * d.size)
            .attr("ry", (d) => RectCornerRadius * d.size)
            .attr("width", (d) => d.size)
            .attr("height", (d) => d.size)
            .attr("fill", (d) => d.color)
            .attr("stroke", "#599dbb")
            .attr("stroke-width", (d) => d.scale * 0.02),
        (exit) => exit.remove()
      )
      .on("mouseover", function (ev, d) {
        const sel = d3.select(this);
        sel.attr("fill", "#599dbb");
        sel.style("cursor", "pointer");
        // TooltipInteraction.onNode(nodeMap[d.id]);
      })
      .on("mousemove", function (ev) {
        TooltipInteraction.move([ev.pageX, ev.pageY]);
      })
      .on("mouseout", function (ev, d) {
        const sel = d3.select(this);
        if (sel.property("checked") !== true) {
          sel.attr("fill", d.color);
          sel.style("cursor", "default");
        }
        TooltipInteraction.hide();
      })
      .on("click", function (ev, d) {
        ev.stopPropagation();

        const sel = d3.select(this);
        ClickInteraction.onNode(
          d.level,
          `(${d.idx}, ${d.idy})`,
          () => {
            sel.attr("fill", "#599dbb");
            sel.property("checked", true);
            mainview.register_rect_color(d, "#599dbb");
          },
          () => {
            sel.attr("fill", d.color);
            sel.property("checked", false);
            mainview.register_rect_color(d);
          }
        );
        mainview.click_node_jump(ev, d);
      });
  }

  draw_line(lines: LineLink[], minimap: Minimap) {
    const mainview = this.mainview;
    const grid = this.grid;
    let pinMap = this.pinMap;
    // console.log(lines);
    this.grid
      .selectAll<SVGSVGElement, LineLink>("line")
      .data<LineLink>(lines, (l: LineLink) => GetLineIdentity(l))
      .join(
        function (enter) {
          return enter
            .append("line")
            .attr("marker-end", "url(#end)")
            .attr("stroke-width", (d) => d.width);
        },
        function (update) {
          return update;
        },
        function (exit) {
          return exit.remove();
        }
      )
      .attr("x1", (d) => d.x1)
      .attr("x2", (d) => d.x2)
      .attr("y1", (d) => d.y1)
      .attr("y2", (d) => d.y2)
      .attr("opacity", (d) => d.opacity)
      .attr("stroke-dasharray", (d) => d.dasharray)
      .attr("stroke", (d) => ColorScheme(d.colorLevel))
      .on("mouseover", function (ev, d) {
        const sel = d3.select(this);
        sel.attr("stroke-width", d.width * 1.5);
        sel.style("cursor", "pointer");
        const [src, dst] = d.connection;
        // TooltipInteraction.onEdge([nodeMap[src], nodeMap[dst]]);
      })
      .on("mousemove", function (ev) {
        TooltipInteraction.move([ev.pageX, ev.pageY]);
      })
      .on("mouseout", function (ev, d) {
        const sel = d3.select(this);
        if (sel.property("checked") !== true) {
          sel.attr("stroke-width", d.width);
          sel.style("cursor", "default");
        }
        TooltipInteraction.hide();
      })
      .on("click", function (ev, d) {
        const sel = d3.select(this);
        const [src, dst] = d.connection;
        let dstNode = GetLinkDst([d.idx, d.idy], d.direction);
        ClickInteraction.onEdge(
          `(${d.idx}, ${d.idy})->${dstNode}`,
          function () {
            if (d.level === 0 && d.opacity !== 0) {
              let pin = grid.append("circle");
              let edgeName = `${d.connection[0]}to${d.connection[1]}`;

              sidecanvas.AddLinkHistogram(
                edgeName,
                (color: string) => {
                  minimap.AddPin([d.idx, d.idy], color, () => { mainview.click_edge_jump(ev, d) });
                  let [cx, cy] = DirectionOffset(
                    [d.x1, d.y1],
                    d.direction,
                    0.2
                  );
                  pin
                    .attr("cx", cx)
                    .attr("cy", cy)
                    .attr("r", 0.04)
                    .attr("fill", color)
                    .on("mouseover", () => {
                      pin.attr("r", 0.06).style("cursor", "pointer");
                    })
                    .on("mouseout", () => {
                      pin.attr("r", 0.04).style("cursor", "default");
                    })
                    .on("click", () => {
                      pin.remove();
                      sidecanvas.checkoutLink("stacked-chart-" + edgeName);
                    });
                  pinMap.set(edgeName, pin);
                },
                () => {
                  minimap.RemovePin([d.idx, d.idy]);
                  pinMap.delete(edgeName);
                  pin.remove();
                },
                () => {
                  mainview.click_edge_jump(ev, d);
                },
                () => { 
                  pin.attr("r", 0.06);
                },
                () => { 
                  pin.attr("r", 0.04);
                }
              );
            }
            sel.attr("stroke-width", d.width * 1.5);
            sel.property("checked", true);
          },
          function () {
            console.log("clear click on edge");
            sel.attr("stroke-width", d.width);
            sel.property("checked", false);
          }
        );
        mainview.click_edge_jump(ev, d);
        ev.stopPropagation();
      });
  }

  draw_text(texts: LinkText[], rect_size: number) {
    let fontsize = rect_size * 0.1;
    this.grid
      .selectAll(".edge-label")
      .data(texts)
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
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("opacity", (d) => d.opacity)
      .style("fill", "gray")
      .text((d) => d.label)
      .style("font-size", fontsize)
      .raise();
  }
}

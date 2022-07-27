import {
  RectNode,
  LineLink,
  LinkText,
  RectCornerRadius,
  ArrowWidth,
} from "./common";
import { RenderTimebar } from "timebar/timebar";
import TooltipInteraction from "./interaction/tooltip";
import ClickInteraction from "./interaction/click";
import { ColorScheme, GetLinkDst } from "./util";
import { Component } from "global";
import * as d3 from "d3";

class Render {
  readonly grid = d3.select("#graph").append("svg").append("g");

  constructor() {
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
  }

  Transform(transform: string) {
    this.grid.attr("transform", transform);
  }

  draw_rect(nodes: RectNode[]) {
    this.grid
      .selectAll<SVGSVGElement, RectNode>("rect")
      .data<RectNode>(nodes, (d) => `${d.scale}, ${d.idx}, ${d.idy}`)
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
            .duration(500)
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
        const sel = d3.select(this);
        ClickInteraction.onNode(
          d.level,
          `(${d.idx}, ${d.idy})`,
          () => {
            sel.attr("fill", "#599dbb");
            sel.property("checked", true);
          },
          () => {
            sel.attr("fill", d.color);
            sel.property("checked", false);
          }
        );
        ev.stopPropagation();
      });
  }

  draw_line(lines: LineLink[]) {
    console.log(lines);
    this.grid
      .selectAll("line")
      .data(lines)
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
      .attr("x1", (d) => d.x1)
      .attr("x2", (d) => d.x2)
      .attr("y1", (d) => d.y1)
      .attr("y2", (d) => d.y2)
      .attr("opacity", (d) => d.opacity)
      .attr("stroke-dasharray", (d) => d.dasharray)
      .attr("stroke-width", (d) => d.width)
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
          () => {
            if (d.level === 0) {
              let edgeName = `${d.connection[0]}to${d.connection[1]}`;
              RenderTimebar(edgeName);
            }
            console.log("click on edge");
            sel.attr("stroke-width", d.width * 1.5);
            sel.property("checked", true);
          },
          () => {
            if (d.level === 0) {
              RenderTimebar();
            }
            console.log("clear click on edge");
            sel.attr("stroke-width", d.width);
            sel.property("checked", false);
          }
        );
        ev.stopPropagation();
      });
  }

  draw_text(texts: LinkText[], rect_size: number) {
    let fontsize = rect_size * 0.2;
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
      .text((d) => d.label)
      .style("font-size", fontsize)
      .raise();
  }
}

let Renderer = new Render();
export default Renderer;

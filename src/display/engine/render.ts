import * as d3 from "d3";
import { RenderEngineNode, RenderEngineEdge } from "./data";
import AbstractNode from "../abstractnode";
import TooltipInteraction from "../interaction/tooltip";
import ClickInteraction from "../interaction/click";

export default function RenderSVG(
  g: d3.Selection<SVGGElement, undefined, null, undefined>,
  nodes: Array<RenderEngineNode>,
  edges: Array<RenderEngineEdge>,
  nodeMap: { [id: number]: AbstractNode }
) {
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
    .attr("stroke", (d) => ColorScheme(d.level))
    .on("mouseover", function (ev, d) {
      const sel = d3.select(this);
      sel.attr("stroke-width", d.width * 1.5);
      sel.style("cursor", "pointer");
      const [src, dst] = d.connection;
      TooltipInteraction.onEdge([nodeMap[src], nodeMap[dst]]);
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

      ClickInteraction.onEdge(
        [nodeMap[src], nodeMap[dst]],
        () => {
          sel.attr("stroke-width", d.width * 1.5);
          sel.property("checked", true);
        },
        () => {
          sel.attr("stroke-width", d.width);
          sel.property("checked", false);
        }
      );
      ev.stopPropagation();
    });

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
    .attr("width", (d) => d.width)
    .attr("height", (d) => d.height)
    .attr("x", (d) => d.posX)
    .attr("y", (d) => d.posY)
    .on("mouseover", function (ev, d) {
      const sel = d3.select(this);
      sel.attr("fill", d.stroke);
      sel.style("cursor", "pointer");
      TooltipInteraction.onNode(nodeMap[d.id]);
    })
    .on("mousemove", function (ev) {
      TooltipInteraction.move([ev.pageX, ev.pageY]);
    })
    .on("mouseout", function (ev, d) {
      const sel = d3.select(this);
      if (sel.property("checked") !== true) {
        sel.attr("fill", d.fill);
        sel.style("cursor", "default");
      }
      TooltipInteraction.hide();
    })
    .on("click", function (ev, d) {
      const sel = d3.select(this);
      ClickInteraction.onNode(
        nodeMap[d.id],
        () => {
          sel.attr("fill", d.stroke);
          sel.property("checked", true);
        },
        () => {
          sel.attr("fill", d.fill);
          sel.property("checked", false);
        }
      );
      ev.stopPropagation();
    });

  // g.selectAll(".node-label")
  //   .data(nodes)
  //   .join(
  //     function (enter) {
  //       return enter
  //         .append("text")
  //         .attr("class", "node-label")
  //         .attr("dominant-baseline", "middle");
  //     },
  //     function (update) {
  //       return update;
  //     },
  //     function (exit) {
  //       return exit.remove();
  //     }
  //   )
  //   .attr("x", (d) => d.label.posX)
  //   .attr("y", (d) => d.label.posY)
  //   .text((d) => d.label.text);
}

export function RemoveElementInsideSVGGroup(
  g: d3.Selection<SVGGElement, undefined, null, undefined>
) {
  g.selectAll("rect").remove();
  g.selectAll("line").remove();
  g.selectAll("text").remove();
}

export function ColorScheme(lv: number): string {
  // [0, 9] maps Blue-Yellow-Red color platte
  return d3.interpolateReds((lv + 1) / 10);
}

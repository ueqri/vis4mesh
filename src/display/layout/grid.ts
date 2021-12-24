import * as d3 from "d3";
import invert from "invert-color";
import { DisplayConfig } from "../config";
import { DataToDisplay, EdgeDisplay, DisplayStyle } from "../data";
import { DisplayLayout, MappedLocation } from "../layout";
import { EdgeTooltip } from "../tooltip";

export class GridConfig extends DisplayConfig {
  mapRatio: number;
  paddingX: number;
  paddingY: number;
  nodeSize: number;
  edgeWidth: number;
  labelPadding: number;
  dualEdgeSpace: number;

  constructor() {
    super();
    this.mapRatio = 13;
    this.paddingX = this.paddingY = 10;
    this.edgeWidth = 6.2;
    this.nodeSize = 40;
    this.labelPadding = 4;
    this.dualEdgeSpace = this.edgeWidth + 0.4;
  }
}

export class Grid extends DisplayLayout {
  config: GridConfig;

  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  g: d3.Selection<SVGGElement, unknown, null, undefined>;
  tooltipNode: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  tooltipEdge: d3.Selection<HTMLDivElement, unknown, null, undefined>;

  constructor(div: HTMLElement) {
    super(div);
    this.config = new GridConfig();
    const c = this.config;

    d3.select(this.div).selectAll("svg").remove();
    d3.select(this.div).selectAll("div").remove();

    //
    // Tooltip
    //

    this.tooltipNode = d3
      .select(this.div)
      .append("div")
      .attr("class", "node-tooltip")
      .style("opacity", 0.85);

    this.tooltipEdge = d3
      .select(this.div)
      .append("div")
      .attr("class", "edge-tooltip")
      .style("opacity", 0.85);

    //
    // SVG
    //

    this.svg = d3
      .select(this.div)
      .append("svg")
      .attr("transform", `scale(0.6)`);
    this.g = this.svg.append("g");

    //
    // Zoom & Drag
    //

    let transform;
    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 20])
      .on("zoom", (e) => {
        this.g.attr("transform", (transform = e.transform));
        this.g.style("stroke-width", 3 / Math.sqrt(transform.k));
        // zoom other components
      });
    this.svg.call(zoom as any);

    //
    // SVG arrow marker
    //

    // TODO: fine-tune
    this.g
      .append("svg:defs")
      .selectAll("marker")
      .data(["end"]) // different link/path types can be defined here
      .enter()
      .append("svg:marker") // this section adds in the arrows
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", c.nodeSize / 2 + c.edgeWidth)
      .attr("refY", 0)
      .attr("markerWidth", c.edgeWidth / 3.5)
      .attr("markerHeight", c.edgeWidth / 3.5)
      .attr("orient", "auto")
      .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5");
  }

  colorScheme(weight: number | undefined): string {
    let w: number = 0;
    if (weight != undefined) {
      w = weight;
    }
    // [0, 9] maps Blue-Yellow-Red color platte
    return d3.interpolateRdYlBu((9 - w) / 9);
  }

  render(data: DataToDisplay) {
    let colorScheme = this.colorScheme;
    let tooltipNode = this.tooltipNode;
    let tooltipEdge = this.tooltipEdge;
    let xSize: number = data.meta!["width"];
    let ySize: number = data.meta!["height"];
    // console.log(`x: ${xSize}, y: ${ySize}`);

    const c = this.config;
    const svgWidth = xSize * (c.nodeSize + c.edgeWidth);
    const svgHeight = ySize * (c.nodeSize + c.edgeWidth);

    let scaleX = (xid: number) => {
      return xid * c.mapRatio * 10 + c.paddingX;
    };
    let scaleY = (yid: number) => {
      return yid * c.mapRatio * 10 + c.paddingY;
    };
    let mapNode = (id: string) => {
      let loc: MappedLocation = { X: 0, Y: 0 };
      data.nodes!.some((node) => {
        if (node.id === id) {
          loc.X = scaleX(Number(id) % xSize);
          loc.Y = scaleY(Math.floor(Number(id) / ySize));
          return true;
        }
      });
      return loc;
    };
    let coordNode = (id: string) => {
      let coordX = Number(id) % xSize,
        coordY = Math.floor(Number(id) / ySize);
      return `[${coordY}, ${coordX}]`;
    };

    //
    // SVG
    //

    this.svg.attr("viewBox", `0 0 ${svgWidth}, ${svgHeight}`);

    //
    // Edges
    //

    this.g
      .selectAll("line")
      .data(data.edges!)
      .join(
        function (enter) {
          return enter.append("line").attr("marker-end", "url(#end)");
        },
        function (update) {
          return update;
        },
        function (exit) {
          return exit.on("end", function () {
            d3.select(this).remove();
          });
        }
      )
      .attr("x1", function (d) {
        let src = mapNode(d.source),
          dst = mapNode(d.target);
        if (src.X == dst.X) {
          // vertical
          return src.Y < dst.Y // top -> bottom
            ? src.X + c.dualEdgeSpace // right
            : src.X - c.dualEdgeSpace;
        } else {
          // horizontal
          return src.X;
        }
      })
      .attr("x2", function (d) {
        let src = mapNode(d.source),
          dst = mapNode(d.target);
        if (src.X == dst.X) {
          // vertical
          return src.Y < dst.Y // top -> bottom
            ? dst.X + c.dualEdgeSpace // right
            : dst.X - c.dualEdgeSpace;
        } else {
          // horizontal
          return dst.X;
        }
      })
      .attr("y1", function (d) {
        let src = mapNode(d.source),
          dst = mapNode(d.target);
        if (src.Y == dst.Y) {
          // horizontal
          return src.X < dst.X // left -> right
            ? src.Y - c.dualEdgeSpace // top
            : src.Y + c.dualEdgeSpace;
        } else {
          // vertical
          return src.Y;
        }
      })
      .attr("y2", function (d) {
        let src = mapNode(d.source),
          dst = mapNode(d.target);
        if (src.Y == dst.Y) {
          // horizontal
          return src.X < dst.X // left -> right
            ? dst.Y - c.dualEdgeSpace // top
            : dst.Y + c.dualEdgeSpace;
        } else {
          // vertical
          return dst.Y;
        }
      })
      // edge style: solid or dash
      .attr("stroke-dasharray", function (d) {
        let src = mapNode(d.source),
          dst = mapNode(d.target);
        if (src.X < dst.X || src.Y < dst.Y) {
          // solid: top -> bottom / left -> right
          return "5,0";
        } else {
          // dash: bottom -> top / right -> left
          return "2,1";
        }
      })
      // edge width
      .attr("stroke-width", function (d) {
        // TODO: discuss dynamic width
        return c.edgeWidth;
      })
      // edge opacity
      .attr("opacity", function (d) {
        if (d.style === DisplayStyle.Translucent) {
          return 0.02;
        } else if (d.style === DisplayStyle.Hidden) {
          return 0;
        }
        return 1;
      })
      // mouse events
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke-width", c.edgeWidth * 1.8);
        let edgeColor = colorScheme(d.weight);
        return tooltipEdge
          .style("visibility", "visible")
          .style("background-color", edgeColor)
          .style(
            "color",
            invert(rgbToHex(edgeColor), { black: "#3a3a3a", white: "#fafafa" })
          )
          .html(
            new EdgeTooltip()
              .use({
                src: coordNode(d.source),
                dst: coordNode(d.target),
                weight: d.weight?.toString(),
                detail: d.detail,
              })
              .node()
          );
      })
      .on("mousemove", function (event, d) {
        return tooltipEdge
          .style("top", event.pageY + 1 + "px")
          .style("left", event.pageX + 1 + "px");
      })
      .on("mouseout", function (event, d) {
        d3.select(this).attr("stroke-width", c.edgeWidth);
        return tooltipEdge.style("visibility", "hidden");
      })
      // .transition()

      // edge color
      .attr("stroke", function (d) {
        return colorScheme(d.weight);
      });

    //
    // Nodes
    //

    this.g
      .selectAll("rect")
      .data(data.nodes!)
      .join(
        function (enter) {
          return enter
            .append("rect")
            .attr("width", c.nodeSize)
            .attr("height", c.nodeSize)
            .attr("rx", 1.5) // corner radius
            .attr("ry", 1.5)
            .attr("stroke", "#599dbb")
            .attr("stroke-width", "0.18em")
            .attr("fill", "#8fbed1");
        },
        function (update) {
          return update;
        },
        function (exit) {
          return exit.on("end", function () {
            d3.select(this).remove();
          });
        }
      )
      .attr("x", function (d) {
        return mapNode(d.id).X - c.nodeSize / 2;
      })
      .attr("y", function (d) {
        return mapNode(d.id).Y - c.nodeSize / 2;
      })
      // mouse events
      .on("mouseover", function (event, d) {
        d3.select(this).attr("fill", "#599dbb");
        return tooltipNode
          .style("visibility", "visible")
          .html(
            `ID in Grid: ${d.id}<br>` +
              `Coord: ${coordNode(d.id)}<br>` +
              `Detail: ${d.detail}`
          );
      })
      .on("mousemove", function (event, d) {
        return tooltipNode
          .style("top", event.pageY + 1 + "px")
          .style("left", event.pageX + 1 + "px");
      })
      .on("mouseout", function (event, d) {
        d3.select(this).attr("fill", "#8fbed1");
        return tooltipNode.style("visibility", "hidden");
      });

    //
    // Labels
    //

    this.g
      .selectAll(".node-label")
      .data(data.nodes!)
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
          return exit.on("end", function () {
            d3.select(this).remove();
          });
        }
      )
      .attr("x", function (d) {
        return mapNode(d.id).X;
      })
      .attr("y", function (d) {
        return mapNode(d.id).Y + c.nodeSize * 0.8;
      })
      .transition()
      .text(function (d) {
        if (d.label === undefined) {
          return "";
        } else {
          return d.label;
        }
      });

    let labelX = (d: EdgeDisplay): number => {
      let src = mapNode(d.source),
        dst = mapNode(d.target);
      if (src.X == dst.X) {
        // vertical
        return src.Y < dst.Y // top -> bottom
          ? src.X + c.dualEdgeSpace + c.edgeWidth + c.labelPadding * 2 // right
          : src.X - c.dualEdgeSpace - c.edgeWidth - c.labelPadding * 2;
      } else {
        // horizontal
        return (src.X + dst.X) / 2.0;
      }
    };
    let labelY = (d: EdgeDisplay): number => {
      let src = mapNode(d.source),
        dst = mapNode(d.target);
      if (src.Y == dst.Y) {
        // horizontal
        return src.X < dst.X // left -> right
          ? src.Y - c.dualEdgeSpace - c.edgeWidth - c.labelPadding * 2 // top
          : src.Y + c.dualEdgeSpace + c.edgeWidth + c.labelPadding * 0.75;
      } else {
        // vertical
        return (src.Y + dst.Y) / 2.0;
      }
    };

    this.g
      .selectAll(".edge-label")
      .data(data.edges!)
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
          return exit.on("end", function () {
            d3.select(this).remove();
          });
        }
      )
      .attr("x", function (d) {
        return labelX(d);
      })
      .attr("y", function (d) {
        return labelY(d);
      })
      .transition()
      .text(function (d) {
        return d.label === undefined ? "" : d.label;
      });
  }
}

function rgbToHex(rgb: string) {
  let a = rgb.replace(/[^\d,]/g, "").split(",");
  return (
    "#" +
    ((1 << 24) + (+a[0] << 16) + (+a[1] << 8) + +a[2]).toString(16).slice(1)
  );
}

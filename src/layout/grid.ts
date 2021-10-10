import * as d3 from "d3";
import { NodeData, EdgeData } from "../data";

export type LinkSelection = d3.Selection<
  d3.BaseType,
  EdgeData,
  d3.BaseType,
  unknown
>;

interface Location {
  mappedX: number;
  mappedY: number;
}

export class Grid {
  targetDOM: Document;
  nodeSize: number;
  edgeWidth: number;
  dualLinkSpace: number;
  paddingX: number;
  paddingY: number;
  nodes!: NodeData[];
  links!: EdgeData[];
  refreshCallbacks: Array<(g: LinkSelection) => any>;

  constructor(targetDOM: Document) {
    this.targetDOM = targetDOM;
    this.nodeSize = 40;
    this.edgeWidth = 6.2;
    this.dualLinkSpace = this.edgeWidth;
    this.paddingX = 100;
    this.paddingY = 100;
    this.refreshCallbacks = new Array<(g: LinkSelection) => any>();
  }

  nodeData(data: NodeData[]) {
    this.nodes = data;
  }

  edgeData(data: EdgeData[]) {
    this.links = data;
  }

  mapAxisX: (xid: number) => number = (xid) => {
    return xid * 130 + this.paddingX;
  };

  mapAxisY: (yid: number) => number = (yid) => {
    return yid * 130 + this.paddingY;
  };

  mapNodeLocation: (id: string) => Location = (id) => {
    var loc: Location = { mappedX: 0, mappedY: 0 };
    const mapAxisX = this.mapAxisX;
    const mapAxisY = this.mapAxisY;

    this.nodes.some((node) => {
      if (node.id == id) {
        loc.mappedX = mapAxisX(node.xid);
        loc.mappedY = mapAxisY(node.yid);
        return true;
      }
    });

    return loc;
  };

  addRefreshCallback(callback: (g: LinkSelection) => any) {
    this.refreshCallbacks.push(callback);
  }

  refresh() {
    var g = d3
      .select(this.targetDOM)
      .select("body")
      .select("svg")
      .select("g")
      .selectAll("line")
      .data(this.links);

    // Refresh color
    g.attr("stroke", function (d) {
      return d3.interpolateRdYlBu((9 - d.value) / 9);
    });

    this.refreshCallbacks.forEach((callback) => {
      callback(g);
    });
  }

  render() {
    const nodeSize = this.nodeSize;
    const edgeWidth = this.edgeWidth;
    const dualLinkSpace = this.dualLinkSpace;
    const mapAxisX = this.mapAxisX;
    const mapAxisY = this.mapAxisY;
    const mapNodeLocation = this.mapNodeLocation;

    function edgeStrokeWidth(value: any): number {
      return edgeWidth;
    }

    var body = d3.select(this.targetDOM).select("body");
    var nodeTooltip = body.append("div").attr("class", "tooltip");
    var edgeTooltip = body.append("div").attr("class", "tooltip");

    var svg = body.append("svg").append("g");
    svg
      .append("svg:defs")
      .selectAll("marker")
      .data(["end"]) // different link/path types can be defined here
      .enter()
      .append("svg:marker") // this section adds in the arrows
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", this.nodeSize / 2 + 5)
      .attr("refY", 0)
      .attr("markerWidth", this.edgeWidth / 3.5)
      .attr("markerHeight", this.edgeWidth / 3.5)
      .attr("orient", "auto")
      .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5");

    //
    // Lines
    //
    svg
      .selectAll("line")
      .data(this.links)
      .enter()
      .append("line")
      .attr("x1", function (d) {
        var src = mapNodeLocation(d.source),
          dst = mapNodeLocation(d.target);
        if (src.mappedX == dst.mappedX) {
          // vertical link
          return src.mappedY < dst.mappedY
            ? src.mappedX - dualLinkSpace
            : src.mappedX + dualLinkSpace;
        } else {
          return src.mappedX; // horizontal link
        }
      })
      .attr("y1", function (d) {
        var src = mapNodeLocation(d.source),
          dst = mapNodeLocation(d.target);
        if (src.mappedY == dst.mappedY) {
          // horizontal link
          return src.mappedX < dst.mappedX
            ? src.mappedY - dualLinkSpace
            : src.mappedY + dualLinkSpace;
        } else {
          return src.mappedY; // vertical link
        }
      })
      .attr("x2", function (d) {
        var src = mapNodeLocation(d.source),
          dst = mapNodeLocation(d.target);
        if (src.mappedX == dst.mappedX) {
          // vertical link
          return src.mappedY < dst.mappedY
            ? dst.mappedX - dualLinkSpace
            : dst.mappedX + dualLinkSpace;
        } else {
          return dst.mappedX; // horizontal link
        }
      })
      .attr("y2", function (d) {
        var src = mapNodeLocation(d.source),
          dst = mapNodeLocation(d.target);
        if (src.mappedY == dst.mappedY) {
          // horizontal link
          return src.mappedX < dst.mappedX
            ? dst.mappedY - dualLinkSpace
            : dst.mappedY + dualLinkSpace;
        } else {
          return dst.mappedY; // vertical link
        }
      })
      .attr("marker-end", "url(#end)")
      .attr("stroke-dasharray", function (d) {
        var src = mapNodeLocation(d.source),
          dst = mapNodeLocation(d.target);
        if (src.mappedX < dst.mappedX || src.mappedY < dst.mappedY) {
          return "5,0";
        } else {
          return "2,1";
        }
      })
      .attr("stroke-width", function (d) {
        return edgeStrokeWidth(d.value);
      })
      .attr("stroke", function (d) {
        return d3.interpolateRdYlBu((9 - d.value) / 9);
      })
      // Mouse over
      .on("mouseover", function (event, d) {
        svg.selectAll("line").attr("opacity", 0.2);

        d3.select(this).attr("opacity", 1);
        var nodeID = d3.select(this).attr("nodeID");

        return edgeTooltip
          .style("visibility", "visible")
          .html(
            `Edge valued ${d.value} , linked ${d.source} -> ${d.target}` +
              `<br>With details: ${d.details}`
          )
          .style("opacity", 0.85);
      })
      // Mouse move
      .on("mousemove", function (event, d) {
        return edgeTooltip
          .style("top", event.pageY + 16 + "px")
          .style("left", event.pageX + 16 + "px");
      })
      // Mouse out
      .on("mouseout", function (event, d) {
        svg.selectAll("rect").attr("opacity", 1);
        svg.selectAll("line").attr("opacity", 1);
        return edgeTooltip.style("visibility", "hidden");
      });

    //
    // Nodes
    //
    svg
      .selectAll("rect")
      .data(this.nodes)
      .enter()
      .append("rect")
      .attr("width", nodeSize)
      .attr("height", nodeSize)
      .attr("rx", 1)
      .attr("ry", 1)
      .attr("x", function (d, i) {
        return mapAxisX(d.xid) - nodeSize / 2;
      })
      .attr("y", function (d, i) {
        return mapAxisY(d.yid) - nodeSize / 2;
      })
      .attr("nodeID", function (d, i) {
        return d.id;
      })
      .attr("stroke", "#599dbb")
      .attr("fill", "#8fbdd1")
      // Mouse over
      .on("mouseover", function (event, d) {
        svg.selectAll("rect").attr("opacity", 1);

        d3.select(this).attr("opacity", 1);
        var nodeID = d3.select(this).attr("nodeID");

        return nodeTooltip
          .style("visibility", "visible")
          .html(
            `Location : ${d.id} <br> Grid Node ID: ${nodeID} ` +
              `<br>Select Coord: [${d.xid}, ${d.yid}]`
          )
          .style("opacity", 0.85);
      })
      // Mouse move
      .on("mousemove", function (event, d) {
        return nodeTooltip
          .style("top", event.pageY + 16 + "px")
          .style("left", event.pageX + 16 + "px");
      })
      // Mouse out
      .on("mouseout", function (event, d) {
        svg.selectAll("rect").attr("opacity", 1);
        svg.selectAll("line").attr("opacity", 1);
        return nodeTooltip.style("visibility", "hidden");
      });

    //
    // Text
    //
    svg
      .selectAll("text")
      .data(this.nodes)
      .enter()
      .append("text")
      .attr("x", function (d) {
        return mapAxisX(d.xid);
      })
      //Set Y value to be more than the d.yid to display the text beneath
      .attr("y", function (d) {
        return mapAxisY(d.yid) + nodeSize * 1.5;
      })
      .attr("text-anchor", "middle")
      //Set the location name to be d.id
      .text(function (d) {
        return d.name;
      })
      .attr("fill", "#B94629")
      .style("font-size", "20px")
      .style("font-weight", "bold");
  }

  legend(val: number) {
    var g = d3.select(this.targetDOM).select("body").select("svg").select("g");
    g.selectAll("line")
      .data(this.links)
      .attr("opacity", (d) => {
        return d.value == val ? 1 : 0.2;
      })
      .attr("stroke-width", (d) => {
        return d.value == val ? this.edgeWidth * 1.2 : this.edgeWidth;
      });
  }
}

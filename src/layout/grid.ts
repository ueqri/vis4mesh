import * as d3 from "d3";
import { NodeData, EdgeData } from "../data";

interface Location {
  mappedX: number;
  mappedY: number;
}

export class Grid {
  width: number;
  height: number;
  nodeSize: number;
  paddingX: number;
  paddingY: number;
  nodes!: NodeData[];
  links!: EdgeData[];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.nodeSize = 40;
    this.paddingX = 100;
    this.paddingY = 100;
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

  render() {
    const nodeSize = this.nodeSize;
    const mapAxisX = this.mapAxisX;
    const mapAxisY = this.mapAxisY;
    const mapNodeLocation = this.mapNodeLocation;

    function edgeStrokeWidth(value: any): number {
      return 8;
    }

    var nodeTooltip = d3.select("body").append("div").attr("class", "tooltip");
    var edgeTooltip = d3.select("body").append("div").attr("class", "tooltip");

    var svg = d3
      .select("body")
      .append("svg")
      .attr("width", "100%")
      .attr("height", "900");

    //
    // Lines
    //
    svg
      .selectAll("line")
      .data(this.links)
      .enter()
      .append("line")
      .attr("x1", function (d) {
        return mapNodeLocation(d.source).mappedX;
      })
      .attr("y1", function (d) {
        return mapNodeLocation(d.source).mappedY;
      })
      .attr("x2", function (d) {
        return mapNodeLocation(d.target).mappedX;
      })
      .attr("y2", function (d) {
        return mapNodeLocation(d.target).mappedY;
      })
      .attr("stroke-width", function (d) {
        return edgeStrokeWidth(d.value);
      })
      .attr("stroke", "black")
      // Mouse over
      .on("mouseover", function (event, d) {
        svg.selectAll("line").attr("opacity", 0.2);

        d3.select(this).attr("opacity", 1);
        var nodeID = d3.select(this).attr("nodeID");

        return edgeTooltip
          .style("visibility", "visible")
          .html(
            "Edge valued " +
              d.value +
              ", linked " +
              d.source +
              " and " +
              d.target +
              "<br>With details: " +
              d.details
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
      .attr("rx", 5)
      .attr("ry", 5)
      .attr("x", function (d, i) {
        return mapAxisX(d.xid) - nodeSize / 2;
      })
      .attr("y", function (d, i) {
        return mapAxisY(d.yid) - nodeSize / 2;
      })
      .attr("nodeID", function (d, i) {
        return d.id;
      })
      .attr("stroke", "grey")
      .attr("fill", "#B94629")
      // Mouse over
      .on("mouseover", function (event, d) {
        svg.selectAll("rect").attr("opacity", 0.2);

        d3.select(this).attr("opacity", 1);
        var nodeID = d3.select(this).attr("nodeID");

        return nodeTooltip
          .style("visibility", "visible")
          .html(
            "Location : " +
              d.id +
              "<br>Grid Node ID: " +
              nodeID +
              "<br>Select Coord: " +
              d.xid +
              "," +
              d.yid
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
        return mapAxisY(d.yid) + nodeSize;
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
}

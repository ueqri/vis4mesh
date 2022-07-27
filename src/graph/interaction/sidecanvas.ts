import * as d3 from "d3";
import { chord } from "d3-chord";
import AbstractNode from "display/abstractnode";

const div = d3.select("#sidecanvas");
const content = div.select("#sidecanvas-content");
const width = 250;
const height = 250;
class SideCanvas {
  readonly svg = div
    .append("svg")
    .attr("id", "flowchord")
    .attr("height", height)
    .attr("width", width)
    .attr("viewBox", [-width / 2, -height / 2, width, height]);

  constructor() {}

  load(meta: Object, nodeMap: { [id: number]: AbstractNode }) {}

  Clear() {
    content.html(`<h4>Overview</h4>`);
    this.svg.selectAll("g").remove();
  }

  write(html: string) {
    content.html(html);
  }

  DisplayTransChord() {
    var matrix = [
      [0, 5871, 8916, 2868],
      [1951, 0, 2060, 6171],
      [8010, 16145, 0, 8045],
      [1013, 990, 940, 0],
    ];

    // 4 groups, so create a vector of 4 colors
    var colors = ["#440154ff", "#31668dff", "#37b578ff", "#fde725ff"];
    // give this matrix to d3.chord(): it will calculates all the info we need to draw arc and ribbon
    let res = d3.chord().padAngle(0.05).sortSubgroups(d3.descending)(matrix);

    // add the groups on the outer part of the circle
    let g = this.svg.datum(res).append("g");

    g.selectAll("g")
      .data(function (d) {
        return d.groups;
      })
      .enter()
      .append("g")
      .append("path")
      .style("fill", function (d, i) {
        return colors[i];
      })
      .style("stroke", "black")
      .attr(
        "d",
        d3.arc().innerRadius(100).outerRadius(110) as unknown as string
      );

    // Add the links between groups
    g.datum(res)
      .append("g")
      .selectAll("path")
      .data(function (d) {
        return d;
      })
      .enter()
      .append("path")
      .attr("d", d3.ribbon().radius(100) as unknown as string)
      .style("fill", function (d) {
        return colors[d.source.index];
      }) // colors depend on the source grouDisplayTransChordp. Change to target otherwise.
      .style("stroke", "black");
  }
}

export default new SideCanvas();

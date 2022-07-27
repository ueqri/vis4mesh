import * as d3 from "d3";
import { chord } from "d3-chord";
import AbstractNode from "display/abstractnode";

const div = d3.select("#sidecanvas");
const content = div.select("#sidecanvas-content");
const width = 350;
const height = 350;
const colors = ["#440154ff", "#31668dff", "#37b578ff", "#fde725ff"];
const names = ["N", "W", "S", "E"];
const matrix = [
  [0, 871, 916, 2868],
  [1951, 0, 2060, 671],
  [800, 1645, 0, 805],
  [1013, 990, 940, 0],
];
const innerR = 100;
const outerR = 110;

interface groupAttr {
  value: number;
  angle: number;
}

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

  DisplayChord() {
    const chords = d3
      .chord()
      .padAngle(10 / innerR)
      .sortSubgroups(d3.descending)
      .sortChords(d3.descending)(matrix);

    const group = this.svg
      .append("g")
      .attr("font-size", 10)
      .attr("font-family", "sans-serif")
      .selectAll("g")
      .data(chords.groups)
      .join("g");

    group
      .append("path")
      .attr("fill", (d) => colors[d.index])
      .attr(
        "d",
        d3.arc().innerRadius(innerR).outerRadius(outerR) as unknown as string
      );
    group.append("title").text((d) => `${names[d.index]} ${d.value}`);

    const ticks = (d: {
      startAngle: number;
      endAngle: number;
      value: number;
    }) => {
      const k = (d.endAngle - d.startAngle) / d.value;
      return d3.range(0, d.value, 1000).map((value) => {
        return { value: value, angle: value * k + d.startAngle };
      });
    };

    const groupTick = group
      .append("g")
      .selectAll("g")
      .data(ticks)
      .join("g")
      .attr(
        "transform",
        (d) =>
          `rotate(${(d.angle * 180) / Math.PI - 90}) translate(${outerR},0)`
      );

    groupTick.append("line").attr("stroke", "currentColor").attr("x2", 6);

    groupTick
      .append("text")
      .attr("x", 8)
      .attr("dy", "0.35em")
      .attr("transform", (d) =>
        d.angle > Math.PI ? "rotate(180) translate(-16)" : null
      )
      .attr("text-anchor", (d) => (d.angle > Math.PI ? "end" : null))
      .text((d) => d.value);

    group
      .select("text")
      .attr("font-weight", "bold")
      .text(function (d) {
        return `${names[d.index]}`;
      });

    this.svg
      .append("g")
      .attr("fill-opacity", 0.8)
      .selectAll("path")
      .data(chords)
      .join("path")
      .style("mix-blend-mode", "multiply")
      .attr("fill", (d) => colors[d.source.index])
      .attr(
        "d",
        d3
          .ribbon()
          .radius(innerR - 1)
          .padAngle(1 / innerR) as unknown as string
      )
      .append("title")
      .text(
        (d) =>
          `${d.source.value} ${names[d.target.index]} → ${
            names[d.source.index]
          }${
            d.source.index === d.target.index
              ? ""
              : `\n${d.target.value} ${names[d.source.index]} → ${
                  names[d.target.index]
                }`
          }`
      );
  }

  DisplayTransChord() {
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

import * as d3 from "d3";
import AbstractNode from "display/abstractnode";
import { opt, handleFlatResponseByMsgGroups } from "timebar/timebar";
import StackedChart from "widget/standalone/stackchart";
import { Component } from "global";
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

const port = Component.port;

class SideCanvas {
  constructor() {}

  load(meta: Object, nodeMap: { [id: number]: AbstractNode }) {}

  Clear() {
    content.html(`<h4>Overview</h4>`);
    div.selectAll("#flowchord").remove();
  }

  write(html: string) {
    content.html(html);
  }

  async AddLinkHistogram(linkName: string) {
    const history = await port.snapshotByEdge(linkName);
    if (history === undefined) return;
    let histogram_opt = opt;
    histogram_opt.height = 250;
    histogram_opt.width = 300;

    let chart = new StackedChart(
      handleFlatResponseByMsgGroups(history),
      histogram_opt
    );
    const histoId = "stacked-chart-" + linkName;
    let svg = chart.axis();
    svg.attr("id", histoId);
    chart.bar(svg);
    const close = {
      cx: histogram_opt.width - 10,
      cy: 10,
      r: 4,
      id: "close-" + linkName,
    };
    svg
      .append("g")
      .selectAll<SVGSVGElement, any>("circle")
      .data<any>([close], (d) => d)
      .enter()
      .append("circle")
      .attr("id", (d) => d.id)
      .attr("cx", (d) => d.cx)
      .attr("cy", (d) => d.cy)
      .attr("r", (d) => d.r)
      .attr("fill", "blue")
      .on("mouseover", (ev, d) => {
        console.log("mouseover close");
        const sel = d3.select("#" + d.id);
        sel.attr("fill", "#ff0000");
      })
      .on("mouseout", (ev, d) => {
        const sel = d3.select("#" + d.id);
        sel.attr("fill", "#0000ff");
      })
      .on("click", (ev, d) => {
        d3.select("#" + histoId).remove();
      });
    div.append(() => chart.node(svg));
  }

  DisplayChord() {
    const svg = div
      .append("svg")
      .attr("id", "flowchord")
      .attr("height", height)
      .attr("width", width)
      .attr("viewBox", [-width / 2, -height / 2, width, height]);

    const chords = d3
      .chord()
      .padAngle(10 / innerR)
      .sortSubgroups(d3.descending)
      .sortChords(d3.descending)(matrix);

    const group = svg
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

    svg
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
}

export default new SideCanvas();

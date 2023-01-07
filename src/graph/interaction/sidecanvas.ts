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
const colorList = [
  "gold",
  "blue",
  "green",
  "yellow",
  "grey",
  "darkgreen",
  "pink",
  "brown",
  "slateblue",
  "grey1",
  "orange",
];

class SideCanvas {
  charts: Map<string, string>;
  colorPools: Map<string, boolean>;

  constructor() {
    this.charts = new Map<string, string>();
    this.colorPools = new Map<string, boolean>();
    for (let color of colorList) {
      this.colorPools.set(color, true);
    }
    div
      .append("svg:defs")
      .append("path")
      .attr("viewBox", "-16 -18 64 64")
      .attr("id", "pin")
      .attr("d", "M0,47 Q0,28 10,15 A15,15 0,1,0 -10,15 Q0,28 0,47")
      .attr("stroke-width", 1)
      .attr("stroke", "black");
  }

  load(meta: Object, nodeMap: { [id: number]: AbstractNode }) {}

  write(html: string) {
    content.html(html);
  }

  registerLink(name: string) {
    if (this.charts.has(name) || this.colorPools.size === 0) {
      return false;
    }
    let selectedColor = "black";
    for (let color of this.colorPools) {
      selectedColor = color[0];
      break;
    }
    this.colorPools.delete(selectedColor);
    this.charts.set(name, selectedColor);
    return selectedColor;
  }

  checkoutLink(name: string) {
    let color = this.charts.get(name);
    this.colorPools.set(color!, true);
    this.charts.delete(name);
    div.select("#" + name).remove();
  }

  async AddLinkHistogram(
    linkName: string,
    register: (color: string) => any,
    unregister: () => any,
    clickJump: () => any,
    mouseoverPin: () => any,
    mouseoutPin: () => any
  ) {
    const histoId = "stacked-chart-" + linkName;

    let color = this.registerLink(histoId);
    if (color === false) {
      return;
    }
    register(color);

    const history = await port.snapshotByEdge(linkName);
    if (history === undefined) return;
    let histogram_opt = opt;
    histogram_opt.height = 250;
    histogram_opt.width = 300;

    let chart = new StackedChart(
      handleFlatResponseByMsgGroups(history),
      histogram_opt
    );
    let svg = chart.axis();
    svg.attr("id", histoId);
    chart.bar(svg);
    const close = {
      cx: histogram_opt.width - 10,
      cy: 15,
      r: 4,
      id: "close-" + linkName,
    };

    svg
      .append("use")
      .attr("xlink:href", "#pin")
      .attr("id", "pin-" + histoId)
      .attr("fill", color)
      .attr("transform", `translate(275, 10) scale(0.3)`)
      .on("click", clickJump)
      .on("mouseover", () => {
        let sel = svg.select("#pin-" + histoId);
        sel.style("cursor", "pointer");
        mouseoverPin();
      })
      .on("mouseout", () => {
        let sel = svg.select("#pin-" + histoId);
        sel.style("cursor", "default");
        mouseoutPin();
      });

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
        const sel = svg.select("#" + d.id);
        sel.attr("fill", "#ff0000");
        sel.style("cursor", "pointer");
      })
      .on("mouseout", (ev, d) => {
        const sel = svg.select("#" + d.id);
        sel.attr("fill", "#0000ff");
        sel.style("cursor", "default");
      })
      .on("click", (ev, d) => {
        this.checkoutLink(histoId);
        unregister();
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

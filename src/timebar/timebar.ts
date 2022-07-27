import * as d3 from "d3";
import { DataPortFlatResponse } from "data/data";
import StackedChart from "widget/standalone/stackchart";
import { SVGSelection, StackBarOptions } from "widget/standalone/stackchart";
import {
  DataOrCommandDomain,
  MsgGroupsDomain,
  NumMsgGroups,
} from "data/classification";
import { Component, Element, Module } from "global";
import Event from "event";
import { FlatData } from "data/data";

const ev = {
  MsgGroup: "FilterMsgGroup",
  DataOrCommand: "FilterDoC",
};

const div = d3.select("#timebar");
const colorScheme = d3.schemeSpectral;
// mapping from group to color, e.g. { "Translations": "red" }
const fixGroupColor = MsgGroupsDomain.reduce(
  (a, g, i) => ({ ...a, [g]: colorScheme[NumMsgGroups][i] }),
  {}
);
// mapping from data or command to color, e.g. { "D": "red" }
const fixDoCColor = DataOrCommandDomain.reduce(
  (a, g, i) => ({ ...a, [g]: ["#d7191c", "#2b83ba"][i] }),
  {}
);

let opt: StackBarOptions = {
  x: (d) => d.id,
  y: (d) => d.count,
  z: (d) => d.group, // or d.doc
  width: 0,
  height: 0,
  offset: d3.stackOffsetNone,
  yLabel: "Message Count",
  zDomain: MsgGroupsDomain,
  colors: colorScheme[NumMsgGroups],
  yFormat: "~s", // SI prefix and trims insignificant trailing zeros
};

interface FormattedDataForChartByMsgGroups {
  id: string;
  group: string;
  count: number;
}

interface FormattedDataForChartByDoC {
  id: string;
  doc: string;
  count: number;
}

function handleFlatResponseByMsgGroups(
  data: DataPortFlatResponse
): FormattedDataForChartByMsgGroups[] {
  const reduce = d3.flatRollup(
    data,
    (v) => Number(d3.sum(v, (v) => v.count)),
    (d) => String(d.id),
    (d) => d.group
  );
  return Array.from(reduce, ([id, group, count]) => ({
    id,
    group,
    count,
  })).sort(function (a, b) {
    return d3.ascending(a.group, b.group);
  });
}

function handleFlatResponseByDoC(
  data: DataPortFlatResponse
): FormattedDataForChartByDoC[] {
  const reduce = d3.flatRollup(
    data,
    (v) => Number(d3.sum(v, (v) => v.count)),
    (d) => String(d.id),
    (d) => d.doc
  );
  return Array.from(reduce, ([id, doc, count]) => ({
    id,
    doc,
    count,
  })).sort(function (a, b) {
    return d3.ascending(a.doc, b.doc);
  });
}

export async function RenderTimebar(
  name: string = "flat",
  setzero: boolean = false
) {
  console.log("Render Timebar from flat data");
  await Component.port.snapshotByEdge(name);
  let resp = await Component.port.flat();
  console.log(resp);
  if (setzero) {
    let zeroresp = JSON.parse(JSON.stringify(resp));
    console.log(zeroresp);
    for (let data of zeroresp) {
      data.count = 0;
    }
    RenderTimebarImpl(zeroresp);
  } else {
    RenderTimebarImpl(resp);
  }
}

export function RenderTimebarImpl(resp: FlatData) {
  const timebar = Element.timebar.loadFlatResponse(resp);

  Component.ticker.setCast((l, r) => timebar.moveBrush(l, r));
  Component.layout.timebar.afterResizing(() => timebar.render());

  Event.AddStepListener(ev.MsgGroup, (g: string[]) =>
    timebar.updateMsgGroupDomain(g)
  );
  Event.AddStepListener(ev.DataOrCommand, (doc: string[]) =>
    timebar.updateDataOrCommandDomain(doc)
  );

  timebar.render();
}

export default class Timebar {
  protected chart!: StackedChart;
  protected svg!: SVGSelection;
  protected brush!: d3.BrushBehavior<unknown>;
  protected data!: Object;
  protected dataForMsgGroups!: FormattedDataForChartByMsgGroups[];
  protected dataForDoC!: FormattedDataForChartByDoC[];
  protected prevBrush: [number, number];

  constructor(d?: DataPortFlatResponse) {
    this.prevBrush = [0, 0];
    if (d !== undefined) {
      this.loadFlatResponse(d);
    }
  }

  loadFlatResponse(d: DataPortFlatResponse): this {
    this.dataForMsgGroups = handleFlatResponseByMsgGroups(d);
    this.dataForDoC = handleFlatResponseByDoC(d);
    this.data = this.dataForMsgGroups; // filter message groups by default
    return this;
  }

  updateMsgGroupDomain(domain: string[]) {
    opt.z = (d) => d.group;
    opt.zDomain = domain;
    opt.colors = domain.map((d) => fixGroupColor[d]);
    this.data = this.dataForMsgGroups;
    this.render();
  }

  updateDataOrCommandDomain(domain: string[]) {
    opt.z = (d) => d.doc;
    opt.zDomain = domain;
    opt.colors = domain.map((d) => fixDoCColor[d]);
    this.data = this.dataForDoC;
    this.render();
  }

  render() {
    div.select("#stacked-chart").remove();

    opt.width = (div.node() as Element).getBoundingClientRect().width;
    opt.height = (div.node() as Element).getBoundingClientRect().height;

    let chart = new StackedChart(this.data, opt);
    let svg = chart.axis();
    svg.attr("id", "stacked-chart");
    chart.bar(svg);
    let brush = chart.brush(
      svg,
      (l, r) => {
        Component.ticker.signal["state"]("pause");
        Module.setTime.signal["start"](l);
        Module.setTime.signal["end"](r);
        Module.setTime.signal["refresh"](undefined);
      },
      this.prevBrush
    );

    div.append(() => chart.node(svg));

    this.chart = chart;
    this.svg = svg;
    this.brush = brush;
  }

  moveBrush(left: number, right: number) {
    this.prevBrush = [left, right];
    this.chart.moveBrush(this.svg, this.brush, this.prevBrush);
  }
}

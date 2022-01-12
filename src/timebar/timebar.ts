import * as d3 from "d3";
import DataPort from "../data/dataport";
import { DataPortFlatResponse } from "../data/data";
import StackedChart from "../widget/standalone/stackchart";
import { offsetSeparated, SVGSelection } from "../widget/standalone/stackchart";
import { StackBarOptions } from "../widget/standalone/stackchart";
import RegisterResizerEvent from "./resizer";
import Ticker from "./ticker";
import Controller from "../controller/controller";
import {
  DataOrCommandDomain,
  MsgGroupsDomain,
  NumMsgGroups,
} from "../data/classification";
import { FilterEventListener } from "../filterbar/filterbar";

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
  yLabel: "Count",
  zDomain: MsgGroupsDomain,
  colors: colorScheme[NumMsgGroups],
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

export default function RenderTimebar(
  port: DataPort,
  c: Controller,
  t: Ticker,
  f: FilterEventListener
) {
  port.flat(1).then((resp) => {
    const timebar = new Timebar(c, t, resp);
    timebar.render();

    const resizer = div.select(".resizer");
    RegisterResizerEvent(div, resizer, () => timebar.render());
    d3.select(window).on("resize", () => timebar.render());

    t.setCast((l, r) => timebar.moveBrush(l, r));

    f.AppendForMsgGroup((g) => timebar.updateMsgGroupDomain(g));
    f.AppendForDataOrCommand((doc) => timebar.updateDataOrCommandDomain(doc));
  });
}

class Timebar {
  protected controller: Controller;
  protected ticker: Ticker;
  protected chart!: StackedChart;
  protected svg!: SVGSelection;
  protected brush!: d3.BrushBehavior<unknown>;
  protected data!: Object;
  protected dataForMsgGroups: FormattedDataForChartByMsgGroups[];
  protected dataForDoC: FormattedDataForChartByDoC[];

  constructor(c: Controller, t: Ticker, d: DataPortFlatResponse) {
    this.controller = c;
    this.ticker = t;
    this.dataForMsgGroups = handleFlatResponseByMsgGroups(d);
    this.dataForDoC = handleFlatResponseByDoC(d);
    this.data = this.dataForMsgGroups; // filter message groups by default
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
    // div.selectAll("svg").remove();

    opt.width = (div.node() as Element).getBoundingClientRect().width;
    opt.height = (div.node() as Element).getBoundingClientRect().height;

    let chart = new StackedChart(this.data, opt);
    let svg = chart.axis();
    svg.attr("id", "stacked-chart");
    chart.bar(svg);
    let brush = chart.brush(svg, (l, r) => {
      this.ticker.signal["state"]("pause");
      this.controller.startTime = l;
      this.controller.endTime = r;
      this.controller.requestDataPort();
    });

    div.append(() => chart.node(svg));

    this.chart = chart;
    this.svg = svg;
    this.brush = brush;
  }

  moveBrush(left: number, right: number) {
    if (right < 1) {
      // console.error("Right position of brush cannot be less than 1");
      return;
    } else if (left > right) {
      console.error("Left position of brush cannot be greater than right");
      return;
    }
    const chart = this.chart;
    const mapL: number = chart.xScale(`${left}`);
    // To avoid position out of right bound, use last bar + band width,
    // and `right` always >= 1
    const mapR: number =
      chart.xScale(`${right - 1}`) + chart.xScale.bandwidth();
    this.svg.select(".brush").call(this.brush.move as any, [mapL, mapR]);
  }
}

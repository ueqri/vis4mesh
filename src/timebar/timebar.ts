import * as d3 from "d3";
import DataPort from "../data/dataport";
import { DataPortFlatResponse } from "../data/data";
import StackedChart from "../widget/standalone/stackchart";
import { offsetSeparated, SVGSelection } from "../widget/standalone/stackchart";
import { StackBarOptions } from "../widget/standalone/stackchart";
import RegisterResizerEvent from "./resizer";
import { Ticker } from "./ticker";
import { Controller } from "../controller/controller";
import { MsgGroupsDomain, NumMsgGroups } from "../data/classification";
import { FilterEventListener } from "../filterbar/filterbar";

const div = d3.select("#timebar");
const colorScheme = d3.schemeSpectral;
// mapping from group to color, e.g. { "Translations": "red" }
const fixGroupColor = MsgGroupsDomain.reduce(
  (a, g, i) => ({ ...a, [g]: colorScheme[NumMsgGroups][i] }),
  {}
);

let opt: StackBarOptions = {
  x: (d) => d.id,
  y: (d) => d.count,
  z: (d) => d.group,
  width: 0,
  height: 0,
  offset: d3.stackOffsetNone,
  yLabel: "Count",
  zDomain: MsgGroupsDomain,
  colors: colorScheme[NumMsgGroups],
};

interface FormattedDataForChart {
  id: string;
  group: string;
  count: number;
}

function handleFlatResponse(
  data: DataPortFlatResponse
): FormattedDataForChart[] {
  const reduce = d3.flatRollup(
    data,
    (v) => Math.log10(Number(d3.sum(v, (v) => v.count)) + 1),
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

export function RenderTimebar(
  port: DataPort,
  c: Controller,
  t: Ticker,
  f: FilterEventListener
) {
  port.flat(1).then((resp) => {
    const timebar = new Timebar(c, t, handleFlatResponse(resp));
    timebar.render();

    const resizer = div.select(".resizer");
    RegisterResizerEvent(div, resizer, () => timebar.render());
    d3.select(window).on("resize", () => timebar.render());

    t.setCast((l, r) => timebar.moveBrush(l, r));

    f.AppendForMsgGroup((g) => timebar.updateMsgGroupDomain(g));
  });
}

export class Timebar {
  protected controller: Controller;
  protected ticker: Ticker;
  protected chart!: StackedChart;
  protected svg!: SVGSelection;
  protected brush!: d3.BrushBehavior<unknown>;
  protected data: FormattedDataForChart[];

  constructor(c: Controller, t: Ticker, d: FormattedDataForChart[]) {
    this.controller = c;
    this.ticker = t;
    this.data = d;
  }

  updateMsgGroupDomain(domain: string[]) {
    opt.zDomain = domain;
    opt.colors = domain.map((d) => fixGroupColor[d]);
    this.render();
  }

  render() {
    div.selectAll("svg").remove();

    opt.width = (div.node() as Element).getBoundingClientRect().width;
    opt.height = (div.node() as Element).getBoundingClientRect().height;

    let chart = new StackedChart(this.data, opt);
    let svg = chart.axis();
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
      console.error("Right position of brush cannot be less than 1");
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

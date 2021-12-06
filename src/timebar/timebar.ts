import * as d3 from "d3";
import DataPort from "../data/dataport";
import { DataPortFlatResponse } from "../data/data";
import StackedChart from "../widget/standalone/stackchart";
import { offsetSeparated, SVGSelection } from "../widget/standalone/stackchart";
import { StackBarOptions } from "../widget/standalone/stackchart";
import RegisterResizerEvent from "./resizer";
import { Ticker } from "./ticker";
import { Controller } from "../controller/controller";
import { swatches } from "../widget/standalone/legend";

const timebar = d3.select("#timebar");
const numMsgGroup = 4;

let opt: StackBarOptions = {
  x: (d) => d.id,
  y: (d) => d.count,
  z: (d) => d.group,
  width: 0,
  height: 0,
  offset: d3.stackOffsetNone,
  yLabel: "Count",
  zDomain: ["Translation", "Read", "Write", "Others"],
  colors: d3.schemeSpectral[numMsgGroup],
};

let controller: Controller;
let ticker: Ticker;
let chart: StackedChart;
let svg: SVGSelection;
let brush: d3.BrushBehavior<unknown>;

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

function renderResizer(callback: () => any) {
  const resizer = timebar.select(".resizer");
  RegisterResizerEvent(timebar, resizer, callback);
}

function renderChart(data: FormattedDataForChart[]) {
  timebar.selectAll("svg").remove();

  opt.width = (timebar.node() as Element).getBoundingClientRect().width;
  opt.height = (timebar.node() as Element).getBoundingClientRect().height;

  chart = new StackedChart(data, opt);
  svg = chart.axis();
  chart.bar(svg);
  brush = chart.brush(svg, (l, r) => {
    ticker.signal["state"]("pause");
    controller.startTime = l;
    controller.endTime = r;
    controller.requestDataPort();
  });

  timebar.append(() => chart.node(svg));
}

export default function RenderTimebar(
  port: DataPort,
  c: Controller,
  t: Ticker
) {
  d3.select("#filterbar")
    .append("div")
    .html(
      swatches(
        d3.scaleOrdinal(
          ["Translation", "Read", "Write", "Others"],
          d3.schemeSpectral[numMsgGroup]
        )
      )
    );

  controller = c;
  ticker = t;
  port.flat(1).then((resp) => {
    const data = handleFlatResponse(resp);

    renderResizer(() => renderChart(data));
    d3.select(window).on("resize", () => renderChart(data));

    ticker.setCast((l, r) => {
      const padding: number = chart.xScale.step() - chart.xScale.bandwidth();
      const mapL: number = chart.xScale(`${l}`);
      const mapR: number = chart.xScale(`${r}`) - padding;
      // console.log(mapL, mapR);
      svg.select(".brush").call(brush.move as any, [mapL, mapR]);
    });
  });
}

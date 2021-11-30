import * as d3 from "d3";
import DataPort from "../data/dataport";
import { DataPortFlatResponse } from "../data/data";
import StackedChart from "../widget/standalone/stackchart";
import { offsetSeparated } from "../widget/standalone/stackchart";
import { StackBarOptions } from "../widget/standalone/stackchart";

const width = 1200;
const focusHeight = 300;
const numMsgGroup = 4;

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

export default function RenderTimebar(port: DataPort) {
  port.flat(1).then((resp) => {
    const data = handleFlatResponse(resp);
    console.log(data);
    let opt: StackBarOptions = {
      x: (d) => d.id,
      y: (d) => d.count,
      z: (d) => d.group,
      width: width,
      height: focusHeight,
      offset: d3.stackOffsetNone,
      yLabel: "Count",
      colors: d3.schemeSpectral[numMsgGroup],
    };
    const chart = new StackedChart(data, opt);

    opt.offset = offsetSeparated;
    const separated = new StackedChart(data, opt);

    const svg = chart.axis();
    const areaChart = chart.area(svg);
    const barChart = chart.bar(svg);
    const areaSeparated = separated.area(svg);
    const barSeparated = separated.bar(svg);
    areaChart.style("display", "none");
    // barChart.style("display", "none");
    areaSeparated.style("display", "none");
    barSeparated.style("display", "none");
    chart.brush(svg);
    d3.select("#timebar").append(() => chart.node(svg));
  });
}

import * as d3 from "d3";
import DataPort from "../data/dataport";
import { DataPortFlatResponse } from "../data/data";
import StackedChart, { offsetSeparated } from "../widget/standalone/stackchart";

const width = 1200;
const focusHeight = 400;
const numMsgGroup = 5;

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
  port.flat(1).then((data) => {
    console.log(handleFlatResponse(data));
    const chart = new StackedChart(handleFlatResponse(data), {
      x: (d) => d.id,
      y: (d) => d.count,
      z: (d) => d.group,
      width: width,
      height: focusHeight,
      offset: d3.stackOffsetNone,
      yLabel: "Count",
      colors: d3.schemeSpectral[numMsgGroup],
    });
    d3.select("#timebar")
      .append(() => chart.area())
      .attr("id", "chart-area")
      .style("display", "none");

    d3.select("#timebar")
      .append(() => chart.bar())
      .attr("id", "chart-bar");
  });
}

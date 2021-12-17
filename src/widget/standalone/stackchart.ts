import * as d3 from "d3";

export type SVGSelection = d3.Selection<
  SVGSVGElement,
  undefined,
  null,
  undefined
>;

export type SVGGroupSelection = d3.Selection<
  SVGGElement,
  undefined,
  null,
  undefined
>;

// Function to offset each layer by the maximum of the previous layer, borrowed
// from: https://observablehq.com/@mkfreeman/separated-bar-chart
export function offsetSeparated(
  series: d3.Series<any, any>,
  order: Iterable<number>
) {
  const layerPadding: number = 0.25;
  if (!((n = series.length) > 1)) return;
  // Standard series
  for (var i = 1, s0, s1 = series[order[0]], n, m = s1.length; i < n; ++i) {
    (s0 = s1), (s1 = series[order[i]]);
    // Here is where you calculate the maximum of the previous layer
    let base: number = Number(d3.max(s0, (d) => d[1]) as string) + layerPadding;
    for (var j = 0; j < m; ++j) {
      // Set the height based on the data values, shifted up by the previous layer
      let diff = s1[j][1] - s1[j][0];
      s1[j][0] = base;
      s1[j][1] = base + diff;
    }
  }
}

export interface StackBarOptions {
  x: (d: any, i: number) => any; // given d in data, returns the (ordinal) x-value
  y: (d: any) => number; // given d in data, returns the (quantitative) y-value
  z: (d: any) => any; // given d in data, returns the (categorical) z-value
  title?: (d: any) => string; // given d in data, returns the title text, i.e. mouse tooltip
  marginTop?: number; // top margin, in pixels
  marginRight?: number; // right margin, in pixels
  marginBottom?: number; // bottom margin, in pixels
  marginLeft?: number; // left margin, in pixels
  width: number; // outer width, in pixels
  height: number; // outer height, in pixels
  xDomain?: any[]; // array of x-values
  xRange?: [number, number]; // [left, right]
  xPadding?: number; // amount of x-range to reserve to separate bars
  yType?: any; // type of y-scale, e.g. d3.scaleLinear
  yDomain?: [number, number]; // [ymin, ymax]
  yRange?: [number, number]; // [bottom, top]
  zDomain?: any[]; // array of z-values
  offset: any; // stack offset method, e.g. d3.stackOffsetDiverging
  order?: any; // stack order method, e.g. d3.stackOrderNone
  yFormat?: any; // a format specifier string for the y-axis
  yLabel: string; // a label for the y-axis
  colors: any; // array of colors, e.g. d3.schemeTableau10
}

export default class StackedChart {
  protected width: number;
  protected height: number;
  protected marginTop = 30; // top margin, in pixels
  protected marginRight = 0; // right margin, in pixels
  protected marginBottom = 30; // bottom margin, in pixels
  protected marginLeft = 40; // left margin, in pixels
  protected xPadding = 0.1; // amount of x-range to reserve to separate bars

  protected X: any[];
  protected Y: any[];
  protected Z: any[];
  protected I: any[];

  protected xDomain: any;
  protected zDomain: any;

  protected xAxis: d3.Axis<d3.AxisDomain>;
  protected yAxis: d3.Axis<d3.AxisDomain>;
  protected yLabel: string;
  protected title: any;

  public xScale: any;
  public yScale: any;

  protected series: (d3.SeriesPoint<{
    [key: string]: number;
  }> & {
    i: any;
  })[][];
  protected color: any;

  // Best reference: https://observablehq.com/@d3/stacked-bar-chart
  constructor(data: any, opt: StackBarOptions) {
    // Compute values.
    const X = d3.map(data, opt.x);
    const Y = d3.map(data, opt.y);
    const Z = d3.map(data, opt.z);

    // Compute default x- and z-domains, and unique them.
    let xDomain: any, zDomain: any;
    xDomain = opt.xDomain;
    zDomain = opt.zDomain;
    if (opt.xDomain === undefined) xDomain = X;
    if (opt.zDomain === undefined) zDomain = Z;
    xDomain = new d3.InternSet(xDomain);
    zDomain = new d3.InternSet(zDomain);

    // Omit any data not present in the x- and z-domains.
    const I = d3
      .range(X.length)
      .filter((i) => xDomain.has(X[i]) && zDomain.has(Z[i]));

    // Compute a nested array of series where each series is [[y1, y2], [y1, y2],
    // [y1, y2], …] representing the y-extent of each stacked rect. In addition,
    // each tuple has an i (index) property so that we can refer back to the
    // original data point (data[i]). This code assumes that there is only one
    // data point for a given unique x- and z-value.
    const order = opt.order === undefined ? d3.stackOrderNone : opt.order;
    const reduced = d3.rollup(
      I,
      ([i]) => i,
      (i: number) => X[i],
      (i: number) => Z[i]
    );
    const series = d3
      .stack()
      .keys(zDomain)
      .value(([x, I]: any, z) => Y[I.get(z)])
      .order(order)
      .offset(opt.offset)(reduced as any)
      .map((s) =>
        s.map((d) => Object.assign(d, { i: (d.data[1] as any).get(s.key) }))
      );
    // console.log(series);

    // Compute the default y-domain. Note: diverging stacks can be negative.
    let yDomain: [number, number];
    if (opt.yDomain === undefined)
      yDomain = d3.extent(series.flat(2)) as [number, number];
    else yDomain = opt.yDomain;

    // Compute margin & paddings.

    if (opt.marginTop != undefined) this.marginTop = opt.marginTop;
    if (opt.marginRight != undefined) this.marginRight = opt.marginRight;
    if (opt.marginBottom != undefined) this.marginBottom = opt.marginBottom;
    if (opt.marginLeft != undefined) this.marginLeft = opt.marginLeft;
    if (opt.xPadding != undefined) this.xPadding = opt.xPadding;

    // Compute x-range & y-range.
    let xRange = [this.marginLeft, opt.width - this.marginRight];
    let yRange = [opt.height - this.marginBottom, this.marginTop];
    if (opt.xRange != undefined) xRange = opt.xRange;
    if (opt.yRange != undefined) yRange = opt.yRange;

    // Construct scales, axes, and formats.
    const yType = opt.yType === undefined ? d3.scaleLinear : opt.yType;
    const xScale = d3.scaleBand(xDomain, xRange).paddingInner(this.xPadding);
    const yScale = yType(yDomain, yRange);
    const color = d3.scaleOrdinal(zDomain, opt.colors);
    const xAxis = d3.axisBottom(xScale as any).tickSizeOuter(0);
    const yAxis = d3.axisLeft(yScale).ticks(opt.height / 60, opt.yFormat);

    // Compute titles.
    let title: any;
    if (opt.title === undefined) {
      const formatValue = yScale.tickFormat(100, opt.yFormat);
      title = (i: number) => `${X[i]}\n${Z[i]}\n${formatValue(Y[i])}`;
    } else {
      const O = d3.map(data, (d) => d);
      const T = title;
      title = (i: number) => T(O[i], i, data);
    }

    // Assign the variables to class members.
    this.X = X;
    this.Y = Y;
    this.Z = Z;
    this.I = I;
    this.width = opt.width;
    this.height = opt.height;
    this.xAxis = xAxis;
    this.yAxis = yAxis;
    this.xScale = xScale;
    this.yScale = yScale;
    this.yLabel = opt.yLabel;
    this.series = series;
    this.color = color;
    this.title = title;
  }

  axis(): SVGSelection {
    const svg = d3
      .create("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("viewBox", `0 0 ${this.width} ${this.height}`)
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

    svg
      .append("g")
      .attr("transform", `translate(${this.marginLeft},0)`)
      .call(this.yAxis)
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick line")
          .clone()
          .attr("x2", this.width - this.marginLeft - this.marginRight)
          .attr("stroke-opacity", 0.1)
      )
      .call((g) =>
        g
          .append("text")
          .attr("x", -this.marginLeft)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text(this.yLabel)
      );

    svg
      .append("g")
      .attr("transform", `translate(0,${this.yScale(0)})`)
      .call(this.xAxis);

    return svg;
  }

  bar(onAxis: SVGSelection, groupId?: string): SVGGroupSelection {
    const xScale = this.xScale;
    const yScale = this.yScale;
    const svg = onAxis;
    const bar = svg
      .append("g")
      .attr("id", groupId === undefined ? "bar" : groupId);
    const item = bar
      .selectAll("g")
      .data(this.series)
      .join("g")
      .attr("fill", ([{ i }]) => this.color(this.Z[i]) as string)
      .selectAll("rect")
      .data((d) => d)
      .join("rect")
      .attr("x", ({ i }) => xScale(this.X[i])!)
      .attr("y", ([y1, y2]) => Math.min(yScale(y1), yScale(y2)))
      .attr("height", ([y1, y2]) => Math.abs(yScale(y1) - yScale(y2)))
      .attr("width", xScale.bandwidth());

    if (this.title)
      item
        .append("title")
        .text(({ i }) => this.title(i))
        .attr("style");

    return bar;
  }

  area(onAxis: SVGSelection, groupId?: string): SVGGroupSelection {
    const xScale = this.xScale;
    const yScale = this.yScale;
    const svg = onAxis;
    const areaGenerator = d3
      .area()
      .x((d, i) => xScale(this.X[i])! + 0.5 * xScale.bandwidth())
      .y0(([y1, y2]) => Math.min(yScale(y1), yScale(y2)))
      .y1(([y1, y2]) => Math.max(yScale(y1), yScale(y2)));

    const area = svg
      .append("g")
      .attr("id", groupId === undefined ? "area" : groupId);
    area
      .selectAll("path")
      .data(this.series)
      .join("path")
      .style("fill", ([{ i }]) => this.color(this.Z[i]) as string)
      .attr("d", areaGenerator as any);

    return area;
  }

  brush(onAxis: SVGSelection, callback: (l: number, r: number) => void) {
    const xScale = this.xScale;
    const snappedSelection = ([min, max]: [number, number]) => [
      xScale(this.X[min]),
      xScale(this.X[max - 1]) + xScale.bandwidth(), // min & max won't be same
    ];
    const brush = d3
      .brushX()
      .extent([
        [this.marginLeft, this.marginTop],
        [this.width - this.marginRight, this.height - this.marginBottom],
      ])
      .on("start brush end", function (event) {
        // only transition after input
        if (!event.sourceEvent && !event.selection) return;

        const s0 = event.selection
          ? event.selection
          : [1, 2].fill(event.sourceEvent.offsetX);
        const d0 = invert(xScale, s0[0], s0[1]);

        if (event.sourceEvent && event.type === "end") {
          const snap = snappedSelection(d0);
          d3.select(this).transition().call(event.target.move, snap);
          d3.select(this).select("title").text(`TODO: [${d0[0]}, ${d0[1]})`);
          if (isNumeric(d0[0]) && isNumeric(d0[1])) {
            callback(d0[0], d0[1]);
          }
        }
      });
    onAxis
      .append("g")
      .attr("class", "brush")
      .call(brush as any)
      .append("title");
    return brush;
  }

  node(svg: SVGSelection) {
    const color = this.color;
    return Object.assign(svg.node(), { scales: { color } });
  }
}

function isNumeric(value: any) {
  return /^-?\d+$/.test(value);
}

function invert(scale: any, min: number, max: number): [number, number] {
  const step: number = scale.step();
  let dif: number = scale.range()[0] + scale.paddingOuter();
  let iMin: number, iMax: number;
  if (min == max) {
    // single click in band
    iMin = min - dif < 0 ? 0 : Math.ceil((min - dif) / step);
    iMax = Math.ceil((max - dif) / step);
  } else {
    // range brush
    iMin = min - dif < 0 ? 0 : Math.round((min - dif) / step);
    iMax = Math.round((max - dif) / step);
  }
  if (iMax == iMin) {
    // it happens with empty selections, not care the right boundary
    if (iMin == 0) ++iMax;
    else --iMin;
  }
  return [iMin, iMax];
}

function filterDomain(scale: any, min: number, max: number) {
  const [iMin, iMax] = invert(scale, min, max);
  return scale.domain().slice(iMin, iMax);
}

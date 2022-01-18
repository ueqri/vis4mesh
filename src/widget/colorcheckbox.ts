import { Widget } from "./widget";
import * as d3 from "d3";

export interface CheckBoxOptions {
  label: string;
  color?: string;
  boxWidth?: number; // px
  boxHeight?: number; // px
  labelAlign?: "middle" | "top" | "bottom";
}

export class ColoredCheckbox extends Widget {
  protected color!: string;

  constructor(id?: string) {
    super(id);
    this.div
      .style("margin", "0.25rem")
      .style("display", "inline-block")
      .style("font-size", "0.85em");
  }

  append(opt: CheckBoxOptions): this {
    this.color = opt.color === undefined ? "blue" : opt.color;
    const width = opt.boxWidth === undefined ? 21 : opt.boxWidth;
    const height = opt.boxHeight === undefined ? 21 : opt.boxHeight;
    const labelAlign = opt.labelAlign === undefined ? "middle" : opt.labelAlign;

    let svg = this.div
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("margin", "0.25em");

    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("stroke", "grey")
      .attr("stroke-width", 3)
      .attr("fill", "none")
      .attr("rx", 3)
      .attr("ry", 3)
      .property("checked", false);

    // svg
    //   .append("polyline")
    //   .attr("points", "4,14 12,23 28,5")
    //   .attr("stroke", "transparent")
    //   .attr("stroke-width", 4)
    //   .attr("fill", "none");

    const label = this.div
      .append("label")
      .text(opt.label)
      .style("margin", "0.25em")
      .style("position", "relative")
      .style("vertical-align", "initial");
    if (labelAlign === "middle") {
      // by default
    } else if (labelAlign === "bottom") {
      label.style("top", `${height / 2.0}px`);
    } else if (labelAlign === "top") {
      label.style("bottom", `${height / 2.0}px`);
    }

    return this;
  }

  event(handle: (status: boolean) => any): this {
    const color = this.color;
    this.div.select("svg").on("click", function () {
      let rect = d3.select(this).select("rect");
      // let marker = d3.select(this).select("polyline");
      if (rect.property("checked") === false) {
        rect.property("checked", true).transition().attr("fill", color);
        // marker.attr("stroke", "#fff");
        handle(true);
      } else {
        rect.property("checked", false).transition().attr("fill", "none");
        // marker.attr("stroke", "transparent");
        handle(false);
      }
    });
    return this;
  }

  static(checked: boolean): this {
    const rect = this.div.select("rect");
    if (checked) {
      rect.property("checked", true).transition().attr("fill", this.color);
    } else {
      rect.property("checked", false).transition().attr("fill", "none");
    }
    return this;
  }

  switch(checked: boolean): this {
    // change to last state, then click it to current state
    this.static(!checked);
    this.div.select("svg").dispatch("click");
    return this;
  }

  rename(label: string): this {
    this.div.select("label").text(label);
    return this;
  }
}

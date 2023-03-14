import { Widget } from "./widget";
import * as d3 from "d3";

// Template from Bootstrap:
// <div class="form-check form-check-inline">
//   <input class="form-check-input" type="checkbox" id="inlineCheckbox1" value="option1">
//   <label class="form-check-label" for="inlineCheckbox1">1</label>
// </div>

export interface CheckBoxOptions {
  label: string;
}

export class Checkbox extends Widget {
  protected color!: string;

  constructor(id?: string) {
    super(id);
    this.div
      .attr("class", "form-check form-check-inline filterbar-checkbox")
      .style("margin", "0.25rem")
      .style("display", "inline-block")
      .style("font-size", "0.85em");
    // .style("padding-left", "0.25rem");
  }

  append(opt: CheckBoxOptions): this {
    this.div
      .append("input")
      .attr("class", "form-check-input")
      .attr("type", "checkbox")
      .attr("id", this.id)
      .attr("value", `option${this.id}`)
      .style("scale", "1.5")
      .style("vertical-align", "initial");

    this.div
      .append("label")
      .text(opt.label)
      .attr("class", "form-check-label")
      .attr("for", this.id)
      .style("position", "relative")
      .style("vertical-align", "initial")
      .style("padding-left", "0.25rem");

    return this;
  }

  event(handle: (status: boolean) => any): this {
    this.div.select("input").on("click", function () {
      let box = d3.select(this);
      if (box.property("checked") === true) {
        handle(true);
      } else {
        handle(false);
      }
    });
    return this;
  }

  static(checked: boolean): this {
    const box = this.div.select("input");
    if (checked) {
      box.property("checked", true);
    } else {
      box.property("checked", false);
    }
    return this;
  }

  switch(checked: boolean): this {
    // change to last state, then click it to current state
    this.static(!checked);
    this.div.select("input").dispatch("click");
    return this;
  }

  rename(label: string): this {
    this.div.select("label").text(label);
    return this;
  }
}

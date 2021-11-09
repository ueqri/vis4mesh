import * as d3 from "d3";
import { StateController } from "../data";

// TODO: abstract checkbox list
export class MsgTypeFocus {
  labels!: string[];
  renderToDiv!: HTMLDivElement;

  constructor() {}

  useLabels(labels: string[]): this {
    this.labels = labels;
    return this;
  }

  remove(): this {
    d3.select(this.renderToDiv).remove();
    return this;
  }

  renderCheckboxTo(insertTo: HTMLElement, controller: StateController): this {
    let labels = this.labels;
    let focus = controller.focusOnMsgType;
    let hide = controller.hideMsgType;

    let div = d3.select(insertTo).append("div").attr("id", `div-focus`);
    this.renderToDiv = div.node()!;

    labels.forEach((v, idx) => {
      focus(v);

      let item = div.select("ul").append("li");
      //
      // Checkbox
      //
      item
        .append("input")
        .attr("class", "form-check-input")
        .style("margin-right", "0.5em")
        .attr("type", "checkbox")
        .attr("checked", true)
        .attr("id", `checkbox-focus-${idx}`)
        .on("change", function () {
          let str = this.id;
          let selected = labels[Number(str.split("-")[2])];
          // console.log(selected, this.checked);
          if (this.checked) {
            focus(selected);
          } else {
            hide(selected);
          }
        });
      //
      // Label for checkbox
      //
      item
        .append("label")
        .attr("class", "form-check-label")
        .style("padding-left", "0.5em")
        .attr("for", `checkbox-focus-${idx}`)
        .text(v);
    });

    //
    // Button for selection
    //
    div
      .append("button")
      .attr("type", "button")
      .attr("class", "btn btn-light")
      .attr("id", "focus-select-all")
      .on("click", function () {
        div
          .select("ul")
          .selectAll("input")
          .property("checked", true)
          .dispatch("change");
      })
      .text("Select All");

    div
      .append("button")
      .attr("type", "button")
      .style("margin-left", "0.5em")
      .attr("class", "btn btn-light")
      .attr("id", "focus-unselect-all")
      .on("click", function () {
        div
          .select("ul")
          .selectAll("input")
          .property("checked", false)
          .dispatch("change");
      })
      .text("Unselect All");

    return this;
  }
}

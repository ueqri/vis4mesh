import * as d3 from "d3";
import { Grid, LinkSelection } from "../layout/grid";
import { EdgeData } from "../data";

interface LegendLabel {
  name: string;
  avatar: string; // color of stroke
  selectValue: number;
}

export function GenerateColorByValue(val: number): string {
  return d3.interpolateRdYlBu((9 - val) / 9);
}

export class Legend {
  labels!: Array<LegendLabel>;
  checked!: Array<boolean>;
  graphDOM!: Document;
  renderedElement: any;

  constructor() {
    this.labels = new Array<LegendLabel>();
  }

  addLabel(label: LegendLabel): this {
    this.labels.push(label);
    return this;
  }

  renderCheckboxTo(insertTo: HTMLElement, bindInstance: Grid): this {
    let labels = this.labels;
    let maxSelectedValue = labels[0].selectValue;
    labels.forEach((v) => {
      if (maxSelectedValue < v.selectValue) maxSelectedValue = v.selectValue;
    });

    this.checked = new Array<boolean>(maxSelectedValue);
    let checkedMap = this.checked;

    this.renderedElement = d3.select(insertTo).append("ul");

    labels.forEach((v, idx) => {
      checkedMap[v.selectValue] = true;

      let item = d3.select(insertTo).select("ul").append("li");
      //
      // Checkbox
      //
      item
        .append("input")
        .style("margin-right", "0.5em")
        .attr("type", "checkbox")
        .attr("checked", true)
        .attr("id", `checkbox-legend-${idx}`)
        .on("change", function () {
          let str = this.id;
          let selected = labels[Number(str.split("-")[2])].selectValue;
          // console.log(selected, this.checked);
          if (this.checked) {
            checkedMap[selected] = true;
          } else {
            checkedMap[selected] = false;
          }
        });
      //
      // Color box
      //
      item
        .append("svg")
        .attr("width", "15")
        .attr("height", "15")
        .append("rect")
        .attr("width", "15")
        .attr("height", "15")
        .attr("stroke", "linen")
        .attr("stroke-width", "2")
        .attr("fill", GenerateColorByValue(v.selectValue));
      //
      // Label for checkbox
      //
      item
        .append("label")
        .style("padding-left", "0.5em")
        .attr("for", `checkbox-legend-${idx}`)
        .text(v.name);
    });

    //
    // Button for selection
    //
    d3.select(insertTo)
      .append("button")
      .attr("type", "button")
      .attr("class", "btn btn-light")
      .attr("id", "legend-select-all")
      .on("click", function () {
        d3.select(insertTo)
          .select("ul")
          .selectAll("input")
          .property("checked", true)
          .dispatch("change");
      })
      .text("Select All");

    d3.select(insertTo)
      .append("button")
      .attr("type", "button")
      .style("margin-left", "0.5em")
      .attr("class", "btn btn-light")
      .attr("id", "legend-unselect-all")
      .on("click", function () {
        d3.select(insertTo)
          .select("ul")
          .selectAll("input")
          .property("checked", false)
          .dispatch("change");
      })
      .text("Unselect All");

    // Bind callbacks to refresh function of Grid instance
    bindInstance.addRefreshCallback((g: LinkSelection) => {
      g.attr("opacity", function (d) {
        const edge = d as EdgeData;
        if (checkedMap[edge.value] == true) {
          return 1;
        } else {
          return 0.02;
        }
      });
    });

    return this;
  }
}

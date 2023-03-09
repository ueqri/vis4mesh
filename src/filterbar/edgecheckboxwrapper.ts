import * as d3 from "d3";
import Event from "event";
import EdgeTrafficCheckboxes from "./edgecheckbox";

const div = {
  Checkboxes: d3
    .select("#filterbar-edge")
    .append("div")
    .attr("id", "filter-edge-checkbox")
    .style("display", "none"),
  Slider: d3
    .select("#filterbar-edge")
    .append("div")
    .attr("id", "filter-edge-slider")
    .style("display", "none"),
};

const ev = {
  EdgeTrafficCheckbox: "FilterETCheckbox",
};

class EdgeTrafficByLegendCheckboxFilterBar {
  constructor() {}

  handleSignal(filterMode: /*checkbox or slider*/ string) {
    if (filterMode === "checkbox") {
      div.Slider.style("display", "none");
      div.Checkboxes.style("display", "inline-block");
      const now = EdgeTrafficCheckboxes.selected();
      Event.FireEvent(ev.EdgeTrafficCheckbox, now);
    } else if (filterMode === "slider") {
      div.Slider.style("display", "inline-block");
      div.Checkboxes.style("display", "none");
      // TODO: slider
    }
  }

  render() {
    div.Checkboxes.append(() => EdgeTrafficCheckboxes.node());
  }
}

export default new EdgeTrafficByLegendCheckboxFilterBar();

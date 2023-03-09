import * as d3 from "d3";
import Event from "event";
import { ColoredCheckbox } from "widget/colorcheckbox";

const outerDiv = d3.select("#filterbar-noc-num-hops");

const title = outerDiv
  .append("p")
  .text("Filter by NoC # Hops")
  .style("display", "none");

const div = outerDiv.append("div").attr("id", "filter-noc-num-hops-group");

const NumHopsDomain = [...Array(4).keys()].map((i) => `${i}`);

let SelectedMsgType = NumHopsDomain.reduce(
  (a, group) => ({ ...a, [group]: true }),
  {}
);

const ev = {
  NoCNumHopsFilter: "FilterNoCNumHops",
};

class NoCNumHopsFilterBar {
  constructor() {}

  handleSignal() {}

  render() {
    title.style("display", "block");

    NumHopsDomain.forEach((group, i) => {
      let box = new ColoredCheckbox()
        .append({
          label: NumHopsDomain[group],
          color: "dodgerblue",
        })
        .event((val) => this.updateMsgGroup(group, val))
        .static(true);
      div.append(() => box.node());
    });
  }

  protected updateMsgGroup(group: string, checked: boolean) {
    SelectedMsgType[group] = checked;
    let groups = NumHopsDomain.filter((g) => SelectedMsgType[g]);
    Event.FireEvent(ev.NoCNumHopsFilter, groups);
  }
}

export default new NoCNumHopsFilterBar();

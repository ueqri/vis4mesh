import * as d3 from "d3";
import Event from "event";
import { Checkbox } from "widget/checkbox";

const outerDiv = d3.select("#filterbar-noc-num-hops");

const title = outerDiv
  .append("p")
  .text("Filter by NoC # Hops")
  .style("display", "none");

const div = outerDiv
  .append("div")
  .attr("id", "filterbar-noc-num-hops-group")
  .style("padding-top", "4px");

const NumHopsDomain = [...Array(4).keys()].map((i) => `${i}`);

let SelectedMsgType = NumHopsDomain.reduce(
  (a, group) => ({ ...a, [group]: true }),
  {}
);

const ev = {
  NoCNumHopsFilter: "FilterNoCNumHops",
};

class NoCNumHopsFilterBar {
  checkboxes: Array<Checkbox>;
  constructor() {
    this.checkboxes = new Array<Checkbox>();
  }

  handleSignal(num_hops_per_unit: number) {
    this.checkboxes.forEach((box, i) => {
      box.rename(`${i * num_hops_per_unit}-${(i + 1) * num_hops_per_unit}`);
    });
  }

  render() {
    title.style("display", "block");

    NumHopsDomain.forEach((group) => {
      let box = new Checkbox()
        .append({
          label: NumHopsDomain[group],
        })
        .event((val) => this.updateMsgGroup(group, val))
        .static(true);
      div.append(() => box.node());
      this.checkboxes.push(box);
    });
  }

  protected updateMsgGroup(group: string, checked: boolean) {
    SelectedMsgType[group] = checked;
    let groups = NumHopsDomain.filter((g) => SelectedMsgType[g]);
    Event.FireEvent(ev.NoCNumHopsFilter, groups);
  }
}

export default new NoCNumHopsFilterBar();

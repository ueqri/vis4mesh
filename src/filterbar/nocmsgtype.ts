import * as d3 from "d3";
import Event from "event";
import { Checkbox } from "widget/checkbox";
import {
  TransferTypesInOrder,
  TransferTypesInOrderExtendNames,
} from "data/classification";

const outerDiv = d3.select("#filterbar-noc-msg-type");

const title = outerDiv
  .append("p")
  .text("Filter by NoC Transferred Msg Type")
  .style("display", "none");

const div = outerDiv
  .append("div")
  .attr("id", "filter-noc-msg-type-group")
  .style("padding-top", "4px");

let SelectedMsgType = TransferTypesInOrder.reduce(
  (a, group) => ({ ...a, [group]: true }),
  {}
);

const ev = {
  NoCMsgTypeFilter: "FilterNoCMsgType",
};

class NoCMsgTypeFilterBar {
  constructor() {}

  handleSignal() {}

  render() {
    title.style("display", "block");

    TransferTypesInOrder.forEach((group, i) => {
      let box = new Checkbox()
        .append({
          label: TransferTypesInOrderExtendNames[group],
        })
        .event((val) => this.updateMsgGroup(group, val))
        .static(true);
      div.append(() => box.node());
    });
  }

  protected updateMsgGroup(group: string, checked: boolean) {
    SelectedMsgType[group] = checked;
    let groups = TransferTypesInOrder.filter((g) => SelectedMsgType[g]);
    Event.FireEvent(ev.NoCMsgTypeFilter, groups);
  }
}

export default new NoCMsgTypeFilterBar();

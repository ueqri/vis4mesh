import * as d3 from "d3";
import Event from "event";
import { ColoredCheckbox } from "widget/colorcheckbox";
import {
  DataOrCommandDomain,
  MsgGroupsDomain,
  NumMsgGroups,
  DataOrCommandDomainNameExtend,
} from "data/classification";

const outerDiv = d3.select("#filterbar-inst-type");

const title = outerDiv
  .append("p")
  .text("Filter by Instruction Types")
  .style("display", "none");

const div = {
  MsgGroup: outerDiv
    .append("div")
    .attr("id", "filter-msg-group")
    .style("display", "none"),
  DataOrCommand: outerDiv
    .append("div")
    .attr("id", "filter-data-or-command")
    .style("display", "none"),
};

let SelectedMsgGroup = MsgGroupsDomain.reduce(
  (a, group) => ({ ...a, [group]: true }),
  {}
);

let SelectedDataOrCommand = DataOrCommandDomain.reduce(
  (a, group) => ({ ...a, [group]: true }),
  {}
);

const ev = {
  MsgGroup: "FilterMsgGroup",
  DataOrCommand: "FilterDoC",
};

class InstructionTypeFilterBar {
  constructor() {}

  handleSignal(filterMode: /* group or doc*/ string) {
    title.style("display", "block");
    if (filterMode === "group") {
      div.DataOrCommand.style("display", "none");
      div.MsgGroup.style("display", "inline-block");
      const now = MsgGroupsDomain.filter((g) => SelectedMsgGroup[g]);
      Event.FireEvent(ev.MsgGroup, now);
    } else if (filterMode === "doc") {
      div.DataOrCommand.style("display", "inline-block");
      div.MsgGroup.style("display", "none");
      const now = DataOrCommandDomain.filter((g) => SelectedDataOrCommand[g]);
      Event.FireEvent(ev.DataOrCommand, now);
    }
  }

  render() {
    this.renderFilterMsgGroup();
    this.renderFilterDataOrCommand();
  }

  // Msg group filter
  protected renderFilterMsgGroup() {
    MsgGroupsDomain.forEach((group, i) => {
      let box = new ColoredCheckbox()
        .append({
          label: group,
          color: d3.schemeSpectral[NumMsgGroups][i],
        })
        .event((val) => this.updateMsgGroup(group, val))
        .static(true);
      div.MsgGroup.append(() => box.node());
    });
  }

  protected updateMsgGroup(group: string, checked: boolean) {
    SelectedMsgGroup[group] = checked;
    let groups = MsgGroupsDomain.filter((g) => SelectedMsgGroup[g]);
    Event.FireEvent(ev.MsgGroup, groups);
  }

  // Data/Command filter
  protected renderFilterDataOrCommand() {
    DataOrCommandDomain.forEach((group, i) => {
      let box = new ColoredCheckbox()
        .append({
          label: DataOrCommandDomainNameExtend(group),
          color: ["#d7191c", "#2b83ba"][i],
        })
        .event((val) => this.updateDataOrCommand(group, val))
        .static(true);
      div.DataOrCommand.append(() => box.node());
    });
  }

  protected updateDataOrCommand(group: string, checked: boolean) {
    SelectedDataOrCommand[group] = checked;
    let groups = DataOrCommandDomain.filter((g) => SelectedDataOrCommand[g]);
    Event.FireEvent(ev.DataOrCommand, groups);
  }
}

export default new InstructionTypeFilterBar();

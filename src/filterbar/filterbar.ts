import * as d3 from "d3";
import Event from "event";
import { Component, Element } from "global";
import { ColoredCheckbox } from "widget/colorcheckbox";
import {
  DataOrCommandDomain,
  MsgGroupsDomain,
  NumMsgGroups,
  DataOrCommandDomainNameExtend,
} from "data/classification";
import EdgeTrafficCheckboxes from "./edgecheckbox";

type SignalMap = { [type: string]: (v: any) => any };

const divE = d3.select("#filterbar-edge");
const divG = d3.select("#filterbar-group");
const msgDiv = {
  MsgGroup: divG
    .append("div")
    .attr("id", "filter-msg-group")
    .style("display", "none"),
  DataOrCommand: divG
    .append("div")
    .attr("id", "filter-data-or-command")
    .style("display", "none"),
};
const edgeDiv = {
  Checkboxes: divE
    .append("div")
    .attr("id", "filter-edge-checkbox")
    .style("display", "none"),
  Slider: divE
    .append("div")
    .attr("id", "filter-edge-slider")
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
  EdgeTrafficCheckbox: "FilterETCheckbox",
};

function InitFilterEvent() {
  const t = Component.ticker;
  for (const key in ev) {
    Event.AddStartListener(ev[key], () => t.signal["state"]("pause"));
    Event.AddEndListener(ev[key], () => t.signal["state"]("still"));
  }
}

export function RenderFilterbar() {
  InitFilterEvent();
  const f = Element.filterbar;
  f.renderFilterMsgGroup();
  f.renderFilterDataOrCommand();
  f.renderFilterTrafficByCheckbox();
}

export default class Filterbar {
  public signal: SignalMap;

  constructor() {
    this.signal = {};
    this.initSignalCallbacks();
  }

  protected initSignalCallbacks() {
    // Signal to show certain type of filter bar, e.g. msg group, data/command
    this.signal["msg"] = (v) => {
      if (v === "group") {
        msgDiv.DataOrCommand.style("display", "none");
        msgDiv.MsgGroup.style("display", "inline-block");
        const now = MsgGroupsDomain.filter((g) => SelectedMsgGroup[g]);
        Event.FireEvent(ev.MsgGroup, now);
      } else if (v === "doc") {
        msgDiv.DataOrCommand.style("display", "inline-block");
        msgDiv.MsgGroup.style("display", "none");
        const now = DataOrCommandDomain.filter((g) => SelectedDataOrCommand[g]);
        Event.FireEvent(ev.DataOrCommand, now);
      }
    };
    this.signal["edge"] = (v) => {
      if (v === "checkbox") {
        edgeDiv.Slider.style("display", "none");
        edgeDiv.Checkboxes.style("display", "inline-block");
        const now = EdgeTrafficCheckboxes.selected();
        Event.FireEvent(ev.EdgeTrafficCheckbox, now);
      } else if (v === "slider") {
        edgeDiv.Slider.style("display", "inline-block");
        edgeDiv.Checkboxes.style("display", "none");
        // TODO: slider
      }
    };
  }

  // Msg group filter
  renderFilterMsgGroup() {
    MsgGroupsDomain.forEach((group, i) => {
      let box = new ColoredCheckbox()
        .append({
          label: group,
          color: d3.schemeSpectral[NumMsgGroups][i],
        })
        .event((val) => this.updateMsgGroup(group, val))
        .static(true);
      msgDiv.MsgGroup.append(() => box.node());
    });
  }

  protected updateMsgGroup(group: string, checked: boolean) {
    SelectedMsgGroup[group] = checked;
    let groups = MsgGroupsDomain.filter((g) => SelectedMsgGroup[g]);
    Event.FireEvent(ev.MsgGroup, groups);
  }

  // Data/Command filter
  renderFilterDataOrCommand() {
    DataOrCommandDomain.forEach((group, i) => {
      let box = new ColoredCheckbox()
        .append({
          label: DataOrCommandDomainNameExtend(group),
          color: ["#d7191c", "#2b83ba"][i],
        })
        .event((val) => this.updateDataOrCommand(group, val))
        .static(true);
      msgDiv.DataOrCommand.append(() => box.node());
    });
  }

  protected updateDataOrCommand(group: string, checked: boolean) {
    SelectedDataOrCommand[group] = checked;
    let groups = DataOrCommandDomain.filter((g) => SelectedDataOrCommand[g]);
    Event.FireEvent(ev.DataOrCommand, groups);
  }

  // Traffic congestion filter
  renderFilterTrafficByCheckbox() {
    edgeDiv.Checkboxes.append(() => EdgeTrafficCheckboxes.node());
  }
}

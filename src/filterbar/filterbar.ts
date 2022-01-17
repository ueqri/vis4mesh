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

type SignalMap = { [type: string]: (v: any) => any };

interface TrafficInterval {
  lower: number;
  upper: number;
}

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

const NumLevels = 10;
const TrafficLevelDomain = Array.from(Array(NumLevels).keys());

let SelectedMsgGroup = MsgGroupsDomain.reduce(
  (a, group) => ({ ...a, [group]: true }),
  {}
);

let SelectedDataOrCommand = DataOrCommandDomain.reduce(
  (a, group) => ({ ...a, [group]: true }),
  {}
);

let SelectedTrafficCheckbox: boolean[] = Array<boolean>(NumLevels).fill(true);

let trafficCheckboxes: Array<ColoredCheckbox> = new Array<ColoredCheckbox>();

const ev = {
  MsgGroup: "FilterMsgGroup",
  DataOrCommand: "FilterDoC",
  EdgeTraffic: "FilterEdgeTraffic",
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
        const now = TrafficLevelDomain.filter(
          (lv) => SelectedTrafficCheckbox[lv]
        );
        Event.FireEvent(ev.EdgeTraffic, now);
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
    TrafficLevelDomain.forEach((lv) => {
      let box = new ColoredCheckbox()
        .append({
          label: `undefined`,
          color: d3.interpolateRdYlBu((9 - lv) / 9),
        })
        .event((val) => this.updateTrafficCheckbox(lv, val))
        .static(true);
      edgeDiv.Checkboxes.append(() => box.node());
      trafficCheckboxes.push(box);
    });
  }

  protected updateTrafficCheckbox(lv: number, checked: boolean) {
    SelectedTrafficCheckbox[lv] = checked;
    let lvs = TrafficLevelDomain.filter((lv) => SelectedTrafficCheckbox[lv]);
    Event.FireEvent(ev.EdgeTraffic, lvs);
  }
}

export function RenameTrafficFilterCheckboxes(traffic: Array<TrafficInterval>) {
  traffic.forEach((t, i) => {
    trafficCheckboxes[i].rename(`${t.lower}-${t.upper}`);
  });
}

export function SwitchTrafficFilterCheckboxes(checkedMap: boolean[]) {
  SelectedTrafficCheckbox = checkedMap;
  checkedMap.forEach((checked, i) => {
    // `switch` would trigger the update of SelectedTrafficCheckbox too many
    // times, so use `static` here.
    trafficCheckboxes[i].static(checked);
  });
  trafficCheckboxes[0].switch(checkedMap[0]); // fire events indirectly
}

export function FlipTrafficFilterCheckboxes() {
  SelectedTrafficCheckbox.forEach((checked, i) => {
    SelectedTrafficCheckbox[i] = !checked; // change origin **array** element
    trafficCheckboxes[i].static(!checked);
  });
  trafficCheckboxes[0].switch(SelectedTrafficCheckbox[0]);
}

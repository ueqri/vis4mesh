import * as d3 from "d3";
import { ColoredCheckbox } from "../widget/colorcheckbox";
import Ticker from "../timebar/ticker";
import {
  DataOrCommandDomain,
  MsgGroupsDomain,
  NumMsgGroups,
  DataOrCommandDomainNameExtend,
} from "../data/classification";
import Config from "../global";

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

const NumLevels = Config.EdgeTrafficLegendLevel;
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

export class FilterEventListener {
  protected updaterMsgGroup: Array<(g: string[]) => any>;
  protected updaterDataOrCommand: Array<(g: string[]) => any>;
  protected updaterEdgeTrafficCheckbox: Array<(lv: number[]) => any>;
  protected ticker: Ticker;

  constructor(ticker: Ticker) {
    this.updaterMsgGroup = new Array<(g: string[]) => any>();
    this.updaterDataOrCommand = new Array<(g: string[]) => any>();
    this.updaterEdgeTrafficCheckbox = new Array<(lv: number[]) => any>();
    this.ticker = ticker; // use signal `pause` and `still` of ticker
  }

  AppendForMsgGroup(updater: (g: string[]) => any) {
    this.updaterMsgGroup.push(updater);
  }

  FireEventForMsgGroup(g: string[]) {
    this.ticker.signal["state"]("pause");
    this.updaterMsgGroup.forEach((updater) => {
      updater(g);
    });
    this.ticker.signal["state"]("still");
  }

  AppendForDataOrCommand(updater: (g: string[]) => any) {
    this.updaterDataOrCommand.push(updater);
  }

  FireEventForDataOrCommand(g: string[]) {
    this.ticker.signal["state"]("pause");
    this.updaterDataOrCommand.forEach((updater) => {
      updater(g);
    });
    this.ticker.signal["state"]("still");
  }

  AppendForEdgeTrafficCheckbox(updater: (lv: number[]) => any) {
    this.updaterEdgeTrafficCheckbox.push(updater);
  }

  FireEventForEdgeTrafficCheckbox(lv: number[]) {
    this.ticker.signal["state"]("pause");
    this.updaterEdgeTrafficCheckbox.forEach((updater) => {
      updater(lv);
    });
    this.ticker.signal["state"]("still");
  }
}

export default function RenderFilterBar(ev: FilterEventListener): FilterBar {
  let f = new FilterBar(ev);

  f.renderFilterMsgGroup();
  f.renderFilterDataOrCommand();

  f.renderFilterTrafficByCheckbox();

  return f;
}

export class FilterBar {
  public signal: SignalMap;
  protected ev: FilterEventListener;

  constructor(ev: FilterEventListener) {
    this.signal = {};
    this.ev = ev;
    this.initSignalCallbacks();
  }

  protected initSignalCallbacks() {
    // Signal to show certain type of filter bar, e.g. msg group, data/command
    this.signal["msg"] = (v) => {
      if (v === "group") {
        msgDiv.DataOrCommand.style("display", "none");
        msgDiv.MsgGroup.style("display", "inline-block");
        const now = MsgGroupsDomain.filter((g) => SelectedMsgGroup[g]);
        this.ev.FireEventForMsgGroup(now);
      } else if (v === "doc") {
        msgDiv.DataOrCommand.style("display", "inline-block");
        msgDiv.MsgGroup.style("display", "none");
        const now = DataOrCommandDomain.filter((g) => SelectedDataOrCommand[g]);
        this.ev.FireEventForDataOrCommand(now);
      }
    };
    this.signal["edge"] = (v) => {
      if (v === "checkbox") {
        edgeDiv.Slider.style("display", "none");
        edgeDiv.Checkboxes.style("display", "inline-block");
        const now = TrafficLevelDomain.filter(
          (lv) => SelectedTrafficCheckbox[lv]
        );
        this.ev.FireEventForEdgeTrafficCheckbox(now);
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
    console.log(groups);
    this.ev.FireEventForMsgGroup(groups);
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
    console.log(groups);
    this.ev.FireEventForDataOrCommand(groups);
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
    this.ev.FireEventForEdgeTrafficCheckbox(lvs);
  }
}

export function RenameTrafficFilterCheckboxes(traffic: Array<TrafficInterval>) {
  traffic.forEach((t, i) => {
    trafficCheckboxes[i].rename(`${t.lower}-${t.upper}`);
  });
}

export function SwitchTrafficFilterCheckboxes(checkedMap: boolean[]) {
  checkedMap.forEach((checked, i) => {
    trafficCheckboxes[i].switch(checked);
  });
}

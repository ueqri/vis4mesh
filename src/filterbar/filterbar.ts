import * as d3 from "d3";
import { ColoredCheckbox } from "../widget/colorcheckbox";
import Ticker from "../timebar/ticker";
import {
  DataOrCommandDomain,
  MsgGroupsDomain,
  NumMsgGroups,
  DataOrCommandDomainNameExtend,
} from "../data/classification";

type SignalMap = { [type: string]: (v: any) => any };

const div = d3.select("#filterbar");
const msgDiv = {
  MsgGroup: div
    .append("div")
    .attr("id", "filter-msg-group")
    .style("display", "none"),
  DataOrCommand: div
    .append("div")
    .attr("id", "filter-data-or-command")
    .style("display", "none"),
};
const edgeDiv = {
  LessOptions: div
    .append("div")
    .attr("id", "filter-edge-less")
    .style("display", "none"),
  MoreOptions: div
    .append("div")
    .attr("id", "filter-edge-more")
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

export class FilterEventListener {
  protected updaterMsgGroup: Array<(g: string[]) => any>;
  protected updaterDataOrCommand: Array<(g: string[]) => any>;
  protected ticker: Ticker;

  constructor(ticker: Ticker) {
    this.updaterMsgGroup = new Array<(g: string[]) => any>();
    this.updaterDataOrCommand = new Array<(g: string[]) => any>();
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
}

export default function RenderFilterBar(ev: FilterEventListener): FilterBar {
  let f = new FilterBar(ev);
  f.renderFilterMsgGroup();
  f.signal["msg"]("group");
  f.renderFilterDataOrCommand();
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
      if (v === "less") {
      } else if (v === "more") {
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

  updateMsgGroup(group: string, checked: boolean) {
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

  updateDataOrCommand(group: string, checked: boolean) {
    SelectedDataOrCommand[group] = checked;
    let groups = DataOrCommandDomain.filter((g) => SelectedDataOrCommand[g]);
    console.log(groups);
    this.ev.FireEventForDataOrCommand(groups);
  }
}

// Traffic congestion filter

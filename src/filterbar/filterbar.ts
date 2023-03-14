import Event from "event";
import { Component, Element } from "global";
import EdgeTrafficByLegendCheckboxFilterBar from "./edgecheckboxwrapper";
import InstructionTypeFilterBar from "./insttype";
import NoCMsgTypeFilterBar from "./nocmsgtype";
import NoCNumHopsFilterBar from "./numhops";

type SignalMap = { [type: string]: (v: any) => any };

const ev = {
  MsgGroup: "FilterMsgGroup",
  DataOrCommand: "FilterDoC",
  EdgeTrafficCheckbox: "FilterETCheckbox",
  NoCMsgTypeFilter: "FilterNoCMsgType",
  NoCNumHopsFilter: "FilterNoCNumHops",
};

function InitFilterEvent() {
  const t = Component.ticker;
  for (const key in ev) {
    Event.AddStartListener(ev[key], () => t.signal["state"]("pause"));
    if (key !== "EdgeTrafficCheckbox") {
      Event.AddEndListener(ev[key], () => t.signal["state"]("still"));
    }
  }
}

export function RenderFilterbar() {
  InitFilterEvent();
  const f = Element.filterbar;
  f.renderFilterEdgeTrafficByLegendCheckbox();
  f.renderFilterInstructionType();
  f.renderFilterNoCMsgType();
  f.renderFilterNoCNumHopsType();
}

export default class Filterbar {
  public signal: SignalMap;

  constructor() {
    this.signal = {};
    this.initSignalCallbacks();
  }

  protected initSignalCallbacks() {
    // Signal to show certain type of filter bar, e.g. msg group, data/command
    this.signal["msg"] = (v) => InstructionTypeFilterBar.handleSignal(v);
    this.signal["edge"] = (v) =>
      EdgeTrafficByLegendCheckboxFilterBar.handleSignal(v);

    this.signal["num_hops_per_unit"] = (v) =>
      NoCNumHopsFilterBar.handleSignal(v);
  }

  renderFilterEdgeTrafficByLegendCheckbox() {
    EdgeTrafficByLegendCheckboxFilterBar.render();
  }

  renderFilterInstructionType() {
    InstructionTypeFilterBar.render();
  }

  renderFilterNoCMsgType() {
    NoCMsgTypeFilterBar.render();
  }

  renderFilterNoCNumHopsType() {
    NoCNumHopsFilterBar.render();
  }
}

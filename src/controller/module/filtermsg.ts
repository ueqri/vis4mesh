import { SignalMap, ControllerModule } from "../controller";
import { DataToDisplay } from "display/data";
import { DataPortRangeResponse } from "data/data";
import {
  DataOrCommandDomain,
  DataOrCommandReverseMap,
  MsgGroupsDomain,
  MsgGroupsReverseMap,
  MsgTypesInOrderIndexMap,
} from "data/classification";
import * as d3 from "d3";
import Event from "event";

const ev = {
  MsgGroup: "FilterMsgGroup",
  DataOrCommand: "FilterDoC",
};

enum FilterMsgMode {
  ByMsgGroup,
  ByDataOrCommand,
}

const MapMsgTypeToIdx = MsgTypesInOrderIndexMap;

export default class FilterMsg implements ControllerModule {
  public signal: SignalMap;
  protected groupDomain: string[];
  protected docDomain: string[];
  protected mode: FilterMsgMode;

  constructor() {
    this.signal = {};
    this.groupDomain = MsgGroupsDomain;
    this.docDomain = DataOrCommandDomain;
    this.mode = FilterMsgMode.ByMsgGroup; // filter msg group by default

    Event.AddStepListener(ev.MsgGroup, (g: string[]) =>
      this.updateMsgGroupDomain(g)
    );
    Event.AddStepListener(ev.DataOrCommand, (doc: string[]) =>
      this.updateDataOrCommandDomain(doc)
    );

    this.initSignalCallbacks();
  }

  protected initSignalCallbacks() {
    this.signal["msg"] = (v) => {
      if (v === "group") {
        this.mode = FilterMsgMode.ByMsgGroup;
      } else if (v === "doc") {
        this.mode = FilterMsgMode.ByDataOrCommand;
      } else {
        console.error("Invalid message signal for module filter");
      }
    };
  }

  decorateData(ref: DataPortRangeResponse, d: DataToDisplay) {
    d.edges!.forEach((e, idx) => {
      e.source = ref.edges[idx].source;
      e.target = ref.edges[idx].target;
      e.detail = ref.edges[idx].detail;

      // weight
      e.weight = 0;
      if (this.mode == FilterMsgMode.ByMsgGroup) {
        this.groupDomain.forEach((g) => {
          (MsgGroupsReverseMap[g] as string[]).forEach((key) => {
            const typeIdx: number = MapMsgTypeToIdx[key];
            const val: number | undefined = ref.edges[idx].value[typeIdx];
            if (val !== undefined && val > 0) {
              e.detail += `<br>${key}: ${val}`;
              e.weight! += ref.edges[idx].value[typeIdx];
            }
          });
        });
      } else if (this.mode == FilterMsgMode.ByDataOrCommand) {
        this.docDomain.forEach((doc) => {
          (DataOrCommandReverseMap[doc] as string[]).forEach((key) => {
            const typeIdx: number = MapMsgTypeToIdx[key];
            const val: number | undefined = ref.edges[idx].value[typeIdx];
            if (val !== undefined && val > 0) {
              e.detail += `<br>${key}: ${val}`;
              e.weight! += ref.edges[idx].value[typeIdx];
            }
          });
        });
      }
      // label
      e.label = e.weight === 0 ? "" : CompressBigNumber(e.weight);
    });
  }

  invokeController() {} // Nothing to do

  updateMsgGroupDomain(domain: string[]) {
    this.groupDomain = domain;
  }

  updateDataOrCommandDomain(domain: string[]) {
    this.docDomain = domain;
  }
}

function CompressBigNumber(number: string | number): string {
  if (typeof number === "string") {
    number = Number(number);
  }
  const format = d3.format(".3s")(number);
  const len = format.length;
  const trans = Number(format);
  if (Number.isNaN(trans) === true) {
    const prefix = format.substring(0, len - 1);
    return `${Number(prefix)}${format.charAt(len - 1)}`;
  } else {
    return `${trans}`;
  }
}

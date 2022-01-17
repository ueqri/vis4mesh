import { SignalMap, ControllerModule } from "../controller";
import { DataToDisplay } from "display/data";
import { DataPortRangeResponse } from "data/data";
import {
  DataOrCommandDomain,
  DataOrCommandReverseMap,
  MsgGroupsDomain,
  MsgGroupsReverseMap,
} from "data/classification";
import Event from "event";

const ev = {
  MsgGroup: "FilterMsgGroup",
  DataOrCommand: "FilterDoC",
};

enum FilterMsgMode {
  ByMsgGroup,
  ByDataOrCommand,
}

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
    Event.AddStepListener(ev.MsgGroup, (doc: string[]) =>
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
            const val: number = ref.edges[idx].value[key];
            // console.log(g, key, val);
            if (val > 0) {
              e.detail += `<br>${key}: ${val}`;
              e.weight += ref.edges[idx].value[key];
            }
          });
        });
      } else if (this.mode == FilterMsgMode.ByDataOrCommand) {
        this.docDomain.forEach((doc) => {
          (DataOrCommandReverseMap[doc] as string[]).forEach((key) => {
            const val: number = ref.edges[idx].value[key];
            if (val > 0) {
              e.detail += `<br>${key}: ${val}`;
              e.weight += ref.edges[idx].value[key];
            }
          });
        });
      }
      // label
      e.label = e.weight === 0 ? "" : `${e.weight}`;
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

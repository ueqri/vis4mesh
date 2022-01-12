import { SignalMap, ControllerModule } from "../controller";
import { DataToDisplay } from "../../display/data";
import { DataPortRangeResponse } from "../../data/data";
import { FilterEventListener } from "../../filterbar/filterbar";
import {
  DataOrCommandDomain,
  DataOrCommandReverseMap,
  MsgGroupsDomain,
  MsgGroupsReverseMap,
} from "../../data/classification";

enum FilterMsg {
  ByMsgGroup,
  ByDataOrCommand,
}

export default class Filter implements ControllerModule {
  public signal: SignalMap;
  protected groupDomain: string[];
  protected docDomain: string[];
  protected filterType: FilterMsg;

  constructor(f: FilterEventListener) {
    this.signal = {};
    this.groupDomain = MsgGroupsDomain;
    this.docDomain = DataOrCommandDomain;
    this.filterType = FilterMsg.ByMsgGroup; // filter msg group by default

    f.AppendForMsgGroup((g) => this.updateMsgGroupDomain(g));
    f.AppendForDataOrCommand((doc) => this.updateDataOrCommandDomain(doc));

    this.initSignalCallbacks();
  }

  protected initSignalCallbacks() {
    this.signal["msg"] = (v) => {
      if (v === "group") {
        this.filterType = FilterMsg.ByMsgGroup;
      } else if (v === "doc") {
        this.filterType = FilterMsg.ByDataOrCommand;
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
      if (this.filterType == FilterMsg.ByMsgGroup) {
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
      } else if (this.filterType == FilterMsg.ByDataOrCommand) {
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

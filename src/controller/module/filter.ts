import { SignalMap, ControllerModule } from "../controller";
import { DataToDisplay } from "../../display/data";
import { DataPortRangeResponse } from "../../data/data";
import { FilterEventListener } from "../../filterbar/filterbar";
import {
  MsgGroupsDomain,
  MsgGroupsReverseMap,
} from "../../data/classification";

export default class Filter implements ControllerModule {
  public signal: SignalMap; // no used
  protected domain: string[];

  constructor(f: FilterEventListener) {
    this.signal = {};
    this.domain = MsgGroupsDomain;
    f.AppendForMsgGroup((g) => this.updateMsgGroupDomain(g));
  }

  decorateData(ref: DataPortRangeResponse, d: DataToDisplay) {
    d.edges!.forEach((e, idx) => {
      e.source = ref.edges[idx].source;
      e.target = ref.edges[idx].target;
      e.detail = ref.edges[idx].detail;

      // weight
      e.weight = 0;
      this.domain.forEach((g) => {
        (MsgGroupsReverseMap[g] as string[]).forEach((key) => {
          const val: number = ref.edges[idx].value[key];
          // console.log(g, key, val);
          if (val > 0) {
            e.detail += `<br>${key}: ${val}`;
            e.weight += ref.edges[idx].value[key];
          }
        });
      });
      // label
      e.label = e.weight === 0 ? "" : `${e.weight}`;
      // TODO: style
    });
  }

  invokeController() {} // Nothing to do

  updateMsgGroupDomain(domain: string[]) {
    this.domain = domain;
  }
}

import { SignalMap, ControllerModule } from "../controller";
import { DataToDisplay, EdgeDisplay } from "display/data";
import { DataPortRangeResponse, EdgeData } from "data/data";
import {
  DataOrCommandDomain,
  DataOrCommandReverseMap,
  MsgGroupsDomain,
  MsgGroupsReverseMap,
  MsgTypesInOrderIndexMap,
  MsgTypesInOrder,
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
    let start = performance.now();

    if (this.mode == FilterMsgMode.ByMsgGroup) {
      this.aggregate_data(
        ref,
        d,
        (x) => true,
        (x) => true,
        (x) => true
      );
    } else {
      alert("! NOT IMPLEMENTED YET");
      // for (let edge of ref.edges) {
      //   let detail = edge.detail;
      //   let weight = 0;
      //   for (let doc of this.docDomain) {
      //     let keys = DataOrCommandReverseMap[doc] as string[];
      //     for (let key of keys) {
      //       const typeIdx: number = MapMsgTypeToIdx[key];
      //       const val: number | undefined = edge.value[typeIdx];
      //       if (val !== undefined && val > 0) {
      //         detail += `<br>${key}: ${val}`;
      //         weight += edge.value[typeIdx];
      //       }
      //     }
      //   }
      //   d.edges.push({
      //     source: edge.source,
      //     target: edge.target,
      //     detail: edge.detail,
      //     weight: weight,
      //     // label is tentatively deserted
      //     label: "" /*weight === 0 ? "" : CompressBigNumber(weight)*/,
      //   });
      // }
    }
    let end = performance.now();
    console.log(`decorateData spend: ${end - start}ms`);
  }

  aggregate_data(
    ref: DataPortRangeResponse,
    d: DataToDisplay,
    transfer_filter: (x: number) => boolean, // transfer_type: refers to `classification.ts: TransferTypesInOrder`
    hops_filter: (x: number) => boolean,  // hop_unit: refers to `meta.num_hop_units & meta.hops_per_unit`
    msg_filter: (x: number) => boolean // msg_type: refers to `classification.ts: MsgTypesInOrder`
  ) {
    // all 3 filters
    const meta = ref.meta;
    const msg_types = MsgTypesInOrder.length;
    for (let edge of ref.edges) {
      let detail = edge.detail;
      let weight = 0;
      let index = 0;
      for (let transfer_type = 0; transfer_type < 4; transfer_type++) {
        if (!transfer_filter(transfer_type)) {
          index += meta.num_hop_units * msg_types;
          continue;
        }
        for (let hop_unit = 0; hop_unit < meta.num_hop_units; hop_unit++) {
          if (!hops_filter(hop_unit)) {
            index += msg_types;
            continue;
          }
          for (let msg_type = 0; msg_type < msg_types; msg_type++) {
            if (!msg_filter(msg_type)) {
              index++;
              continue;
            }
            weight += edge.value[index];
            index++;
          }
        }
      }

      d.edges.push({
        source: edge.source,
        target: edge.target,
        detail: edge.detail,
        weight: weight,
        // label is tentatively deserted
        label: "" /*weight === 0 ? "" : CompressBigNumber(weight)*/,
      });
    }
  }

  invokeController() {} // Nothing to do

  updateMsgGroupDomain(domain: string[]) {
    this.groupDomain = domain;
  }

  updateDataOrCommandDomain(domain: string[]) {
    this.docDomain = domain;
  }
}

export function CompressBigNumber(number: string | number): string {
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

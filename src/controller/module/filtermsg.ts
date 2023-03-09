import { SignalMap, ControllerModule } from "../controller";
import { DataToDisplay, EdgeDisplay } from "display/data";
import { DataPortRangeResponse, EdgeData, MetaData } from "data/data";
import {
  DataOrCommandDomain,
  DataOrCommandReverseMap,
  MsgGroupsDomain,
  MsgGroupsReverseMap,
  MsgTypesInOrderIndexMap,
  MsgTypesInOrder,
  TransferTypesInOrder,
} from "data/classification";
import * as d3 from "d3";
import Event from "event";

const ev = {
  InstTypeFilter: {
    MsgGroup: "FilterMsgGroup",
    DataOrCommand: "FilterDoC",
  },
  NoCMsgTypeFilter: "FilterNoCMsgType",
  NoCNumHopsFilter: "FilterNoCNumHops",
};

enum InstTypeFilterMode {
  ByMsgGroup,
  ByDataOrCommand,
}

const MapMsgTypeToIdx = MsgTypesInOrderIndexMap;

type TruthTable = { [key: string]: boolean };

export default class FilterMsg implements ControllerModule {
  public signal: SignalMap;

  protected instTypeGroupTruthTable: TruthTable;
  protected instTypeDoCTruthTable: TruthTable;
  protected instTypeFilterMode: InstTypeFilterMode;

  protected nocMsgTypeTruthTable: TruthTable;

  protected metaInfo!: MetaData;
  protected NumHopsDomain!: string[];
  protected nocNumHopsTruthTable!: TruthTable;

  constructor() {
    this.signal = {};

    // Instruction Type Filter
    this.instTypeGroupTruthTable = generateTruthTableViaSelectedDomain(
      MsgGroupsDomain,
      MsgGroupsDomain
    );
    this.instTypeDoCTruthTable = generateTruthTableViaSelectedDomain(
      DataOrCommandDomain,
      DataOrCommandDomain
    );
    this.instTypeFilterMode = InstTypeFilterMode.ByMsgGroup; // filter msg group by default

    // NoC Transferred Msg Type Filter
    this.nocMsgTypeTruthTable = generateTruthTableViaSelectedDomain(
      TransferTypesInOrder,
      TransferTypesInOrder
    );

    // NoC # Hops Filter
    // See: `loadMetaInfo(meta: MetaData)` method

    Event.AddStepListener(ev.InstTypeFilter.MsgGroup, (g: string[]) =>
      this.updateInstTypeMsgGroupDomain(g)
    );
    Event.AddStepListener(ev.InstTypeFilter.DataOrCommand, (doc: string[]) =>
      this.updateInstTypeDoCDomain(doc)
    );
    Event.AddStepListener(ev.NoCMsgTypeFilter, (x: string[]) =>
      this.updateNoCMsgTypeDomain(x)
    );
    Event.AddStepListener(ev.NoCNumHopsFilter, (x: string[]) =>
      this.updateNoCNumHopsDomain(x)
    );

    this.initSignalCallbacks();
  }

  protected initSignalCallbacks() {
    this.signal["msg"] = (v) => {
      if (v === "group") {
        this.instTypeFilterMode = InstTypeFilterMode.ByMsgGroup;
      } else if (v === "doc") {
        this.instTypeFilterMode = InstTypeFilterMode.ByDataOrCommand;
      } else {
        console.error("Invalid message signal for module filter");
      }
    };
  }

  decorateData(ref: DataPortRangeResponse, d: DataToDisplay) {
    let start = performance.now();

    if (this.instTypeFilterMode == InstTypeFilterMode.ByMsgGroup) {
      this.aggregate_data(
        ref,
        d,
        (x) => this.nocMsgTypeTruthTable[x],
        (x) => this.nocNumHopsTruthTable[x],
        (x) => this.instTypeGroupTruthTable[x]
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
    hops_filter: (x: number) => boolean, // hop_unit: refers to `meta.num_hop_units & meta.hops_per_unit`
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
            if (msg_filter(msg_type)) {
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

  updateInstTypeMsgGroupDomain(domain: string[]) {
    this.instTypeGroupTruthTable = generateTruthTableViaSelectedDomain(
      domain,
      MsgGroupsDomain
    );
  }

  updateInstTypeDoCDomain(domain: string[]) {
    this.instTypeDoCTruthTable = generateTruthTableViaSelectedDomain(
      domain,
      DataOrCommandDomain
    );
  }

  updateNoCMsgTypeDomain(domain: string[]) {
    this.nocMsgTypeTruthTable = generateTruthTableViaSelectedDomain(
      domain,
      TransferTypesInOrder
    );
  }

  updateNoCNumHopsDomain(domain: string[]) {
    this.nocNumHopsTruthTable = generateTruthTableViaSelectedDomain(
      domain,
      this.NumHopsDomain
    );
  }

  loadMetaInfo(meta: MetaData) {
    this.metaInfo = meta;
    console.log("FilterMsg Module: ", meta, " ", this.metaInfo);
    this.NumHopsDomain = [...Array(this.metaInfo.num_hop_units).keys()].map(
      (i) => `${i}`
    );
    this.nocNumHopsTruthTable = generateTruthTableViaSelectedDomain(
      this.NumHopsDomain,
      this.NumHopsDomain
    );
  }
}

function generateTruthTableViaSelectedDomain(
  selected: string[],
  fullDomain: string[]
): TruthTable {
  let ans: TruthTable = {};
  for (let item of fullDomain) {
    ans[item] = false;
  }
  for (let item of selected) {
    ans[item] = true;
  }
  return ans;
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

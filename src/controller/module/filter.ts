import { SignalMap, ControllerModule } from "../controller";
import { DataToDisplay } from "../../display/data";
import { DataPortRangeResponse } from "../../data/data";

export class Filter implements ControllerModule {
  public signal: SignalMap; // no used

  constructor() {
    this.signal = {};
  }

  decorateData(ref: DataPortRangeResponse, d: DataToDisplay) {
    d.edges!.forEach((e, idx) => {
      e.source = ref.edges[idx].source;
      e.target = ref.edges[idx].target;
      e.detail = ref.edges[idx].detail;

      // weight
      e.weight = 0;
      for (const key in ref.edges[idx].value) {
        e.detail += `${key}: ${ref.edges[idx].value[key]}<br>`;
        e.weight += ref.edges[idx].value[key];
      }
      // label
      e.label = e.weight === 0 ? "" : `${e.weight}`;
      // TODO: style
    });
  }

  invokeController() {} // Nothing to do
}

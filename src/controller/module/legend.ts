import { Controller, ControllerModule } from "../controller";
import { DataToDisplay } from "../../display/data";
import { DataPortResponse } from "../../data/data";

export class Legend implements ControllerModule {
  public signal: Map<string, (v: any) => void>;

  constructor() {
    this.signal = new Map<string, (v: any) => void>(); // not used
  }

  decorateData(ref: DataPortResponse, d: DataToDisplay) {
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

  invokeController(c: Controller) {
    // Nothing to do
  }
}

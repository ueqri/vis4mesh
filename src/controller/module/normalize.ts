import { Controller, ControllerModule } from "../controller";
import { DataToDisplay } from "../../display/data";
import { DataPortResponse } from "../../data/data";

export class LinearNormalize implements ControllerModule {
  public signal: Map<string, (v: any) => void>;

  constructor() {
    this.signal = new Map<string, (v: any) => void>(); // not used
  }

  decorateData(ref: DataPortResponse, d: DataToDisplay) {
    let max: number = 0;
    d.edges!.forEach((e) => {
      if (max < e.weight!) {
        max = e.weight!;
      }
    });
    d.edges!.forEach((e) => {
      if (max != 0) {
        e.weight = Math.round((e.weight! * 9) / max);
      }
    });
  }

  invokeController(c: Controller) {
    // Nothing to do
  }
}

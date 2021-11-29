import { ControllerModule, SignalMap } from "../controller";
import { DataToDisplay } from "../../display/data";

export class LinearNormalize implements ControllerModule {
  public signal: SignalMap;

  constructor() {
    this.signal = {};
  }

  decorateData(d: DataToDisplay) {
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

  invokeController() {} // Nothing to do
}

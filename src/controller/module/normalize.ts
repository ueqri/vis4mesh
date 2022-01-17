import { ControllerModule, SignalMap } from "../controller";
import { DataToDisplay, DisplayStyle } from "display/data";
import { RenameTrafficFilterCheckboxes } from "filterbar/filterbar";
import Event from "event";

const ev = {
  EdgeTraffic: "FilterEdgeTraffic",
};

const NumLevels = 10;
interface TrafficInterval {
  lower: number;
  upper: number;
}

export default class LinearNormalize implements ControllerModule {
  public signal: SignalMap;
  // lists of traffic checkbox which is activated by user
  protected checked: number[];

  constructor() {
    this.signal = {};
    this.checked = Array.from(Array(NumLevels).keys());
    Event.AddStepListener(ev.EdgeTraffic, (lv: number[]) =>
      this.updateTrafficCheckbox(lv)
    );
  }

  decorateData(d: DataToDisplay) {
    let max: number = 0;
    d.edges!.forEach((e) => {
      if (max < e.weight!) {
        max = e.weight!;
      }
    });

    // lists of traffic interval determined by current time
    let traffic: Array<TrafficInterval> = new Array<TrafficInterval>();
    for (let i = 0; i < NumLevels; i++) {
      traffic.push({ lower: max, upper: 0 });
    }

    let checkedMap: boolean[] = Array<boolean>(NumLevels).fill(false);
    this.checked.forEach((c) => (checkedMap[c] = true));

    d.edges!.forEach((e) => {
      let w: number = 0;
      if (max != 0) {
        w = Math.round((e.weight! * 9) / max);
      }
      if (e.weight! > traffic[w].upper) {
        traffic[w].upper = e.weight!;
      }
      if (e.weight! < traffic[w].lower) {
        traffic[w].lower = e.weight!;
      }
      e.weight = w;

      if (checkedMap[w] === true) {
        e.style = DisplayStyle.Normal;
      } else {
        e.style = DisplayStyle.Translucent;
      }
    });

    RenameTrafficFilterCheckboxes(traffic);
  }

  invokeController() {} // Nothing to do

  updateTrafficCheckbox(lv: number[]) {
    this.checked = lv;
  }
}

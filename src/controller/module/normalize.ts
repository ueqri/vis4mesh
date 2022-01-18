import { ControllerModule, SignalMap } from "../controller";
import { DataToDisplay, DisplayStyle } from "display/data";
import EdgeTrafficCheckboxes from "filterbar/edgecheckbox";
import Event from "event";

const ev = {
  EdgeTraffic: "FilterETCheckbox",
};

const NumLevels = 10;

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

    // lists of upper bound of each level at the current time slice
    let uppers: Array<number> = new Array<number>(NumLevels).fill(0);
    let checkedMap: boolean[] = Array<boolean>(NumLevels).fill(false);
    this.checked.forEach((c) => (checkedMap[c] = true));

    d.edges!.forEach((e) => {
      let w: number = 0;
      if (max != 0) {
        w = Math.floor((e.weight! * 9) / max);
      }
      if (e.weight! > uppers[w]) {
        uppers[w] = e.weight!;
      }
      e.weight = w;

      if (checkedMap[w] === true) {
        e.style = DisplayStyle.Normal;
      } else {
        e.style = DisplayStyle.Translucent;
      }
    });

    uppers.forEach((u, i) => {
      if (u === 0) {
        uppers[i] = Math.floor(((i + 1) * max) / 10);
      }
    });
    EdgeTrafficCheckboxes.applyUpperBound(uppers);
  }

  invokeController() {} // Nothing to do

  updateTrafficCheckbox(lv: number[]) {
    this.checked = lv;
  }
}

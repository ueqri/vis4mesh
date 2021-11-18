import { Controller, ControllerModule } from "../controller";
import { DataToDisplay } from "../../display/data";
import { DataPortResponse } from "../../data/data";
import { SmartSlider } from "widget/standalone/smartslider";

class InnerTicker {
  public timeoutHandle: any;
  public tickFunc!: () => boolean; // return success or failed of current tick
  protected speed: number; // rate of ticking per second, default 1
  protected step: number; // step for time increase per tick, used in `next`

  constructor() {
    this.speed = 1;
    this.step = 1;
  }

  updateSpeed(s: number): this {
    if (this.speed <= 0) {
      console.error(
        `InnerTicker speed cannot be set to a non-positive number like ${s}`
      );
    } else {
      this.speed = s;
    }
    return this;
  }

  updateStep(s: number): this {
    this.step = s;
    return this;
  }

  next(now: number): number {
    return Number(now + this.step);
  }

  auto() {
    if (this.tickFunc() === true) {
      this.timeoutHandle = setTimeout(() => this.auto(), 1000 / this.speed);
    } else {
      console.error(`Tick function failed in InnerTicker: ${this.tickFunc}`);
    }
  }

  pause() {
    clearTimeout(this.timeoutHandle);
  }

  manual() {
    this.tickFunc();
  }

  // `still` doesn't change the time iterator, just call `tickFunc` once, and
  // `still` and `auto` are not allowed to call concurrently
  still() {
    let temp = this.step;
    this.step = 0;
    this.tickFunc();
    this.step = temp;
  }
}

enum TickerMode {
  SliceTick, // tick slice, i.e. both `startTime` and `endTime` are ticking
  RangeTick, // tick `timeTo` from input box, i.e `timeFrom` is static
  // [deprecated] RangeSlider, // set static range from range slider
}

export class Ticker implements ControllerModule {
  protected t: InnerTicker;
  protected mode: TickerMode;
  protected controller!: Controller;
  protected sliderView: SmartSlider; // display ticker time in slider
  public signal: Map<string, (v: any) => void>;

  constructor(sliderView: SmartSlider) {
    this.t = new InnerTicker();
    this.mode = TickerMode.SliceTick; // by default
    this.sliderView = sliderView;
    this.signal = new Map<string, (v: any) => void>();
  }

  protected initSignalCallbacks() {
    this.signal.set("speed", (v: any) => {
      this.t.updateSpeed(Number(v));
    });
    this.signal.set("step", (v: any) => {
      this.t.updateStep(Number(v));
    });
    this.signal.set("state", (v: any) => {
      let stat = v as string;
      if (stat === "auto") {
        this.t.auto();
      } else if (stat === "pause") {
        this.t.pause();
      } else if (stat === "manual") {
        this.t.manual();
      } else if (stat === "still") {
        this.t.still();
      } else {
        console.error(`Unknown state signal ${stat} passed to Ticker`);
      }
    });
    this.signal.set("timeStart", (v: any) => {
      this.t.pause();
      this.controller.startTime = Number(v);
      this.t.still();
    });
    this.signal.set("timeEnd", (v: any) => {
      this.t.pause();
      this.controller.endTime = Number(v);
      this.t.still();
    });
  }

  decorateData(ref: DataPortResponse, d: DataToDisplay) {
    this.sliderView.setLeft(this.controller.startTime);
    this.sliderView.setRight(this.controller.endTime);
  }

  invokeController(c: Controller) {
    this.controller = c;
    this.initSignalCallbacks();
    this.t.tickFunc = () => {
      // Send data port request in controller
      if (c.requestDataPort() === false) {
        return false;
      }
      // Update time recorder in Controller
      if (this.mode === TickerMode.SliceTick) {
        c.startTime = c.endTime;
      } else if (this.mode === TickerMode.RangeTick) {
        // Nothing to do with `c.startTime`
      }
      c.endTime = this.t.next(c.endTime);
      return true;
    };
  }
}

import { Controller, ControllerModule } from "../controller";
import { DataToDisplay } from "../../display/data";
import { DataPortResponse } from "../../data/data";

class InnerTicker {
  public timeoutHandle: any;
  public tickFunc!: () => any;
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
    this.tickFunc();
    this.timeoutHandle = setTimeout(() => this.auto(), 1000 / this.speed);
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
  public signalChange: Map<string, (v: any) => void>;

  constructor() {
    this.t = new InnerTicker();
    this.mode = TickerMode.SliceTick; // by default
    this.signalChange = new Map<string, (v: any) => void>();
    this.initSignalCallbacks();
  }

  protected initSignalCallbacks() {
    this.signalChange.set("speed", (v: any) => {
      this.t.updateSpeed(Number(v));
    });
    this.signalChange.set("step", (v: any) => {
      this.t.updateStep(Number(v));
    });
    this.signalChange.set("state", (v: any) => {
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
  }

  decorateData(ref: DataPortResponse, d: DataToDisplay) {
    // nothing to do
  }

  invokeController(c: Controller) {
    this.t.tickFunc = () => {
      c.requestDataPort();

      // update time recorder in Controller
      if (this.mode === TickerMode.SliceTick) {
        c.startTime = c.endTime;
      } else if (this.mode === TickerMode.RangeTick) {
        // nothing to do with `c.startTime`
      }
      c.endTime = this.t.next(c.endTime);
    };
  }
}

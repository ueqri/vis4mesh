import Controller from "../controller/controller";

type SignalMap = { [type: string]: (v: any) => any };

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
    return now + this.step;
  }

  auto() {
    if (this.tickFunc() === true) {
      this.timeoutHandle = setTimeout(() => this.auto(), 1000 / this.speed);
    } else {
      console.log("Automatic tick finished in InnerTicker");
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
}

export default class Ticker {
  public signal: SignalMap;
  protected t: InnerTicker;
  protected mode: TickerMode;
  protected cast: (l: number, r: number) => any;
  protected running: boolean;
  protected statusChangeCallback: (running: boolean) => any;
  protected maxTime: number;

  constructor(maxTime: number) {
    this.signal = {};
    this.t = new InnerTicker();
    this.mode = TickerMode.SliceTick; // by default
    this.cast = () => {};
    this.running = false;
    this.statusChangeCallback = () => {};
    this.maxTime = maxTime;

    this.initSignalCallbacks();
  }

  protected initSignalCallbacks() {
    this.signal["speed"] = (v) => {
      this.t.updateSpeed(Number(v));
    };
    this.signal["step"] = (v) => {
      this.t.updateStep(Number(v));
    };
    this.signal["state"] = (v) => {
      let stat = v as string;
      let next: boolean = this.running;
      if (stat === "auto") {
        this.t.auto();
        next = true;
      } else if (stat === "pause") {
        this.t.pause();
        next = false;
      } else if (stat === "manual") {
        this.t.manual();
        next = false;
      } else if (stat === "still") {
        this.t.still();
        next = false;
      } else {
        console.error(`Unknown state signal ${stat} passed to Ticker`);
      }
      if (next != this.running) {
        console.log(`change from ${this.running} -> ${next}`);
        this.running = next;
        this.statusChangeCallback(this.running);
      }
    };
    this.signal["mode"] = (v) => {
      this.t.pause();
      let m = v as string;
      if (m === "slice") {
        this.mode = TickerMode.SliceTick;
      } else if (m === "range") {
        this.mode = TickerMode.RangeTick;
      } else {
        console.error(`Unknown mode signal ${m} passed to Ticker`);
      }
    };
  }

  setCast(f: (l: number, r: number) => any): this {
    this.cast = f;
    return this;
  }

  bindController(c: Controller): this {
    this.t.tickFunc = () => {
      // Set time recorder in Controller first
      if (this.mode === TickerMode.SliceTick) {
        if (this.t.next(0) != 0) {
          // if this.t.step not equals to 0, i.e., not in `still` mode
          c.startTime = c.endTime;
        }
      } else if (this.mode === TickerMode.RangeTick) {
        // Nothing to do with `c.startTime`
      }
      if (c.endTime === this.maxTime) {
        this.running = false;
        this.statusChangeCallback(false);
        return false; // exit ticking
      } else {
        c.endTime = this.t.next(c.endTime);
      }

      // Cast the left and right value
      this.cast(c.startTime, c.endTime);
      // Send data port request in controller, TODO: error sets ticker pause
      c.requestDataPort();

      return true; // continue ticking
    };

    return this;
  }

  setStatusChangeCallback(f: (running: boolean) => any): this {
    this.statusChangeCallback = f;
    return this;
  }
}

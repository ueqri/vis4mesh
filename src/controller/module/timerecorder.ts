import { Controller, ControllerModule, SignalMap } from "../controller";

export class TimeRecorder implements ControllerModule {
  protected controller!: Controller;
  public signal: SignalMap;

  constructor() {
    this.signal = {};
  }

  protected initSignalCallbacks() {
    this.signal["timeStart"] = (v: any) => {
      this.controller.startTime = Number(v);
    };
    this.signal["timeEnd"] = (v: any) => {
      this.controller.endTime = Number(v);
    };
  }

  decorateData() {} // Nothing to do

  invokeController(c: Controller) {
    this.controller = c;
    this.initSignalCallbacks();
  }
}

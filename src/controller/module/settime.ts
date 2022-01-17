import Controller, { ControllerModule, SignalMap } from "../controller";

export default class SetTime implements ControllerModule {
  protected controller!: Controller;
  public signal: SignalMap;

  constructor() {
    this.signal = {};
  }

  protected initSignalCallbacks() {
    this.signal["start"] = (v: any) => {
      this.controller.startTime = Number(v);
    };
    this.signal["end"] = (v: any) => {
      this.controller.endTime = Number(v);
    };
    this.signal["refresh"] = () => {
      this.controller.requestDataPort();
    };
  }

  decorateData() {} // Nothing to do

  invokeController(c: Controller) {
    this.controller = c;
    this.initSignalCallbacks();
  }
}

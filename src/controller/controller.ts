import { DataPort } from "../data/dataport";
import { DataPortResponse } from "../data/data";
import { DataToDisplay } from "../display/data";
import { Display } from "display/display";

export type SignalMap = Map<string, (v: any) => any>;

export interface ControllerModule {
  // callback for outside change events,
  // change event type(e.g. status, selection) maps to `(<type value>) => any`
  signalChange: Map<string, (v: any) => any>;

  // decorate response of data port
  decorateData(ref: DataPortResponse, d: DataToDisplay): void;
  // entrypoint function of module
  invokeController(c: Controller): void;
}

export class Controller {
  // Controller components
  protected port: DataPort;
  protected view: Display;
  protected modules: Array<ControllerModule>;

  // Shared variables for all modules
  public startTime: number;
  public endTime: number;

  constructor(ws: string, view: Display) {
    this.startTime = this.endTime = 0;

    this.port = new DataPort(ws);
    this.view = view;
    this.modules = new Array<ControllerModule>();
  }

  loadModule(m: ControllerModule): this {
    this.modules.push(m);
    m.invokeController(this);
    return this;
  }

  requestDataPort() {
    this.port.range(this.startTime, this.endTime, (d) => {
      let resp: DataPortResponse = JSON.parse(d);
      let data: DataToDisplay = {
        // basic data clone
        meta: resp.meta,
        nodes: resp.nodes,
        edges: resp.edges,
      };
      this.modules.forEach((m) => {
        m.decorateData(resp, data);
      });
      this.view.renderData(data);
    });
  }
}

import DataPort from "data/dataport";
import { DataPortRangeResponse } from "data/data";
import Display from "display/display";
import { DataToDisplay } from "display/data";
import DataWrapper from "../data/localport";

export type SignalMap = { [type: string]: (v: any) => any };

export interface ControllerModule {
  // Callback for outside change events, like Interrupt Service Routine (ISR)
  // event type(e.g. status, selection) maps to `(<type value>) => any`
  signal: { [type: string]: (v: any) => any };

  // Decorate response of data port
  decorateData(ref: DataPortRangeResponse, d: DataToDisplay): void;
  // Entrypoint function of module
  invokeController(c: Controller): void;
}

export default class Controller {
  // Controller components
  protected port: DataPort;
  protected view: Display;
  protected modules: Array<ControllerModule>;

  // Shared variables for all modules
  public startTime: number;
  public endTime: number;

  constructor(port: DataWrapper, view: Display) {
    this.startTime = this.endTime = 0;

    this.port = port;
    this.view = view;
    this.modules = new Array<ControllerModule>();
  }

  loadModules(mods: ControllerModule[]): this {
    this.modules = [...this.modules, ...mods];
    mods.forEach((m) => m.invokeController(this));
    return this;
  }

  requestDataPort() {
    this.port.range(this.startTime, this.endTime).then(
      (resp) => {
        let data: DataToDisplay = {
          // Basic data clone
          meta: resp.meta,
          nodes: resp.nodes,
          edges: resp.edges,
        };
        this.modules.forEach((m) => {
          m.decorateData(resp, data);
        });
        this.view.renderData(data);
      },
      (reason) => {
        console.error(reason);
      }
    );
  }
}

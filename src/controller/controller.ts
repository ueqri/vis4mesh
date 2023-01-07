import DataPort from "data/dataport";
import { DataPortRangeResponse } from "data/data";
import { DataToDisplay } from "display/data";
import DataWrapper from "data/localport";
import { BuildAbstractLayers } from "../graph/abstractlayer";
import { MainView } from "graph/graph";
import selector from "widget/daisen";

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
  protected graph: MainView;
  protected modules: Array<ControllerModule>;

  // Shared variables for all modules
  public startTime: number;
  public endTime: number;

  constructor(port: DataWrapper, graph: MainView) {
    this.startTime = this.endTime = 0;

    this.port = port;
    this.graph = graph;
    this.modules = new Array<ControllerModule>();
  }

  loadModules(mods: ControllerModule[]): this {
    this.modules = [...this.modules, ...mods];
    mods.forEach((m) => m.invokeController(this));
    return this;
  }

  async requestDataPort() {
    selector.register_timerange([this.startTime, this.endTime]);
    try {
      let resp = await this.port.range(this.startTime, this.endTime);
      let data: DataToDisplay = {
        // Basic data reference
        meta: resp.meta,
        nodes: resp.nodes,
        edges: [],
      };
      // rebuild abstract layers and render

      this.modules.forEach((m) => {
        m.decorateData(resp, data);
      });
      console.log("new data loaded");
      this.graph.loadAbstractLayers(
        BuildAbstractLayers(
          resp.meta["width"],
          resp.meta["height"],
          this.graph.max_scale,
          data.edges,
          this.endTime - this.startTime
        )
      );
    } catch (reason) {
      console.error(reason);
    }
  }
}

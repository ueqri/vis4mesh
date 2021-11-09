import { Grid } from "./layout/grid";
import { DataPort, EdgeData, StateController } from "./data";

export class Graph {
  port: DataPort;
  graph: Grid;
  status: StateController;
  renderToDiv: HTMLElement;

  constructor(renderToDiv: HTMLElement) {
    this.renderToDiv = renderToDiv;

    this.port = new DataPort("ws://localhost:8080/");
    this.graph = new Grid(renderToDiv);

    this.status = new StateController(this.port, this.graph);

    this.port.init((d) => {
      var data = JSON.parse(d);
      this.graph.nodeData(data.nodes);
      (data.edges as EdgeData[]).forEach((e) => {
        e.dynamicWeight = 0;
      });
      this.graph.edgeData(data.edges);
      this.graph.render();

      this.status.initAllMsgTypes(
        Object.keys((data.edges as EdgeData[])[0].value)
      );
    });
  }
}

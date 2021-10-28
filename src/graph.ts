import { Grid } from "./layout/grid";
import { DataPort, RangeRecorder, StateController } from "./data";

export class Graph {
  port: DataPort;
  graph: Grid;
  status: StateController;
  targetDOM: Document;

  constructor(targetDOM: Document, range: RangeRecorder) {
    this.targetDOM = targetDOM;

    this.port = new DataPort("ws://localhost:8080/");
    this.graph = new Grid(targetDOM);

    this.port.init((d) => {
      var data = JSON.parse(d);
      this.graph.nodeData(data.nodes);
      this.graph.edgeData(data.edges);
      this.graph.render();
    });

    this.status = new StateController(this.port, this.graph);
  }
}

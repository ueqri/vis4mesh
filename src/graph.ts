import { Grid } from "./layout/grid";
import { DataPort, Ticker } from "./data";

export class Graph {
  port: DataPort;
  graph: Grid;
  tick: Ticker;
  targetDOM: Document;

  constructor(targetDOM: Document) {
    this.targetDOM = targetDOM;

    this.port = new DataPort("ws://localhost:8080/");
    this.tick = new Ticker();
    this.graph = new Grid(targetDOM);

    this.port.init((d) => {
      var data = JSON.parse(d);
      this.graph.nodeData(data.nodes);
      this.graph.edgeData(data.edges);
      this.graph.render();
    });

    this.tick.tickFunc = () => {
      this.port.range(0, this.tick.elapse, (d) => {
        this.graph.edgeData(JSON.parse(d));
      });
      this.graph.refresh();
    };
  }
}

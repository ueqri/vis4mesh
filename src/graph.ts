import { Grid } from "./layout/grid";
import { DataPort, RangeRecorder, Ticker } from "./data";

export class Graph {
  port: DataPort;
  graph: Grid;
  tick: Ticker;
  targetDOM: Document;
  tickerCallbacks: Array<(from: number, to: number) => any>;

  constructor(targetDOM: Document, range: RangeRecorder) {
    this.targetDOM = targetDOM;

    this.port = new DataPort("ws://localhost:8080/");
    this.tick = new Ticker();
    this.graph = new Grid(targetDOM);
    this.tickerCallbacks = new Array<(from: number, to: number) => any>();

    this.port.init((d) => {
      var data = JSON.parse(d);
      this.graph.nodeData(data.nodes);
      this.graph.edgeData(data.edges);
      this.graph.render();
    });

    this.tick.tickFunc = () => {
      this.port.range(range.startTime, range.now, (d) => {
        this.graph.edgeData(JSON.parse(d));
      });
      this.graph.refresh();
      this.tickerCallbacks.forEach((func) => func(range.startTime, range.now));
      range.now = this.tick.next(range.now);
    };
  }

  addTickerCallback(callback: (from: number, to: number) => any): this {
    this.tickerCallbacks.push(callback);
    return this;
  }
}

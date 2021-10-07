import { Grid } from "./layout/grid";
import { DataPort, Ticker } from "./data";

var port = new DataPort("ws://localhost:8080/");

var graph = new Grid(1000, 1000);

port.init((d) => {
  var data = JSON.parse(d);
  graph.nodeData(data.nodes);
  graph.edgeData(data.edges);
  graph.render();
});

var tick = new Ticker();
tick.tickFunc = () => {
  port.range(0, tick.elapse, (d) => {
    graph.edgeData(JSON.parse(d));
  });
  graph.refresh();
  // graph.legend(9);
};

document.addEventListener("keydown", function (event) {
  if (event.key === " ") {
    tick.auto();
  }
  if (event.key === "p") {
    tick.pause();
  }
  if (event.key == "ArrowRight") {
    tick.manual();
  }
  // if (event.key == 'ArrowLeft') {
  //   vis.timePrevious();
  // }
});

import { Graph } from "./graph";
import { Sidebar } from "./sidebar";

var divGraph = document.getElementById("div-graph") as HTMLElement;

//
// Graph
//
var g = new Graph(divGraph);

//
// Sidebar
//
var bar = new Sidebar(g);
bar.renderLegendFocus();
bar.renderShapeConfig();
bar.renderGeneralConfig();

//
// Global Event
//
var flipCall = [
  function () {
    bar.toggleRun();
  },
  function () {
    bar.togglePause();
  },
];
var flipIndex: number = 0;
document.addEventListener("keydown", function (event) {
  if (event.key === " ") {
    flipCall[flipIndex]();
    flipIndex = (flipIndex + 1) % flipCall.length;
  }
  // if (event.key == "ArrowRight") {
  //   g.tick.manual();
  // }
  // if (event.key == 'ArrowLeft') {
  //   vis.timePrevious();
  // }
});

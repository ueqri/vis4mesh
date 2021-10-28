import { Graph } from "./graph";
import { Sidebar } from "./sidebar";
import { RangeRecorder } from "./data";

var iframe = document.getElementById("iframe-graph") as HTMLIFrameElement;
var graphDOM = iframe.contentDocument || iframe.contentWindow!.document;

//
// Graph
//
var range = new RangeRecorder();
var g = new Graph(graphDOM, range);

//
// Sidebar
//
var bar = new Sidebar(g);
bar.renderLegend();
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

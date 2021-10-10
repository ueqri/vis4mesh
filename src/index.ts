import { Graph } from "./graph";
import { Legend, GenerateColorByValue } from "./plugin/legend";

var iframe = document.getElementById("iframe-graph") as HTMLIFrameElement;
var graphDOM = iframe.contentDocument || iframe.contentWindow!.document;

//
// Graph
//
var g = new Graph(graphDOM);

//
// Plugin
//
// var plugin = new Plugin();

//
// Legend
//
var legend = new Legend();
legend.graphDOM = graphDOM;
var legendTypes = [
  "Extremely-high Crowded",
  "High Crowded",
  "Moderate Crowded",
  "Low Crowded",
  "Slightly Crowded",
  "Slightly Idle",
  "Low Idle",
  "Moderate Idle",
  "High Idle",
  "Extremely-high Idle",
];
legendTypes.forEach(function (v, idx) {
  legend.addLabel({
    name: v,
    avatar: GenerateColorByValue(9 - idx),
    selectValue: 9 - idx,
  });
});
legend.renderCheckboxTo(
  document.getElementById("div-sidebar-legend") as HTMLElement, g.graph
);

document.addEventListener("keydown", function (event) {
  if (event.key === " ") {
    g.tick.auto();
  }
  if (event.key === "p") {
    g.tick.pause();
  }
  if (event.key == "ArrowRight") {
    g.tick.manual();
  }
  // if (event.key == 'ArrowLeft') {
  //   vis.timePrevious();
  // }
});

// const slider = document.getElementById("slider")

// slider!.addEventListener("change", function() {
//   console.log(this.value)
// })

// d3.select(graph).

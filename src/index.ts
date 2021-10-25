import { Graph } from "./graph";
import { Legend, GenerateColorByValue } from "./plugin/legend";
import { SingleSlider } from "./widget/slider";
import { InputBoxWithFloatingLabel } from "./widget/input";
import { GroupRenderAsColumns } from "./widget/widget";
import { RangeRecorder } from "./data";
import { RadioButtonGroup } from "./widget/button";

var iframe = document.getElementById("iframe-graph") as HTMLIFrameElement;
var graphDOM = iframe.contentDocument || iframe.contentWindow!.document;

//
// Graph
//
var range = new RangeRecorder();
var g = new Graph(graphDOM, range);

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
  document.getElementById("div-sidebar-legend") as HTMLElement,
  g.graph
);

//
// Shape Config
//
var divShapeConfig = document.getElementById(
  "div-sidebar-shape-config"
) as HTMLElement;

var sliderNodeSize = new SingleSlider("slider-node-size", 0, 100, 0.1);
sliderNodeSize
  .name("Node Size")
  .default(g.graph.getNodeSize())
  .renderTo(divShapeConfig)
  .event((value: number) => {
    g.graph.updateNodeSize(value);
  });

var sliderEdgeWidth = new SingleSlider("slider-edge-width", 0, 100, 0.1);
sliderEdgeWidth
  .name("Edge Width")
  .default(g.graph.getEdgeWidth())
  .renderTo(divShapeConfig)
  .event((value: number) => {
    g.graph.updateEdgeWidth(value);
  });

// var sliderDualLinkSpace = new SingleSlider("slider-dual-space", 0, 20, 0.05);
// sliderDualLinkSpace
//   .name("Dual Edge Space")
//   .default(g.graph.getDualLinkSpace())
//   .renderTo(divShapeConfig)
//   .event((value: number) => {
//     g.graph.updateDualLinkSpace(value);
//   });

var sliderMapStretchRatio = new SingleSlider("slider-map-ratio", 0, 100, 1);
sliderMapStretchRatio
  .name("Stretch Ratio")
  .default(g.graph.getMapRatio())
  .renderTo(divShapeConfig)
  .event((value: number) => {
    g.graph.updateMapRatio(value);
  });

//
// General
//
var tempInputTimeRange = new RangeRecorder();
var divGeneral = document.getElementById("div-sidebar-general") as HTMLElement;
var timeFrom = new InputBoxWithFloatingLabel("input-time-from");
var timeTo = new InputBoxWithFloatingLabel("input-time-to");
GroupRenderAsColumns(divGeneral, [
  timeFrom
    .name("Time From")
    .default(0)
    .storeEvent((value: number) => {
      // range.startTime = Number(value);
      tempInputTimeRange.startTime = Number(value);
    }),
  timeTo
    .name("Time To")
    .default(0)
    .storeEvent((value: number) => {
      // range.now = Number(value);
      tempInputTimeRange.now = Number(value);
    }),
]);
var toggle = new RadioButtonGroup("radio-toggle");
toggle
  .name(["Set&Run", "Pause", "Manual"])
  .default("Stop")
  .renderTo(divGeneral)
  .event((value: string) => {
    if (value === "Set&Run") {
      range.copy(tempInputTimeRange);
      timeFrom.deactivate();
      timeTo.deactivate();
      g.tick.auto();
    } else if (value === "Pause") {
      timeFrom.activate();
      timeTo.activate();
      g.tick.pause();
    } else if (value === "Manual") {
      timeFrom.activate();
      timeTo.activate();
      range.copy(tempInputTimeRange);
      g.tick.manual();
    }
  });

//
// Global Event
//
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

import { Grid } from "./layout/grid";
import { Legend, GenerateColorByValue } from "./plugin/legend";
import { SingleSlider } from "./widget/slider";
import { InputBoxWithFloatingLabel } from "./widget/input";
import { GroupRenderAsColumns } from "./widget/widget";
import { RangeRecorder, StateController, Mode } from "./data";
import { Graph } from "./graph";
import { RadioButtonGroup } from "./widget/button";
import { LabelBox } from "./widget/labelbox";

export class Sidebar {
  protected legend!: Legend;
  protected sliderNodeSize!: SingleSlider;
  protected sliderEdgeWidth!: SingleSlider;
  protected sliderMapStretchRatio!: SingleSlider;
  protected timeFrom!: InputBoxWithFloatingLabel;
  protected timeTo!: InputBoxWithFloatingLabel;
  protected stateToggle!: RadioButtonGroup;

  protected divLegend: HTMLElement;
  protected divShapeConfig: HTMLElement;
  protected divGeneralConfig: HTMLElement;

  protected graphDOM: Document;
  protected bindInstance: Grid;
  protected stateControl: StateController;

  constructor(configFor: Graph) {
    this.divLegend = document.getElementById(
      "div-sidebar-legend"
    ) as HTMLElement;

    this.divShapeConfig = document.getElementById(
      "div-sidebar-shape-config"
    ) as HTMLElement;

    this.divGeneralConfig = document.getElementById(
      "div-sidebar-general"
    ) as HTMLElement;

    this.graphDOM = configFor.targetDOM;
    this.bindInstance = configFor.graph;
    this.stateControl = configFor.status;
  }

  renderLegend() {
    this.legend = new Legend();
    this.legend.graphDOM = this.graphDOM;
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
    legendTypes.forEach((v, idx) => {
      this.legend.addLabel({
        name: v,
        avatar: GenerateColorByValue(9 - idx),
        selectValue: 9 - idx,
      });
    });
    this.legend.renderCheckboxTo(this.divLegend, this.bindInstance);
  }

  renderShapeConfig() {
    let div = this.divShapeConfig;
    let bindInstance = this.bindInstance;
    this.sliderNodeSize = new SingleSlider("slider-node-size", 0, 100, 0.1);
    this.sliderNodeSize
      .name("Node Size")
      .default(bindInstance.getNodeSize())
      .renderTo(div)
      .event((value: number) => {
        bindInstance.updateNodeSize(value);
      });

    this.sliderEdgeWidth = new SingleSlider("slider-edge-width", 0, 100, 0.1);
    this.sliderEdgeWidth
      .name("Edge Width")
      .default(bindInstance.getEdgeWidth())
      .renderTo(div)
      .event((value: number) => {
        bindInstance.updateEdgeWidth(value);
      });

    this.sliderMapStretchRatio = new SingleSlider(
      "slider-map-ratio",
      0,
      100,
      1
    );
    this.sliderMapStretchRatio
      .name("Stretch Ratio")
      .default(bindInstance.getMapRatio())
      .renderTo(div)
      .event((value: number) => {
        bindInstance.updateMapRatio(value);
      });
  }

  renderGeneralConfig() {
    let div = this.divGeneralConfig;
    let controller = this.stateControl;

    // Speed config
    var divSpeed = new LabelBox("speed-config")
      .name("Speed config (rate of ticks per second)")
      .renderTo(div)
      .element();
    var radioSpeed = new RadioButtonGroup("speed-radio")
      .name(["1X", "2X", "4X"])
      .default("1X")
      .renderTo(divSpeed)
      .event((v: string) => {
        if (v === "1X") {
          controller.updateSpeed(1);
        } else if (v === "2X") {
          controller.updateSpeed(2);
        } else if (v === "4X") {
          controller.updateSpeed(4);
        } else {
          console.error("internal error in radio for speed config");
        }
        this.togglePause();
      });

    // Step config
    var divStep = new LabelBox("step-config")
      .name("Step config (rate of time slices per tick)")
      .renderTo(div)
      .element();
    var inputStep = new InputBoxWithFloatingLabel("input-step-config")
      .name("Time slices per tick")
      .default(1)
      .renderTo(divStep)
      .event((v: number) => {
        this.stateControl.updateStep(Number(v));
        this.togglePause();
      });

    // Mode config
    var divMode = new LabelBox("mode-select")
      .name("Mode select")
      .renderTo(div)
      .element();
    var radioMode = new RadioButtonGroup("mode-radio")
      .name(["Slice Tick", "Range Tick", "Range Slider"])
      .default("Slice Tick")
      .renderTo(divMode)
      .event((v: string) => {
        if (v === "Slice Tick") {
          this.stateControl.updateMode(Mode.SliceTick);
        } else if (v === "Range Tick") {
          this.stateControl.updateMode(Mode.RangeTick);
        } else if (v === "Range Slider") {
          this.stateControl.updateMode(Mode.RangeSlider);
        } else {
          console.error("internal error in radio for mode config");
        }
        this.togglePause();
      });

    // Mode 1: slice tick, i.e. both start and end time are ticking

    var divManualInput = new LabelBox("manual-input")
      .name("Manual input")
      .renderTo(div)
      .element();

    var tempInputTimeRange = new RangeRecorder();
    this.timeFrom = new InputBoxWithFloatingLabel("input-time-from");
    this.timeTo = new InputBoxWithFloatingLabel("input-time-to");
    GroupRenderAsColumns(divManualInput, [
      this.timeFrom
        .name("Time From")
        .default(0)
        .storeEvent((value: number) => {
          // range.startTime = Number(value);
          tempInputTimeRange.startTime = Number(value);
        }),
      this.timeTo
        .name("Time To")
        .default(0)
        .storeEvent((value: number) => {
          // range.endTime = Number(value);
          tempInputTimeRange.endTime = Number(value);
        }),
    ]);

    this.stateControl.addStatChangeCallback((from: number, to: number) => {
      this.timeFrom.updateValue(from);
    });

    this.stateControl.addStatChangeCallback((from: number, to: number) => {
      this.timeTo.updateValue(to);
    });

    this.stateToggle = new RadioButtonGroup("radio-toggle");
    this.stateToggle
      .name(["Set Input", "Run", "Pause", "Drag Manually"])
      .default("Pause")
      .renderTo(div)
      .event((v: string) => {
        if (v === "Set Input") {
          // if set then change input, may not trigger event
          this.stateControl.updateTimeRange(tempInputTimeRange);
        } else if (v === "Run") {
          this.toggleRun();
        } else if (v === "Pause") {
          this.togglePause();
        } else if (v === "Drag Manually") {
          // timeFrom.deactivate();
          // timeTo.deactivate();
          // g.tick.manual();
        }
      });
  }

  toggleRun() {
    this.stateToggle.switch("Run");
    this.timeFrom.deactivate();
    this.timeTo.deactivate();
    this.stateControl.action();
  }

  togglePause() {
    this.stateToggle.switch("Pause");
    this.timeFrom.activate();
    this.timeTo.activate();
    // if controller is already stopped, nothing will happen
    this.stateControl.stop();
  }

  manualBack() {
    // TODO
  }

  manualForward() {
    // TODO
  }
}

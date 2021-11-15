import { Controller } from "./controller/controller";
import { Grid } from "./display/layout/grid";
import { Display } from "./display/display";
import { Ticker } from "./controller/module/ticker";
import { Legend } from "./controller/module/legend";
import { LinearNormalize } from "./controller/module/normalize";

import * as noUiSlider from "nouislider";
import "nouislider/dist/nouislider.css";

let divGraph = document.getElementById("graph") as HTMLElement;
let c = new Controller("ws://127.0.0.1:8080/", new Display(divGraph, Grid));
let t = new Ticker();
c.loadModule(t).loadModule(new Legend()).loadModule(new LinearNormalize());
t.signalChange.get("state")!("still");

let divSlider = document.getElementById("slider") as HTMLElement;
noUiSlider.create(divSlider!, {
  start: [40, 60],
  behaviour: "drag-tap",
  connect: true,
  range: {
    min: 20,
    max: 80,
  },
});

//
// Global Event
//

let flipCall = [
  function () {
    t.signalChange.get("state")!("auto");
  },
  function () {
    t.signalChange.get("state")!("pause");
  },
];
let flipIndex: number = 0;
document.addEventListener("keydown", function (event) {
  if (event.key === " ") {
    flipCall[flipIndex]();
    flipIndex = (flipIndex + 1) % flipCall.length;
  }
  if (event.key == "ArrowRight") {
    t.signalChange.get("state")!("manual");
  }
});

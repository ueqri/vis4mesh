import { Controller } from "./controller/controller";
import { Grid } from "./display/layout/grid";
import { Display } from "./display/display";
import { Ticker } from "./controller/module/ticker";
import { Legend } from "./controller/module/legend";
import { LinearNormalize } from "./controller/module/normalize";
import { SmartSlider } from "./widget/standalone/smartslider";
import { RenderPlayerButton } from "./navbar/navbar";
import { DataPort } from "./data/dataport";

let divGraph = document.getElementById("graph") as HTMLElement;
let divSlider = document.getElementById("slider") as HTMLElement;
let inputStart = document.getElementById("start-time") as HTMLInputElement;
let inputEnd = document.getElementById("end-time") as HTMLInputElement;

let port = new DataPort("ws://127.0.0.1:8080/");

port.init((meta: Object) => {
  console.log(meta);

  let c = new Controller(port, new Display(divGraph, Grid));

  let slider = new SmartSlider(divSlider, Number(meta["elapse"]), [0, 1]);
  let ticker = new Ticker(slider);

  c.loadModules([ticker, new Legend(), new LinearNormalize()]);

  slider.bindInput(
    [inputStart, inputEnd],
    [
      (v) => ticker.signal.get("timeStart")!(v),
      (v) => ticker.signal.get("timeEnd")!(v),
    ]
  );

  let playerBtn = RenderPlayerButton(ticker);

  ticker.signal.get("state")!("still");

  //
  // Global Event
  //

  let flipCall = [
    function () {
      playerBtn.switch("Play");
    },
    function () {
      playerBtn.switch("Pause");
    },
  ];

  let flipIndex: number = 0;
  document.addEventListener("keydown", function (event) {
    if (event.key === " ") {
      flipCall[flipIndex]();
      flipIndex = (flipIndex + 1) % flipCall.length;
    }
  });
});

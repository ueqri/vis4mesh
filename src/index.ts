import { Controller } from "./controller/controller";
import { Grid } from "./display/layout/grid";
import { Display } from "./display/display";
import { Legend } from "./controller/module/legend";
import { LinearNormalize } from "./controller/module/normalize";
import { Ticker } from "./timebar/ticker";
import RenderPlayerButton from "./topbar/playerbutton";
import DataPort from "./data/dataport";
import { RenderTimebar } from "./timebar/timebar";
import { RenderFilterBar, FilterEventListener } from "./filterbar/filterbar";
let divGraph = document.getElementById("graph") as HTMLElement;

let port = new DataPort("ws://127.0.0.1:8080/");

let ticker = new Ticker();
let playerBtn = RenderPlayerButton(ticker);

port.init().then((meta) => {
  let c = new Controller(port, new Display(divGraph, Grid));
  c.loadModules([new Legend(), new LinearNormalize()]);
  ticker.bindController(c);
  ticker.signal["step"](1);
  ticker.setStatusChangeCallback((running) => {
    if (running) {
      playerBtn.static("Pause");
    } else {
      playerBtn.static("Play");
    }
  });
  c.requestDataPort();

  let filterEvents = new FilterEventListener();

  RenderTimebar(port, c, ticker, filterEvents);

  RenderFilterBar(filterEvents);
});

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
  if (event.key === "p") {
    flipCall[flipIndex]();
    flipIndex = (flipIndex + 1) % flipCall.length;
  }
});

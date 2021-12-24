import Controller from "./controller/controller";
import Grid from "./display/layout/grid";
import Display from "./display/display";
import Filter from "./controller/module/filter";
import LinearNormalize from "./controller/module/normalize";
import Ticker from "./timebar/ticker";
import DataPort from "./data/dataport";
import RenderPlayerButton from "./topbar/playerbutton";
import RenderAccordionSetting from "./topbar/setting";
import RenderTimebar from "./timebar/timebar";
import RenderFilterBar, { FilterEventListener } from "./filterbar/filterbar";

let divGraph = document.getElementById("graph") as HTMLElement;

let port = new DataPort("ws://127.0.0.1:8080/");

port.init().then((meta) => {
  console.log(meta);

  let ticker = new Ticker(+meta["elapse"]);
  let playerBtn = RenderPlayerButton(ticker);
  let filterEvents = new FilterEventListener(ticker);

  let c = new Controller(port, new Display(divGraph, Grid)).loadModules([
    new Filter(filterEvents),
    new LinearNormalize(),
  ]);

  ticker.bindController(c).setStatusChangeCallback((running) => {
    playerBtn.static(running ? "Pause" : "Play");
  });

  c.requestDataPort(); // render initial view

  RenderTimebar(port, c, ticker, filterEvents);

  RenderFilterBar(filterEvents);

  RenderAccordionSetting({ ticker: ticker });

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
});

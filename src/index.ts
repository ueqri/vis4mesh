import "../public/index.scss";
import Controller from "controller/controller";
import { Component, Module } from "global";

import { RenderTimebar } from "./timebar/timebar";
import { RenderFilterbar } from "./filterbar/filterbar";
import { RenderTopbar } from "topbar/topbar";

const port = Component.port;
port.init().then((meta) => {
  console.log(meta);

  let c = new Controller(port, Component.view).loadModules([
    Module.filterMsg,
    Module.normalize,
    Module.setTime,
  ]);

  Component.ticker.setMaxTime(+meta["elapse"]).bindController(c);

  c.requestDataPort(); // render initial view

  RenderTopbar();
  RenderTimebar();
  RenderFilterbar();
});

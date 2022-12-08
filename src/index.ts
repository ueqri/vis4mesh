import "../public/index.scss";
import Controller from "controller/controller";
import { Component, Module } from "global";

import { RenderTimebar } from "./timebar/timebar";
import { RenderFilterbar } from "./filterbar/filterbar";
import { RenderTopbar } from "topbar/topbar";
import button from "topbar/daisen";
import { MainView } from "./graph/graph";

import { supported } from "browser-fs-access";
const port = Component.port;

const chooseDirButton = document.querySelector("#open-directory-btn")!;

button;

if (supported) {
  console.log("Using the File System Access API.");
} else {
  console.log("Using the fallback implementation.");
}

chooseDirButton.addEventListener("click", async () => {
  try {
    const meta = await port.init();
    chooseDirButton.remove();

    console.log(meta);

    const graph = new MainView(meta["width"], meta["height"]);

    let c = new Controller(port, graph).loadModules([
      Module.filterMsg,
      Module.setTime,
    ]);

    Component.ticker.setMaxTime(+meta["elapse"]).bindController(c);

    // c.requestDataPort(); // render initial view

    RenderTopbar();
    RenderTimebar();
    RenderFilterbar();
  } catch (err) {
    console.error(err);
  }

});

import "../public/index.scss";
import Controller from "controller/controller";
import { Component, Element, Module } from "global";

import { RenderTimebar } from "./timebar/timebar";
import { RenderFilterbar } from "./filterbar/filterbar";
import { RenderTopbar } from "topbar/topbar";

import { supported } from "browser-fs-access";
import { daisen_button, register_daisen_insight } from "./topbar/daisen";
import { MainView } from "./graph/graph";

const port = Component.port;

const chooseDirButton = document.querySelector("#open-directory-btn")!;

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

    register_daisen_insight(daisen_button, graph);

    let c = new Controller(port, graph).loadModules([
      Module.filterMsg,
      Module.setTime,
    ]);

    Component.ticker.setMaxTime(+meta["elapse"]).bindController(c);

    // c.requestDataPort(); // render initial view

    RenderTopbar();
    RenderTimebar();
    RenderFilterbar();
    Element.filterbar.signal["num_hops_per_unit"](meta.hops_per_unit);
  } catch (err) {
    console.error(err);
  }
});

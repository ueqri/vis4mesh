import "../public/index.scss";
import Controller from "controller/controller";
import { Component, Module } from "global";

import { RenderTimebar } from "./timebar/timebar";
import { RenderFilterbar } from "./filterbar/filterbar";
import { RenderTopbar } from "topbar/topbar";

import { buildMeshInfo } from "./data/meshinfo";
import { directoryOpen } from "browser-fs-access";

const port = Component.port;

const chooseDirButton = document.querySelector("#Directory-Open")!;

chooseDirButton.addEventListener("click", async()=> {
  try {
    const dirEntries = await directoryOpen({recursive: true});
    port.meshInfo = await buildMeshInfo(dirEntries);
    const meta = Object(port.meshInfo.meta);
    console.log(meta);

    let c = new Controller(port, Component.view).loadModules([
      Module.filterMsg,
      Module.setTime,
    ]);

    Component.ticker.setMaxTime(+meta["elapse"]).bindController(c);

    c.requestDataPort(); // render initial view

    RenderTopbar();
    RenderTimebar();
    RenderFilterbar();
  } catch (err) {
    console.error(err);
  }
  
});

// port.init().then((meta) => {
//   console.log(meta);

//   let c = new Controller(port, Component.view).loadModules([
//     Module.filterMsg,
//     Module.setTime,
//   ]);

//   Component.ticker.setMaxTime(+meta["elapse"]).bindController(c);

//   c.requestDataPort(); // render initial view

//   RenderTopbar();
//   RenderTimebar();
//   RenderFilterbar();
// });
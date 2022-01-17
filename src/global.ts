import DataPort from "data/dataport";
import Ticker from "controller/ticker";
import Display from "display/display";
import Grid from "display/layout/grid";
import FilterMsg from "controller/module/filtermsg";
import LinearNormalize from "controller/module/normalize";
import SetTime from "controller/module/settime";
import Timebar from "timebar/timebar";
import Filterbar from "filterbar/filterbar";

const Component = {
  port: new DataPort("ws://127.0.0.1:8080/"),
  view: new Display(document.getElementById("graph")!, Grid),
  ticker: new Ticker(),
};

const Element = {
  timebar: new Timebar(),
  filterbar: new Filterbar(),
  topbar: "",
};

const Module = {
  filterMsg: new FilterMsg(),
  normalize: new LinearNormalize(),
  setTime: new SetTime(),
};

export { Component, Element, Module };

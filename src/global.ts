import DataPort from "data/dataport";
import Ticker from "controller/ticker";
import Display from "display/display";
import FilterMsg from "controller/module/filtermsg";
import SetTime from "controller/module/settime";
import Timebar from "timebar/timebar";
import Filterbar from "filterbar/filterbar";
import Layout from "./layout";

const Component = {
  port: new DataPort("ws://127.0.0.1:8080/"),
  view: new Display(),
  ticker: new Ticker(),
  layout: new Layout(),
};

const Element = {
  timebar: new Timebar(),
  filterbar: new Filterbar(),
  topbar: "",
};

const Module = {
  filterMsg: new FilterMsg(),
  setTime: new SetTime(),
};

export { Component, Element, Module };

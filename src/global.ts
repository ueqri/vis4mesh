import Ticker from "controller/ticker";
import Display from "display/display";
import FilterMsg from "controller/module/filtermsg";
import SetTime from "controller/module/settime";
import Timebar from "timebar/timebar";
import Filterbar from "filterbar/filterbar";
import Layout from "./layout";
import LocalPort from "./data/localport";
import { MainView } from './graph/graph';

const Component = {
  port: new LocalPort(),
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


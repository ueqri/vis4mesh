import * as d3 from "d3";

const ActiveSVG: string = require("../../public/icon/ok.svg");

export default function RenderDataPortStatus() {
  d3.select("#dataport-status-icon").attr("src", ActiveSVG);
}

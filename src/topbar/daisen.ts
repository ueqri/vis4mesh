import * as d3 from "d3";
import {DaisenLaunch} from "widget/daisen"

const button = d3.select("#launch-daisen");

button.on("click", () => {
  console.log("click launch daisen");

  const sidecanvas = d3.select("#sidecanvas").style("width", "80%");
  sidecanvas.selectAll("svg").remove();
  sidecanvas.selectAll("iframe").remove();

  const close = sidecanvas
    .append("svg")
    .attr("id", "fold-sidecanvas")
    .attr("width", 10)
    .attr("height", 10)
    .style("margin-left", "5px")
    .style("position", "absolute")
    .append("circle")
    .attr("r", 5)
    .attr("cx", 5)
    .attr("cy", 5)
    .style("fill", "white");

  close
    .on("click", () => {
      sidecanvas.style("width", "0%");
    })
    .on("mouseover", () => {
      close.style("fill", "red");
    })
    .on("mouseout", () => {
      close.style("fill", "white");
    });



  DaisenLaunch(sidecanvas);
});

export default button;

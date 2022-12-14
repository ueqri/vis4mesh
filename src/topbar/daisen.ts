import * as d3 from "d3";
import ClickInteraction from "../graph/interaction/click"
import { DaisenLaunch } from "widget/daisen";

const button = d3.select("#launch-daisen");

button.on("click", () => {
  console.log("click launch daisen");

  const navbar = d3.select("#navbar").select("div");
  navbar.select("#daisen-follow").remove();
  const sidecanvas = d3.select("#sidecanvas").style("width", "50%");
  sidecanvas.selectAll("svg").remove();
  sidecanvas.selectAll("a").remove();
  sidecanvas.selectAll("iframe").remove();

  const graph = d3.select("#graph");

  let unfollow_color = "grey";
  const follow_vis4mesh = navbar
    .insert("button", "#launch-daisen")
    .attr("id", "daisen-follow")
    .attr("class", "ms-auto btn btn-secondary")
    .style("background", unfollow_color)
    .text("Follow");
  
  let follow = false;

  follow_vis4mesh.on("click", ()=> {
    follow = !follow;
    let color = unfollow_color;
    if(follow) {
      color = "#90EE90";
      ClickInteraction.triggerDaisen = true;
    } else {
      ClickInteraction.triggerDaisen = false;
    }
    follow_vis4mesh.style("background", color);
  })

  const close = sidecanvas
    .append("a")
    .attr("id", "fold-sidecanvas")
    .attr("class", "close-btn")
    .style("left", 18)

  close
    .on("click", () => {
      sidecanvas.style("width", "0%");
      graph.style("right", "0%");
      button.style("opacity", 1);
      follow_vis4mesh.remove();
      ClickInteraction.triggerDaisen = false;
    })
    .on("mouseover", () => {
      close.style("fill", "red");
    })
    .on("mouseout", () => {
      close.style("fill", "white");
    });

  button.style("opacity", 0);

  DaisenLaunch(sidecanvas);
});

export default button;

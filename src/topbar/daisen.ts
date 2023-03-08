import * as d3 from "d3";
import ClickInteraction from "../graph/interaction/click";
import { DaisenLaunch, GetDaisenUrl } from "widget/daisen";
import { MainView } from "../graph/graph";

export const daisen_button = d3.select("#launch-daisen");

export function register_daisen_insight(btn: any, graph_controller: MainView) {
  btn.on("click", () => {
    if (GetDaisenUrl() === null) {
      window.alert("Please select one endpoint first.");
      return;
    }
    let addr = window.prompt("Daisen server address (default localhost:3001)");
    if (!addr) {
      addr = "localhost:3001";
    }
    console.log("click launch Daisen " + addr);

    const navbar = d3.select("#navbar").select("div");
    navbar.select("#daisen-follow").remove();
    const sidecanvas = d3.select("#sidecanvas").style("width", "50%");
    sidecanvas.selectAll("svg").remove();
    sidecanvas.selectAll("a").remove();
    sidecanvas.selectAll("iframe").remove();

    const graph = d3.select("#graph");

    let unfollow_color = "grey";
    const follow_vis4mesh = d3
      .select("#daisen-buttons")
      .insert("button", "#launch-daisen")
      .attr("id", "daisen-follow")
      .attr("class", "btn btn-secondary")
      .style("margin-right", "0px")
      .style("margin-left", "auto")
      .style("background", unfollow_color)
      .text("Sync");

    let sync = false;

    follow_vis4mesh.on("click", () => {
      sync = !sync;
      let color = unfollow_color;
      if (sync) {
        color = "#90EE90";
        ClickInteraction.triggerDaisen = true;
      } else {
        ClickInteraction.triggerDaisen = false;
      }

      follow_vis4mesh.style("background", color);
    });

    window.onmessage = (e) => {
      console.log(`>>> message from iframe: ${e.data}`);
      if (sync) {
        console.log(`>>> Daisen: move to ${e.data} in vis4mesh`);
        const position = e.data;
        let [x, y] = [-1, -1];
        const component = position.split(".")[1];
        const component_type = component.split("_")[0];
        if (component_type === "Tile") {
          const tile_pos = component.split("_")[1];
          [x, y] = tile_pos.strip("[").strip("]").split("][");
        } else if (component_type === "EP" || component_type == "SW") {
          x = eval(component.split("_")[1]);
          y = eval(component.split("_")[2]);
        } else {
          return;
        }
        // move to corresponding rect in vis4mesh
        console.log(`>>> Daisen: move to (${x}, ${y}) in vis4mesh`);
        graph_controller.bottom_layer_node_jump(x, y);
      }
    };

    const close = sidecanvas
      .append("a")
      .attr("id", "fold-sidecanvas")
      .attr("class", "close-btn")
      .style("left", 18);

    close
      .on("click", () => {
        sidecanvas.style("width", "0%");
        graph.style("right", "0%");
        follow_vis4mesh.remove();
        ClickInteraction.triggerDaisen = false;
        window.onmessage = null;
      })
      .on("mouseover", () => {
        close.style("fill", "red");
      })
      .on("mouseout", () => {
        close.style("fill", "white");
      });
    DaisenLaunch(sidecanvas, addr!);
  });
}

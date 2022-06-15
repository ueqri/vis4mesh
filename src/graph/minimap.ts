import * as d3 from "d3";
import { AbstractLayer } from "./abstractlayer";
import { ColorScheme } from "./graph";

interface block_tile {
  x: number;
  y: number;
  color: string;
}
export class Minimap {
  scale: number = 1024;
  offset_x: number = 0;
  offset_y: number = 0;
  wafer_width: number = 0;
  wafer_height: number = 0;
  ratio: number;

  constructor() {
    const graph = d3.select("#graph");
    const canvas_width = (graph.node() as SVGSVGElement).clientWidth;
    const canvas_height = (graph.node() as SVGSVGElement).clientHeight;
    this.ratio = canvas_width / canvas_height;
  }

  draw(tile_width: number, tile_height: number) {
    const canvas_height = 150;
    const canvas_width = canvas_height * this.ratio;

    d3.select("#minimap")
      .style("width", canvas_width)
      .style("height", canvas_height);

    const width_scale = canvas_width / tile_width;
    const height_scale = canvas_height / tile_height;
    this.scale = Math.min(width_scale, height_scale) * 0.9;

    this.offset_x = canvas_width / 2 - (tile_width / 2) * this.scale;
    this.offset_y = canvas_height / 2 - (tile_height / 2) * this.scale;
    this.wafer_height = tile_height * this.scale;
    this.wafer_width = tile_width * this.scale;

    const wafer_mini = d3.select("#minimap-blocks").append("rect");
    wafer_mini
      .attr("x", this.offset_x)
      .attr("y", this.offset_y)
      .attr("width", this.wafer_width)
      .attr("height", this.wafer_height)
      .attr("fill", "#599dbb")
      // .attr("stroke", "blue");
  }

  paint_wafer(layers: AbstractLayer[]) {
    let level = 0;
    for (let i = 0; i < layers.length; i++) {
      if (layers[i].width * layers[i].height < 5000) {
        level = i;
        break;
      }
    }
    const block_width = layers[level].width;
    const block_height = layers[level].height;
    const rect_width = this.wafer_width / layers[level].width;
    const rect_height = this.wafer_height / layers[level].height;
    let rects: block_tile[] = [];
    for (let i = 0; i < block_height; i++) {
      for (let j = 0; j < block_width; j++) {
        rects.push({
          x: this.offset_x + j * rect_width,
          y: this.offset_y + i * rect_height,
          color: ColorScheme(layers[level].nodes[i][j].level),
        });
      }
    }
    console.log("minimap: ", rects);
    d3.select("#minimap-blocks")
      .selectAll("rect")
      .data(rects)
      .join(
        (enter) => enter.append("rect"),
        (update) => update,
        (exit) => exit.remove()
      )
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("width", rect_width)
      .attr("height", rect_height)
      .attr("fill", (d) => d.color)
  }

  update_minimap_viewport_box(
    top: number,
    left: number,
    width: number,
    height: number
  ) {
    const viewport_box = d3.select("#minimap-viewport-box");

    viewport_box
      .attr("x", left * this.scale + this.offset_x)
      .attr("y", top * this.scale + this.offset_y)
      .attr("width", width * this.scale)
      .attr("height", height * this.scale)
      .attr("fill", "none")
      .attr("stroke", "green");
  }
}

let MiniMap = new Minimap();
export default MiniMap;

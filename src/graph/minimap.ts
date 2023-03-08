import * as d3 from "d3";
import { AbstractLayer } from "./abstractlayer";
import { ColorScheme } from "./util";
import { MainView } from "./graph";
import Event from "event";

interface block_tile {
  x: number;
  y: number;
  idx: number;
  idy: number;
  color: string;
}

interface line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
export default class Minimap {
  scale: number = 1024;
  offset_x: number = 0;
  offset_y: number = 0;
  wafer_width: number = 0;
  wafer_height: number = 0;
  bottom_height: number = 0;
  bottom_width: number = 0;
  ratio: number;
  mainview: MainView;
  pinMap: Map<string, d3.Selection<SVGUseElement, unknown, HTMLElement, any>>;
  readonly viewbox_center = d3.select("#minimap").append("g");

  constructor(mainview: MainView) {
    const graph = d3.select("#graph");
    const canvas_width = (graph.node() as SVGSVGElement).clientWidth;
    const canvas_height = (graph.node() as SVGSVGElement).clientHeight;
    this.ratio = canvas_width / canvas_height;
    this.mainview = mainview;
    this.pinMap = new Map();
    d3.select("#minimap")
      .append("svg:defs")
      .append("path")
      .attr("viewBox", "-16 -18 64 64")
      .attr("id", "minibar-pin")
      .attr("d", "M0,47 Q0,28 10,15 A15,15 0,1,0 -10,15 Q0,28 0,47")
      .attr("stroke-width", 1)
      .attr("stroke", "black");

    Event.AddStepListener("BirdViewSize", (h: number) => this.redraw(h));
  }

  save_tile_width: number = 0;
  save_tile_height: number = 0;

  redraw(canvas_height: number) {
    d3.select("#minimap-blocks").selectAll("rect").remove();
    this.draw(this.save_tile_width, this.save_tile_height, canvas_height);
    this.paint_wafer(this.save_abstract_layers);
    const [a, b, c, d] = this.save_viewport_box;
    this.update_minimap_viewport_box(a, b, c, d);
  }

  draw(tile_width: number, tile_height: number, canvas_height?: number) {
    this.save_tile_width = tile_width;
    this.save_tile_height = tile_height;

    if (typeof canvas_height == "undefined") {
      canvas_height = Math.floor(
        document.getElementById("graph")?.clientHeight! * 0.3
      );
    }
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
      .attr("fill", "#599dbb");
    // .attr("stroke", "blue");
  }

  AddPin([x, y]: [number, number], color: string, clickJump: () => any) {
    // TODO fix: [x, y] of bottom layer
    const off_x = this.offset_x + y * this.bottom_width;
    const off_y = this.offset_y + (x - 2) * this.bottom_height;
    const name = `minimap-${x}-${y}`;
    let pin = d3
      .select("#minimap-blocks")
      .append("use")
      .attr("id", name)
      .attr("xlink:href", "#minibar-pin")
      .attr("fill", color)
      .attr("transform", `translate(${off_x}, ${off_y}) scale(0.2)`)
      .on("click", clickJump)
      .on("mouseover", () => {
        d3.select("#minimap-blocks")
          .select("#" + name)
          .style("cursor", "pointer");
      })
      .on("mouseout", () => {
        d3.select("#minimap-blocks")
          .select("#" + name)
          .style("cursor", "default");
      });

    this.pinMap.set(`${x}-${y}`, pin);
  }

  RemovePin([x, y]: [number, number]) {
    let pin = this.pinMap.get(`${x}-${y}`);
    if (pin === undefined) {
      console.log("remove minimap pin failed: undefined pin");
      return;
    }
    pin.remove();
    this.pinMap.delete(`${x}-${y}`);
  }

  save_abstract_layers!: AbstractLayer[];
  paint_wafer(layers: AbstractLayer[]) {
    this.save_abstract_layers = layers; // for resizing

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
    this.bottom_height = this.wafer_height / layers[0].height;
    this.bottom_width = this.wafer_width / layers[0].width;
    let rects: block_tile[] = [];
    for (let i = 0; i < block_height; i++) {
      for (let j = 0; j < block_width; j++) {
        rects.push({
          x: this.offset_x + j * rect_width,
          y: this.offset_y + i * rect_height,
          idx: i,
          idy: j,
          color: ColorScheme(layers[level].nodes[i][j].level),
        });
      }
    }
    // console.log("minimap: ", rects);
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
      .on("click", (ev, d) => {
        this.mainview.click_minimap_jump(d.idy + 0.5, d.idx + 0.5, 1000);
      });
  }

  save_viewport_box!: number[];
  update_minimap_viewport_box(
    top: number,
    left: number,
    width: number,
    height: number
  ) {
    this.save_viewport_box = [top, left, width, height]; // for resizing

    const viewport_box = d3.select("#minimap-viewport-box");

    const viewport_x = left * this.scale + this.offset_x;
    const viewport_y = top * this.scale + this.offset_y;
    const viewport_width = width * this.scale;
    const viewport_height = height * this.scale;
    viewport_box
      .attr("x", viewport_x)
      .attr("y", viewport_y)
      .attr("width", viewport_width)
      .attr("height", viewport_height)
      .attr("fill", "none")
      .attr("opacity", 0.5)
      .attr("stroke-width", 2)
      .attr("stroke", "black");

    const center_x = viewport_x + viewport_width / 2;
    const center_y = viewport_y + viewport_height / 2;
    const line_length = Math.min(viewport_width, viewport_height) * 0.2;
    2;
    const center_lines = [
      {
        x1: center_x - line_length / 2,
        y1: center_y,
        x2: center_x + line_length / 2,
        y2: center_y,
      },
      {
        x1: center_x,
        y1: center_y - line_length / 2,
        x2: center_x,
        y2: center_y + line_length / 2,
      },
    ];

    this.viewbox_center
      .selectAll<SVGSVGElement, line>("line")
      .data<line>(center_lines, (d, i) => `${i}`)
      .join(
        (enter) => enter.append("line"),
        (update) => update,
        (exit) => exit
      )
      .attr("x1", (d) => d.x1)
      .attr("y1", (d) => d.y1)
      .attr("x2", (d) => d.x2)
      .attr("y2", (d) => d.y2)
      .attr("stroke-width", 1.5)
      .attr("stroke", "black")
      .attr("opacity", 0.5);
  }
}

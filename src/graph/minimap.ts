class Minimap {
  scale: number = 1024;
  offset_x: number = 0;
  offset_y: number = 0;
  ratio: number;

  constructor() {
    const canvas = d3.select<SVGSVGElement, unknown>("#canvas");
    const canvas_width = canvas.node()!.clientWidth;
    const canvas_height = canvas.node()!.clientHeight;
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

    const wafer_mini = d3.select("#wafer-mini");
    wafer_mini
      .attr("x", this.offset_x)
      .attr("y", this.offset_y)
      .attr("width", tile_width * this.scale)
      .attr("height", tile_height * this.scale)
      .attr("fill", "white")
      .attr("stroke", "blue");
  }

  // with bugs
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
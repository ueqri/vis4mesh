import * as d3 from "d3";
import { AbstractLayer } from "./abstractlayer";
import { CompressBigNumber } from "controller/module/filtermsg";
import EdgeTrafficCheckboxes from "filterbar/edgecheckbox";
import Event from "event";
import MiniMap from "./minimap";
import { Render } from "./render";
import {
  RectNode,
  LineLink,
  LinkText,
  ClientSize,
  ZoomWindowSize,
  SubDisplaySize,
} from "./common";
import {
  ReverseMapping,
  ColorScheme,
  DirectionOffset,
  GetRectIdentity,
  GetLineIdentity,
} from "./util";

export class MainView {
  render: Render;
  dataLoaded: boolean = false;
  windowWidth: number = 0;
  windowHeight: number = 0;
  tile_width: number;
  tile_height: number;
  primary_width: number;
  primary_height: number;
  max_scale: number = 0;
  level: number = 0;
  scale: number = 0; // abstract node, size: scale*scale
  min_x: number = 0;
  max_x: number = 0;
  min_y: number = 0;
  max_y: number = 0;
  primary_nodes: RectNode[] = [];
  sub_nodes: RectNode[] = [];
  links: LineLink[] = [];
  layers: AbstractLayer[] = [];
  checkedColors: boolean[] = [];
  transform_scale: number = 0; // abstract node, size of scale*scale
  rect_size: number = 0; // reassign each time by this.draw()
  readonly node_size_ratio = 0.6;
  readonly client_size: ClientSize = {
    width: d3.select<SVGSVGElement, unknown>("#graph").node()!.clientWidth,
    height: d3.select<SVGSVGElement, unknown>("#graph").node()!.clientHeight,
  };
  readonly rectColorMap = new Map<string, string>();
  readonly lineWidthMap = new Map<string, number>();

  constructor(tile_width: number, tile_height: number) {
    this.tile_width = tile_width;
    this.tile_height = tile_height;
    this.primary_width = tile_width;
    this.primary_height = tile_height;
    console.log(this.client_size);
    this.render = new Render(this);
    this.initialize_zoom();
    MiniMap.draw(tile_width, tile_height);
    Event.AddStepListener("FilterETCheckbox", (levels: number[]) => {
      this.loadcheckedColors(levels);
    });
  }

  loadAbstractLayers(layers: AbstractLayer[]) {
    this.dataLoaded = true;
    this.layers = layers;
    // PERFORMANCE: a better way to repaint the nodes and links?
    this.primary_nodes = this.get_primary_nodes();
    this.sub_nodes = this.get_sub_nodes(this.primary_nodes);
    this.links = this.get_links(this.primary_nodes);
    EdgeTrafficCheckboxes.applyUpperBound(this.layers[this.level].uppers);
    this.draw();
    MiniMap.paint_wafer(layers);
  }

  loadcheckedColors(levels: number[]) {
    console.log(levels);
    this.checkedColors.fill(false);
    levels.forEach((lv) => (this.checkedColors[lv] = true));
    this.filterLinks();
    this.draw();
  }

  filterLinks() {
    for (let link of this.links) {
      link.opacity =
        link.value != 0 && this.checkedColors[link.level] === true ? 1 : 0;
    }
  }

  // center based, each center is (i, j) + (scale/2, scale/2)
  within_view(i_height: number, j_width: number): boolean {
    let center_y = i_height * this.scale + this.scale / 2;
    let center_x = j_width * this.scale + this.scale / 2;
    let top = center_y - this.rect_size / 2;
    let bottom = top + this.rect_size;
    let left = center_x - this.rect_size / 2;
    let right = left + this.rect_size;
    return (
      bottom >= this.min_y &&
      top <= this.max_y &&
      right >= this.min_x &&
      left <= this.max_x
    );
  }

  valid_link(x: number, y: number) {
    return x >= 0 && x <= this.tile_width && y >= 0 && y <= this.tile_height;
  }

  nodeXYToID(x: number, y: number) {
    return x * this.primary_width + y;
  }

  // reassign this.rect_size to suit the window before draw
  get_rect_size() {
    this.rect_size = this.scale * this.node_size_ratio;
  }

  register_rect_color(rect: RectNode, color?: string) {
    let rect_name = GetRectIdentity(rect);
    if (color === undefined) {
      this.rectColorMap.delete(rect_name);
    } else {
      this.rectColorMap.set(rect_name, color);
    }
  }

  register_line_width(line: LineLink, width?: number) {
    let line_name = GetLineIdentity(line);
    if (width === undefined) {
      this.lineWidthMap.delete(line_name);
    } else {
      this.lineWidthMap.set(line_name, width);
    }
  }

  color_node_by_map(node: RectNode) {
    let node_identity = GetRectIdentity(node);
    if (this.rectColorMap.has(node_identity)) {
      node.color = this.rectColorMap.get(node_identity)!;
    }
  }

  width_link_by_map(link: LineLink) {
    let link_identity = GetLineIdentity(link);
    if (this.rectColorMap.has(link_identity)) {
      link.width = this.lineWidthMap.get(link_identity)!;
    }
  }

  pin_node_on_graph() {}

  pin_link_on_graph() {}

  get_primary_nodes() {
    let primary_nodes = [];
    let height = this.tile_height / this.scale;
    let width = this.tile_width / this.scale;
    let top = height;
    let bottom = 0;
    let left = width;
    let right = 0;
    // get the rim of wafer nodes within the viewport
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (this.within_view(i, j)) {
          top = Math.min(top, i);
          bottom = Math.max(bottom, i);
          left = Math.min(left, j);
          right = Math.max(right, j);
        }
      }
    }
    // render perimeter
    if (top > 0) top = top - 1;
    if (bottom + 1 < height) bottom = bottom + 1;
    if (left > 0) left = left - 1;
    if (right + 1 < width) right = right + 1;
    for (let i = top; i <= bottom; i++) {
      for (let j = left; j <= right; j++) {
        let node = {
          scale: this.scale,
          idx: i,
          idy: j,
          level: this.level,
          x: j * this.scale + this.scale / 2 - this.rect_size / 2,
          y: i * this.scale + this.scale / 2 - this.rect_size / 2,
          size: this.rect_size,
          color: this.dataLoaded
            ? ColorScheme(this.layers[this.level].nodes[i][j].level)
            : "#8fbed1",
        };
        this.color_node_by_map(node);
        primary_nodes.push(node);
      }
    }

    return primary_nodes;
  }

  get_sub_nodes(primary_nodes: RectNode[]) {
    let draw_subrect =
      this.scale * this.node_size_ratio * this.transform_scale >
        SubDisplaySize && this.scale >= 4;

    if (!draw_subrect) {
      return [];
    }
    let sub_nodes = [];

    let sub_scale = this.scale / 4;
    let sub_cord_size = sub_scale * this.node_size_ratio;
    let sub_rect_size = sub_cord_size * this.node_size_ratio;

    for (let node of primary_nodes) {
      let base_idx = node.idx * 4;
      let base_idy = node.idy * 4;
      let basepos_x = base_idy * sub_scale + 0.2 * this.scale;
      let basepos_y = base_idx * sub_scale + 0.2 * this.scale;
      for (let i = base_idy; i < base_idy + 4; i++) {
        for (let j = base_idx; j < base_idx + 4; j++) {
          let node = {
            scale: sub_scale,
            idx: j,
            idy: i,
            level: this.level - 1,
            size: sub_rect_size,
            x: basepos_x + 0.2 * sub_cord_size + (i - base_idy) * sub_cord_size,
            y: basepos_y + 0.2 * sub_cord_size + (j - base_idx) * sub_cord_size,
            color: this.dataLoaded
              ? ColorScheme(this.layers[this.level - 1].nodes[j][i].level)
              : "#8fbed1",
          };
          this.color_node_by_map(node);
          sub_nodes.push(node);
        }
      }
      // OPTION: if sub layer is displayed, unset the color of primary layer
      node.color = "#8fbed1";
    }

    return sub_nodes;
  }

  get_links(nodes: RectNode[]) {
    let links: LineLink[] = [];
    if (nodes.length === 0) {
      return [];
    }
    let half_size = nodes[0].size / 2;
    let link_length = (1 - this.node_size_ratio) * nodes[0].scale;
    let link_width = 0.1 * nodes[0].size;
    let dash = [link_length * 0.15, link_length * 0.1];
    let offset = 0.1 * nodes[0].size;
    let directionX = [0, 0, 1, -1];
    let directionY = [1, -1, 0, 0]; // S N E W
    for (let node of nodes) {
      let center = {
        x: node.x + half_size,
        y: node.y + half_size,
      };
      for (let i = 0; i < 4; i++) {
        let nx = center.x + half_size * directionX[i] + directionY[i] * offset;
        let ny = center.y + half_size * directionY[i] + directionX[i] * offset;
        let endX = nx + link_length * directionX[i];
        let endY = ny + link_length * directionY[i];
        if (this.valid_link(endX, endY)) {
          let link = {
            start: node,
            connection: [
              this.nodeXYToID(node.idx, node.idy),
              this.nodeXYToID(
                node.idx + directionY[i],
                node.idy + directionX[i]
              ),
            ],
            idx: node.idx,
            idy: node.idy,
            level: this.level,
            x1: nx,
            y1: ny,
            x2: nx + link_length * directionX[i],
            y2: ny + link_length * directionY[i],
            width: link_width,
            value: this.dataLoaded
              ? this.layers[this.level].nodes[node.idx][node.idy].edgeData[i]
              : 0,
            dasharray: Boolean(i & 1) ? "5, 0" : `${dash[0]}, ${dash[1]}`,
            direction: i,
            colorLevel: this.dataLoaded
              ? this.layers[this.level].nodes[node.idx][node.idy].edgeLevel[i]
              : 0,
            opacity: 1,
          };
          link.opacity =
            link.value != 0 && this.checkedColors[link.colorLevel] === true
              ? 1
              : 0;
          this.width_link_by_map(link);
          links.push(link);
        }
      }
    }
    return links;
  }

  get_text(links: LineLink[]) {
    let offsetText_1 = this.rect_size * 0.1;
    let offsetText_2 = this.rect_size * 0.2;
    let offsetText_3 = this.rect_size * 0.3;
    let sum = 0;
    let texts: LinkText[] = [];
    for (let link of links) {
      let posX: number;
      let posY: number;
      switch (link.direction) {
        case 0: {
          // South
          posX = link.x1 + offsetText_2;
          posY = (link.y1 + link.y2) / 2;
          sum = this.layers[this.level].nodes[link.idx][link.idy].edgeData[0];
          break;
        }
        case 1: {
          // North
          posX = link.x1 - offsetText_2;
          posY = (link.y1 + link.y2) / 2;
          sum = this.layers[this.level].nodes[link.idx][link.idy].edgeData[1];
          break;
        }
        case 2: {
          // East
          posX = (link.x1 + link.x2) / 2;
          posY = link.y1 + offsetText_1;
          sum = this.layers[this.level].nodes[link.idx][link.idy].edgeData[2];
          break;
        }
        case 3: {
          // West
          posX = (link.x1 + link.x2) / 2;
          posY = link.y1 - offsetText_2;
          sum = this.layers[this.level].nodes[link.idx][link.idy].edgeData[3];
          break;
        }
      }
      texts.push({
        x: posX!,
        y: posY!,
        label: sum === 0 ? "" : CompressBigNumber(sum),
        opacity: link.opacity,
      });
    }
    return texts;
  }

  draw() {
    this.render.draw_rect(this.primary_nodes.concat(this.sub_nodes));
    this.render.draw_line(this.links);
    if (this.dataLoaded) {
      let texts = this.get_text(this.links);
      this.render.draw_text(texts, this.rect_size);
    }
  }

  initial_transform_param(): [number[], number] {
    const scale_x = this.client_size.width / this.tile_width;
    const scale_y = this.client_size.height / this.tile_height;
    const scale = Math.min(scale_x, scale_y) * 0.9;

    const translate_x =
      this.client_size.width / 2 - (this.tile_width / 2) * scale;
    const translate_y =
      this.client_size.height / 2 - (this.tile_height / 2) * scale;

    return [[translate_x, translate_y], scale];
  }

  initialize_zoom() {
    const graph = d3.select<SVGSVGElement, unknown>("#graph");
    this.windowHeight = graph.node()!.clientHeight;
    this.windowWidth = graph.node()!.clientWidth;

    const [initial_translate, initial_scale] = this.initial_transform_param();
    console.log(initial_translate, initial_scale);
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([initial_scale, 1024]);

    graph
      .call(
        zoomBehavior.on("zoom", (e) => {
          this.update_zoom(e.transform);
          console.log(e.transform);
        })
      )
      .call(
        zoomBehavior.transform,
        d3.zoomIdentity
          .translate(initial_translate[0], initial_translate[1])
          .scale(initial_scale)
      );
  }

  view_jump(ev: any, k: number, x: number, y: number) {
    console.log("click node jump");
    const [initial_translate, initial_scale] = this.initial_transform_param();

    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([initial_scale, 1024]);

    const graph = d3.select<SVGSVGElement, unknown>("#graph");

    graph
      .call(
        zoomBehavior.on("zoom", (e) => {
          this.update_zoom(e.transform);
          // console.log(e.transform);
        })
      )
      // .transition()
      // .duration(500)
      // .call(
      //   zoomBehavior.transform,
      //   d3.zoomIdentity
      //     .translate(initial_translate[0], initial_translate[1])
      //     .scale(initial_scale)
      // )
      .transition()
      .duration(500)
      .call(
        zoomBehavior.transform,
        d3.zoomIdentity
          .translate(this.windowWidth / 2, this.windowHeight / 2)
          .scale(k)
          .translate(x, y),
        d3.pointer(ev)
      );
  }

  click_node_jump(event: any, node: RectNode) {
    this.view_jump(
      event,
      (10 * this.tile_width) / node.scale,
      -(node.idy * node.scale + node.scale / 2),
      -(node.idx * node.scale + node.scale / 2)
    );
  }

  click_edge_jump(event: any, edge: LineLink) {
    const node = edge.start;
    const k = (10 * this.tile_width) / node.scale;
    const x = node.idy * node.scale + node.scale / 2;
    const y = node.idx * node.scale + node.scale / 2;
    let [mx, my] = DirectionOffset([x, y], edge.direction, node.scale / 2);
    this.view_jump(event, k, -mx, -my);
  }

  update_zoom(transform: d3.ZoomTransform) {
    this.transform_scale = transform.k;

    this.render.Transform(transform.toString());
    // console.log("zoom ", transform.toString());

    // console.log(this.windowWidth, this.windowHeight);
    const top_left = ReverseMapping([0, 0], transform);
    const bottom_right = ReverseMapping(
      [this.windowWidth, this.windowHeight],
      transform
    );
    const viewport_width = bottom_right[0] - top_left[0];
    const viewport_height = bottom_right[1] - top_left[1];

    this.min_x = top_left[0];
    this.max_x = bottom_right[0];
    this.min_y = top_left[1];
    this.max_y = bottom_right[1];

    MiniMap.update_minimap_viewport_box(
      top_left[1],
      top_left[0],
      viewport_width,
      viewport_height
    );
    this.update_semantic_zoom(viewport_width, viewport_height);
  }

  update_semantic_zoom(width: number, height: number) {
    let count = width * height;
    this.scale = 1;
    this.level = 0;
    while (count > ZoomWindowSize) {
      count /= 16;
      this.scale *= 4;
      this.level++;
    }
    d3.select("#nodesize").select("text").remove();
    d3.select("#nodesize")
      .append("text")
      .attr("dy", ".35em")
      .text(`${this.scale}X${this.scale}`)
      .attr("font-size", 15);
    if (this.dataLoaded) {
      // draw traffic chose box
      EdgeTrafficCheckboxes.applyUpperBound(this.layers[this.level].uppers);
    }
    this.primary_width = this.tile_width / this.scale;
    this.primary_height = this.tile_height / this.scale;
    this.max_scale = Math.max(this.max_scale, this.scale);
    // console.log(this.scale);
    this.get_rect_size(); // get rectangle size
    this.primary_nodes = this.get_primary_nodes();
    this.links = this.get_links(this.primary_nodes);
    this.sub_nodes = this.get_sub_nodes(this.primary_nodes);

    this.draw();
  }
}


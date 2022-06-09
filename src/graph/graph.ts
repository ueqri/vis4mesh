import * as d3 from "d3";
import { AbstractLayer } from "./abstractlayer";
import { CompressBigNumber } from "controller/module/filtermsg";
import TooltipInteraction from "display/interaction/tooltip";
import MiniMap from "./minimap";
import Event from "event";
const ZoomWindowSize = 50;
const SubDisplaySize = 200;

const RectCornerRadius = 0.05;

interface RectNode {
  scale: number;
  idx: number;
  idy: number;
  size: number;
  x: number;
  y: number;
}

interface LineLink {
  connection: number[];
  idx: number;
  idy: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  value: number;
  dasharray: string;
  direction: number;
  level: number;
  opacity: number;
}

interface LinkText {
  x: number;
  y: number;
  label: string;
  opacity: number;
}

interface ClientSize {
  width: number;
  height: number;
}

function ReverseMapping(
  coord: number[],
  transform: d3.ZoomTransform
): number[] {
  const scale = transform.k;
  const translate_x = transform.x;
  const translate_y = transform.y;

  const x_ = (coord[0] - translate_x) / scale;
  const y_ = (coord[1] - translate_y) / scale;

  return [x_, y_];
}

const arrowWidth = 5 / 3.8;
export class MainView {
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
  readonly grid = d3.select("#graph").append("svg").append("g");
  readonly client_size: ClientSize = {
    width: d3.select<SVGSVGElement, unknown>("#graph").node()!.clientWidth,
    height: d3.select<SVGSVGElement, unknown>("#graph").node()!.clientHeight,
  };

  constructor(tile_width: number, tile_height: number) {
    this.tile_width = tile_width;
    this.tile_height = tile_height;
    this.primary_width = tile_width;
    this.primary_height = tile_height;
    console.log(this.client_size);
    this.initialize_zoom();
    MiniMap.draw(tile_width, tile_height);
    Event.AddStepListener("FilterETCheckbox", (levels: number[]) => {
      this.loadcheckedColors(levels);
    });
    this.grid
      .append("svg:defs")
      .selectAll("marker")
      .data(["end"]) // different link/path types can be defined here
      .enter()
      .append("svg:marker") // this section adds in the arrows
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", arrowWidth * 5.5)
      .attr("refY", 0)
      .attr("markerWidth", arrowWidth)
      .attr("markerHeight", arrowWidth)
      .attr("orient", "auto")
      .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5");
  }

  loadAbstractLayers(layers: AbstractLayer[]) {
    this.dataLoaded = true;
    this.layers = layers;
    this.links = this.get_links(this.primary_nodes);
    this.draw();
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

  get_primary_nodes() {
    let primary_nodes = [];
    let height = this.tile_height / this.scale;
    let width = this.tile_width / this.scale;
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (this.within_view(i, j)) {
          primary_nodes.push({
            scale: this.scale,
            idx: j,
            idy: i,
            x: j * this.scale + this.scale / 2 - this.rect_size / 2,
            y: i * this.scale + this.scale / 2 - this.rect_size / 2,
            size: this.rect_size,
          });
        }
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
      let base_x = base_idx * sub_scale + 0.2 * this.scale;
      let base_y = base_idy * sub_scale + 0.2 * this.scale;
      for (let i = base_idy; i < base_idy + 4; i++) {
        for (let j = base_idx; j < base_idx + 4; j++) {
          sub_nodes.push({
            scale: sub_scale,
            idx: j,
            idy: i,
            size: sub_rect_size,
            x: base_x + 0.2 * sub_cord_size + (j - base_idx) * sub_cord_size,
            y: base_y + 0.2 * sub_cord_size + (i - base_idy) * sub_cord_size,
          });
        }
      }
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
            connection: [
              this.nodeXYToID(node.idx, node.idy),
              this.nodeXYToID(
                node.idx + directionX[i],
                node.idy + directionY[i]
              ),
            ],
            idx: node.idx,
            idy: node.idy,
            x1: nx,
            y1: ny,
            x2: nx + link_length * directionX[i],
            y2: ny + link_length * directionY[i],
            width: link_width,
            value: this.dataLoaded
              ? this.layers[this.level].nodes[node.idx][node.idy].data[i]
              : 0,
            dasharray: Boolean(i & 1) ? "5, 0" : `${dash[0]}, ${dash[1]}`,
            direction: i,
            level: this.dataLoaded
              ? this.layers[this.level].nodes[node.idx][node.idy].level[i]
              : 0,
            opacity: 1,
          };
          link.opacity =
            link.value != 0 && this.checkedColors[link.level] === true ? 1 : 0;
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
          sum = this.layers[this.level].nodes[link.idx][link.idy].data[0];
          break;
        }
        case 1: {
          // North
          posX = link.x1 - offsetText_3;
          posY = (link.y1 + link.y2) / 2;
          sum = this.layers[this.level].nodes[link.idx][link.idy].data[1];
          break;
        }
        case 2: {
          // East
          posX = (link.x1 + link.x2) / 2;
          posY = link.y1 + offsetText_1;
          sum = this.layers[this.level].nodes[link.idx][link.idy].data[2];
          break;
        }
        case 3: {
          // West
          posX = (link.x1 + link.x2) / 2;
          posY = link.y1 - offsetText_2;
          sum = this.layers[this.level].nodes[link.idx][link.idy].data[3];
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

  draw_rect(nodes: RectNode[]) {
    this.grid
      .selectAll<SVGSVGElement, RectNode>("rect")
      .data<RectNode>(nodes, (d) => `${d.scale}, ${d.idx}, ${d.idy}`)
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("x", (d) => d.x)
            .attr("y", (d) => d.y)
            .attr("rx", (d) => RectCornerRadius * d.size)
            .attr("ry", (d) => RectCornerRadius * d.size)
            .attr("width", (d) => d.size)
            .attr("height", (d) => d.size)
            .attr("fill", "#8fbed1")
            .attr("stroke", "#599dbb")
            .attr("stroke-width", (d) => d.scale * 0.02),
        (update) =>
          update
            .transition()
            .duration(500)
            .attr("x", (d) => d.x)
            .attr("y", (d) => d.y)
            .attr("rx", (d) => RectCornerRadius * d.size)
            .attr("ry", (d) => RectCornerRadius * d.size)
            .attr("width", (d) => d.size)
            .attr("height", (d) => d.size)
            .attr("fill", "#8fbed1")
            .attr("stroke", "#599dbb")
            .attr("stroke-width", (d) => d.scale * 0.02),
        (exit) => exit.remove()
      )
      .on("mouseover", function (ev, d) {
        const sel = d3.select(this);
        sel.attr("fill", "#599dbb");
        sel.style("cursor", "pointer");
        // TooltipInteraction.onNode(nodeMap[d.id]);
      })
      .on("mousemove", function (ev) {
        TooltipInteraction.move([ev.pageX, ev.pageY]);
      })
      .on("mouseout", function (ev, d) {
        const sel = d3.select(this);
        if (sel.property("checked") !== true) {
          sel.attr("fill", "#8fbed1");
          sel.style("cursor", "default");
        }
        TooltipInteraction.hide();
      })
      .on("click", function (ev, d) {
        const sel = d3.select(this);
        // ClickInteraction.onNode(
        //   nodeMap[d.id],
        //   () => {
        //     sel.attr("fill", d.stroke);
        //     sel.property("checked", true);
        //   },
        //   () => {
        //     sel.attr("fill", d.fill);
        //     sel.property("checked", false);
        //   }
        // );
        ev.stopPropagation();
      });
  }

  draw_line(lines: LineLink[]) {
    this.grid
      .selectAll("line")
      .data(lines)
      .join(
        function (enter) {
          return enter.append("line").attr("marker-end", "url(#end)");
        },
        function (update) {
          return update;
        },
        function (exit) {
          return exit.remove();
        }
      )
      .attr("x1", (d) => d.x1)
      .attr("x2", (d) => d.x2)
      .attr("y1", (d) => d.y1)
      .attr("y2", (d) => d.y2)
      .attr("opacity", (d) => d.opacity)
      .attr("stroke-dasharray", (d) => d.dasharray)
      .attr("stroke-width", (d) => d.width)
      .attr("stroke", (d) => ColorScheme(d.level))
      .on("mouseover", function (ev, d) {
        const sel = d3.select(this);
        sel.attr("stroke-width", d.width * 1.5);
        sel.style("cursor", "pointer");
        const [src, dst] = d.connection;
        // TooltipInteraction.onEdge([nodeMap[src], nodeMap[dst]]);
      })
      .on("mousemove", function (ev) {
        TooltipInteraction.move([ev.pageX, ev.pageY]);
      })
      .on("mouseout", function (ev, d) {
        const sel = d3.select(this);
        if (sel.property("checked") !== true) {
          sel.attr("stroke-width", d.width);
          sel.style("cursor", "default");
        }
        TooltipInteraction.hide();
      })
      .on("click", function (ev, d) {
        const sel = d3.select(this);
        const [src, dst] = d.connection;

        // ClickInteraction.onEdge(
        //   [nodeMap[src], nodeMap[dst]],
        //   () => {
        //     sel.attr("stroke-width", d.width * 1.5);
        //     sel.property("checked", true);
        //   },
        //   () => {
        //     sel.attr("stroke-width", d.width);
        //     sel.property("checked", false);
        //   }
        // );
        ev.stopPropagation();
      });
  }

  draw_text(texts: LinkText[]) {
    let fontsize = this.rect_size * 0.2;
    this.grid
      .selectAll(".edge-label")
      .data(texts)
      .join(
        function (enter) {
          return enter
            .append("text")
            .attr("class", "edge-label")
            .attr("dy", ".35em")
            .attr("dominant-baseline", "middle");
        },
        function (update) {
          return update;
        },
        function (exit) {
          return exit.remove();
        }
      )
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("opacity", (d) => d.opacity)
      .text((d) => d.label)
      .style("font-size", fontsize)
      .raise();
  }

  draw() {
    this.draw_rect(this.primary_nodes.concat(this.sub_nodes));
    this.draw_line(this.links);
    if (this.dataLoaded) {
      let texts = this.get_text(this.links);
      this.draw_text(texts);
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

  update_zoom(transform: d3.ZoomTransform) {
    this.transform_scale = transform.k;

    this.grid.attr("transform", transform.toString());

    console.log(this.windowWidth, this.windowHeight);
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
    if (this.dataLoaded) {
      // draw traffic chose box
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

export function ColorScheme(lv: number): string {
  // [0, 9] maps Blue-Yellow-Red color platte
  return d3.interpolateRdYlBu((9 - lv) / 9);
}

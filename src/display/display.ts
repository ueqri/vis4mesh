import { PackNodes, UnpackNode, ReestablishLinks } from "display/abstractnode";
import AbstractNode from "display/abstractnode";
import { DataToDisplay, NodeDisplay } from "./data";
import RenderEngine from "./engine/engine";
import SideCanvas from "./interaction/sidecanvas";
import ClickInteraction from "./interaction/click";
import * as d3 from "d3";

const div = d3.select("#graph").on("click", () => ClickInteraction.back());

export default class Display {
  prev!: DataToDisplay;
  constructor() {}

  renderData(data: DataToDisplay) {
    // Init RenderEngine
    const sizeX: number = data.meta!["width"];
    const sizeY: number = data.meta!["height"];
    if (sizeX !== sizeY) {
      console.error("Mesh must have the same height and weight so far");
    }
    RenderEngine.resize(sizeX);
    // Generate and display the SVG
    div.append(() => GenerateSVG(data));
    // Store data for further use to avoid redundant DataPort request
    this.prev = data;
    SideCanvas.load();
  }
}

function GenerateSVG(data: DataToDisplay) {
  // Prepare AbstractNode
  let nodeMap: { [id: number]: AbstractNode } = {};
  data.nodes!.forEach((node) => {
    const id = Number(node.id); // assume `id: string` is numeric
    nodeMap[id] = GenerateAbstractNode(node);
  });
  data.edges!.forEach((edge) => {
    const src = Number(edge.source);
    const dst = Number(edge.target);
    nodeMap[src].AppendBaseLink({
      dst: dst,
      weight: edge.weight === undefined ? 0 : edge.weight,
      label: edge.label === undefined ? "" : edge.label,
    });
  });
  Object.values(nodeMap).forEach((d) => d.CloneBaseLink());

  // Pack nodes, tested example:
  // PackNodesWithIDs(nodeMap, [13, 21, 14, 15, 22, 23]);
  // PackNodesWithIDs(nodeMap, [29, 30, 31]);
  GenerateBlockLists(4, 8).forEach((blk) => {
    PackNodesWithIDs(nodeMap, blk);
  });

  // UnpackNodeWithID(nodeMap, 13);

  // Turn on RenderEngine
  RenderEngine.join(Object.values(nodeMap));
  return RenderEngine.node();
}
function GenerateAbstractNode(node: NodeDisplay): AbstractNode {
  return new AbstractNode(Number(node.id), node.label!);
}

function PackNodesWithIDs(
  nodeMap: { [id: number]: AbstractNode },
  ids: number[]
) {
  // Pack nodes
  let nodes = new Array<AbstractNode>();
  ids.forEach((id) => {
    nodes.push(nodeMap[id]);
    delete nodeMap[id];
  });
  let g = PackNodes(nodes);
  nodeMap[g.id] = g;
  ReestablishLinks(Object.values(nodeMap));
}

function UnpackNodeWithID(nodeMap: { [id: number]: AbstractNode }, id: number) {
  let target = nodeMap[id];
  delete nodeMap[id];
  UnpackNode(target).forEach((d) => (nodeMap[d.id] = d));
  ReestablishLinks(Object.values(nodeMap));
}

function GenerateBlockLists(
  blockDim: number,
  gridDim: number
): Array<Array<number>> {
  let grid = new Array<Array<number>>();
  const blockRowSize = blockDim * gridDim;
  const dim = gridDim / blockDim;
  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) {
      const leftTopID = i * blockRowSize + j * blockDim;
      grid.push(GenerateSingleBlockByLeftTopID(leftTopID, blockDim, gridDim));
    }
  }
  return grid;
}

function GenerateSingleBlockByLeftTopID(
  id: number,
  blockDim: number,
  gridDim: number
): number[] {
  let block = new Array<number>();
  for (let i = 0; i < blockDim; i++) {
    const rowBegin = id + i * gridDim;
    for (let j = 0; j < blockDim; j++) {
      block.push(rowBegin + j);
    }
  }
  return block;
}

function CenterSVGGroupElement() {
  let rootSize = (div.select("svg").node() as Element).getBoundingClientRect();
  let groupSize = (div.select("g").node() as Element).getBoundingClientRect();

  let x = rootSize.x - groupSize.x + (rootSize.width - groupSize.width) / 2;
  let y = rootSize.y - groupSize.y + (rootSize.height - groupSize.height) / 2;

  div.select("g").attr("transform", `translate(${x},${y})`);
}

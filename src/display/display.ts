import AbstractNode from "display/abstractnode";
import { DataToDisplay } from "./data";
import RenderEngine from "./engine/engine";
import SideCanvas from "./interaction/sidecanvas";
import ClickInteraction from "./interaction/click";
import * as d3 from "d3";

const div = d3.select("#graph").on("click", () => ClickInteraction.back());

export default class Display {
  constructor() {}

  renderData(data: DataToDisplay) {
    // Init RenderEngine
    const sizeX: number = data.meta!["width"];
    const sizeY: number = data.meta!["height"];
    if (sizeX !== sizeY) {
      console.error("Mesh must have the same height and weight so far");
    }

    let start = performance.now();

    RenderEngine.resize(sizeX);
    // Generate abstract nodes
    const nodeMap = GenerateAbstractNodes(data);
    // Turn on RenderEngine
    const render = new Promise<SVGSVGElement>((resolve) => {
      RenderEngine.join(nodeMap);
      resolve(RenderEngine.node());
    });
    render.then((svg) => div.append(() => svg));

    let end = performance.now();

    console.log(`Display of [${sizeX}, ${sizeY}] cost is ${end - start} ms`);

    // Display overview in SideCanvas
    SideCanvas.load(data.meta!, nodeMap);
    SideCanvas.overview();
  }
}

function GenerateAbstractNodes(data: DataToDisplay): {
  [id: number]: AbstractNode;
} {
  // Prepare AbstractNode
  let nodeMap: { [id: number]: AbstractNode } = {};
  data.nodes!.forEach((node) => {
    const id = Number(node.id); // assume `id: string` is numeric
    nodeMap[id] = new AbstractNode(Number(node.id), node.label!);
  });
  // Feed base link properties
  data.edges!.forEach((edge) => {
    const src = Number(edge.source);
    const dst = Number(edge.target);
    nodeMap[src].AppendBaseLink({
      dst: dst,
      weight: edge.weight === undefined ? 0 : edge.weight,
      label: edge.label === undefined ? "" : edge.label,
    });
  });
  // Clone properties from base links
  Object.values(nodeMap).forEach((d) => d.DeepCloneBaseLinkToLink());
  return nodeMap;
}

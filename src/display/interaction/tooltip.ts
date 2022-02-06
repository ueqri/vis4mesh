import * as d3 from "d3";
import AbstractNode from "display/abstractnode";

const div = d3.select("body").append("div").attr("class", "tooltip");

class TooltipInteraction {
  constructor() {}

  onNode(d: AbstractNode) {
    let detail: string;
    if (d.record.length === 1) {
      detail = "base node without node packed";
    } else {
      detail = `packed node with ${d.record} inside`;
    }
    div
      .style("visibility", "visible")
      .html(`ID in Grid: ${d.id}<br>` + `Detail: ${detail}`);
  }

  onEdge([src, dst]: [AbstractNode, AbstractNode]) {
    let inside: { [id: number]: boolean } = {};
    dst.record.forEach((rec) => (inside[rec] = true));
    let links = src.GetBaseLink().filter((lk) => inside[lk.dst] === true);
    let detail: string;
    if (links.length === 1) {
      detail = `base edge without squashed, weights ${TranslateLabelToCount(
        links[0].label
      )}`;
    } else {
      detail = "squashed edge of<br>";
      links.forEach((lk) => {
        detail += `       -> ${lk.dst} weighs ${TranslateLabelToCount(
          lk.label
        )}<br>`;
      });
    }
    div
      .style("visibility", "visible")
      .html(
        `Link: ${GetNodeType(src)} ${src.id} -> ` +
          `${GetNodeType(dst)} ${dst.id}<br>` +
          `Detail: ${detail}`
      );
  }

  move([x, y]: [number, number]) {
    div.style("left", x + 15 + "px").style("top", y + "px");
  }

  hide() {
    div.style("visibility", "hidden");
  }
}

function GetNodeType(d: AbstractNode): string {
  return d.record.length === 1 ? "Base" : "Packed";
}

function TranslateLabelToCount(label: string): number {
  return label === "" ? 0 : Number(label);
}

export default new TooltipInteraction();

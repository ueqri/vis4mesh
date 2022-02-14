import * as d3 from "d3";
import AbstractNode from "display/abstractnode";

const div = d3.select("#sidecanvas");
const content = div.select("#sidecanvas-content");

class SideCanvas {
  constructor() {}

  load(meta: Object, nodeMap: { [id: number]: AbstractNode }) {}

  overview() {
    content.html(`<h3>Overview</h3>`);
  }

  write(html: string) {
    content.html(html);
  }
}

export default new SideCanvas();

import * as d3 from "d3";
import AbstractNode from "display/abstractnode";
import RegisterResizerEvent from "widget/standalone/resizer";

const div = d3.select("#sidecanvas");
const resizer = div.select(".resizer");
const content = div.select("#sidecanvas-content");
const navbar = document.querySelector("#navbar")! as HTMLElement;
div.style("top", navbar.offsetHeight + "px"); // TODO: use more graceful layout

RegisterResizerEvent(resizer, [
  {
    div: div,
    calc: ([w, h, dx, dy]) => [w - dx, h], // lays on the vertical bottom
    callback: ([w, h]) => {
      console.log(w, h);
    },
  },
]);

class SideCanvas {
  constructor() {}

  overview(meta: Object, nodeMap: { [id: number]: AbstractNode }) {
    content.html(`<h2>Overview</h2>`);
    console.log("sidecanvas load");
  }

  write(html: string) {
    content.html(html);
  }
}

export default new SideCanvas();

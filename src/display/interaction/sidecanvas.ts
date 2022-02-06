import * as d3 from "d3";
import RegisterResizerEvent from "widget/standalone/resizer";

const div = d3.select("#sidecanvas");
const resizer = div.select(".resizer");
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
  load() {
    console.log("sidecanvas load");
  }
}

export default new SideCanvas();

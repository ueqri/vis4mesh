import * as d3 from "d3";
import RegisterResizerEvent from "widget/standalone/resizer";

const div = {
  graph: d3.select("#graph"),
  navbar: d3.select("#navbar"),
  timebar: d3.select("#timebar"),
  sidecanvas: d3.select("#sidecanvas"),
};

export default class Layout {
  graph: LayoutElement;
  timebar: LayoutElement;
  sidecanvas: LayoutElement;

  constructor() {
    this.graph = new LayoutElement();
    this.timebar = new LayoutElement();
    this.sidecanvas = new LayoutElement();

    // Set absolute top positions
    const navbarHeight = (div.navbar.node() as HTMLElement).offsetHeight;
    div.graph.style("top", navbarHeight + "px");
    div.sidecanvas.style("top", navbarHeight + "px");

    // Register resize events
    this.registerResizer();
    d3.select(window).on("resize", () => {
      this.graph.resizeCallback();
      this.timebar.resizeCallback();
      this.sidecanvas.resizeCallback();
    });
  }

  protected registerResizer() {
    RegisterResizerEvent(div.timebar.select(".resizer"), [
      {
        div: div.timebar, // timebar lays on the vertical bottom
        calc: ([w, h, dx, dy]) => [w, h - dy < 65 ? 0 : h - dy],
        callback: ([w, h]) => {
          if (h == 0) {
            div.graph.style("bottom", "0px");
            div.sidecanvas.style("bottom", "0px");
            // Height of sidecanvas changed in another resizer
            div.sidecanvas.style("height", null);
          } else {
            this.timebar.resizeCallback();
            div.graph.style("bottom", h + "px");
            div.sidecanvas.style("bottom", h + "px");
            div.sidecanvas.style("height", null);
          }
        },
      },
    ]);

    RegisterResizerEvent(div.sidecanvas.select(".resizer"), [
      {
        div: div.sidecanvas, // sidecanvas lays on the vertical bottom
        calc: ([w, h, dx, dy]) => [w - dx < 65 ? 0 : w - dx, h],
        callback: ([w, h]) => {
          if (w == 0) {
            div.graph.style("right", "0px");
          } else {
            this.sidecanvas.resizeCallback();
            div.graph.style("right", w + "px");
          }
        },
      },
    ]);
  }
}

class LayoutElement {
  resizeCallback: () => any;

  constructor() {
    this.resizeCallback = () => {};
  }

  afterResizing(callback: () => any): void {
    this.resizeCallback = callback;
  }
}

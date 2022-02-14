import * as d3 from "d3";
import AbstractNode from "display/abstractnode";
import SideCanvas from "./sidecanvas";

class ClickInteraction {
  protected clearLastEvent: () => any;

  constructor() {
    this.clearLastEvent = () => {};
  }

  onNode(d: AbstractNode, executeEvent: () => any, clearEvent: () => any) {
    this.clearLastEvent();
    executeEvent();

    SideCanvas.write(`<h3>Node ${d.id}</h3>`);

    this.clearLastEvent = clearEvent;
  }

  onEdge(
    [src, dst]: [AbstractNode, AbstractNode],
    executeEvent: () => any,
    clearEvent: () => any
  ) {
    this.clearLastEvent();
    executeEvent();

    SideCanvas.write(`<h3>Link ${src.id} -> ${dst.id}</h3>`);

    this.clearLastEvent = clearEvent;
  }

  back() {
    this.clearLastEvent();
    this.clearLastEvent = () => {};
    // Back to overview
    SideCanvas.overview();
  }
}

export default new ClickInteraction();

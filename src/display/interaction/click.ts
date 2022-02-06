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

    SideCanvas.write(`<h2>Node ${d.id}</h2>`);

    this.clearLastEvent = clearEvent;
  }

  onEdge(
    [src, dst]: [AbstractNode, AbstractNode],
    executeEvent: () => any,
    clearEvent: () => any
  ) {
    this.clearLastEvent();
    executeEvent();

    SideCanvas.write(`<h2>Link ${src.id} -> ${dst.id}</h2>`);

    this.clearLastEvent = clearEvent;
  }

  back() {
    this.clearLastEvent();
    this.clearLastEvent = () => {};
    // Back to overview
  }
}

export default new ClickInteraction();

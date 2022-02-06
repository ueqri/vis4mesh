import * as d3 from "d3";
import AbstractNode from "display/abstractnode";

class ClickInteraction {
  protected clearLastEvent: () => any;

  constructor() {
    this.clearLastEvent = () => {};
  }

  onNode(d: AbstractNode, executeEvent: () => any, clearEvent: () => any) {
    this.clearLastEvent();
    executeEvent();

    console.log(d.id);

    this.clearLastEvent = clearEvent;
  }

  onEdge(
    [src, dst]: [AbstractNode, AbstractNode],
    executeEvent: () => any,
    clearEvent: () => any
  ) {
    this.clearLastEvent();
    executeEvent();

    console.log(src.id, "->", dst.id);

    this.clearLastEvent = clearEvent;
  }

  back() {
    this.clearLastEvent();
    this.clearLastEvent = () => {};
    // Back to overview
  }
}

export default new ClickInteraction();

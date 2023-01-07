import SideCanvas from "./sidecanvas";
import { GetDaisenUrl } from '../../widget/daisen';
import * as d3 from "d3";

class ClickInteraction {
  triggerDaisen = false;
  protected clearLastEvent: () => any;

  constructor() {
    this.clearLastEvent = () => {};
  }

  onNode(
    level: number,
    text: string,
    executeEvent: () => any,
    clearEvent: () => any
  ) {
    this.reset();
    executeEvent();
    // if (level === 0) {
    //   SideCanvas.write(`<h9>${text}</h9>`);
    // }
    // if (level === 0) {
    //   SideCanvas.DisplayChord();
    // }
    if(this.triggerDaisen) {
      const url = GetDaisenUrl();
      d3.select("#daisen-iframe").attr("src", url!.raw_url());
    }
    this.clearLastEvent = clearEvent;
  }

  onEdge(
    level: number,
    text: string,
    executeEvent: () => any,
    clearEvent: () => any
  ) {
    this.reset();
    executeEvent();
    if (level === 0) {
      SideCanvas.write(`<h9>${text}</h9>`);
    }

    this.clearLastEvent = clearEvent;
  }

  reset() {
    console.log("reset interaction hit");
    this.clearLastEvent();
    this.clearLastEvent = () => {};
  }
}

export default new ClickInteraction();

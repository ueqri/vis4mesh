import SideCanvas from "./sidecanvas";

class ClickInteraction {
  protected clearLastEvent: () => any;

  constructor() {
    this.clearLastEvent = () => {};
  }

  onNode(text: string, executeEvent: () => any, clearEvent: () => any) {
    this.reset();
    executeEvent();

    // SideCanvas.write(`<h3>Node</h3>`);
    SideCanvas.write(`<h4>${text}</h4>`);
    SideCanvas.DisplayTransChord();

    this.clearLastEvent = clearEvent;
  }

  onEdge(text: string, executeEvent: () => any, clearEvent: () => any) {
    this.reset();
    executeEvent();

    // SideCanvas.write(`<h3>Link</h3>`);
    SideCanvas.write(`<h4>${text}</h4>`);

    this.clearLastEvent = clearEvent;
  }

  reset() {
    this.clearLastEvent();
    this.clearLastEvent = () => {};
    // Back to overview
    SideCanvas.Clear();
  }
}

export default new ClickInteraction();

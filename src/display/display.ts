import { DataToDisplay } from "./data";
import { DisplayLayout } from "./layout";

export class Display {
  // protected div: HTMLElement;
  protected layout: DisplayLayout;

  constructor(
    div: HTMLElement,
    Layout: new (div: HTMLElement) => DisplayLayout
  ) {
    // this.div = div;
    this.layout = new Layout(div);
  }

  renderData(data: DataToDisplay) {
    this.layout.render(data);
  }

  clear() {
    this.layout.remove();
  }
}

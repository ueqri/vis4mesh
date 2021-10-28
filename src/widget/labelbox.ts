import * as d3 from "d3";
import { DivSelection } from "./widget";

export class LabelBox {
  protected renderedElement!: DivSelection;
  protected elementID: string;
  protected label: string;
  protected defaultValue: string;
  protected withDefault: boolean;
  protected events!: Array<(value: any) => any>;

  constructor(id: string) {
    this.elementID = id;
    this.label = "";
    this.withDefault = false;
    this.defaultValue = "";
  }

  name(str: string): this {
    this.label = str;
    return this;
  }

  default(defaultValue: string): this {
    this.withDefault = true;
    this.defaultValue = defaultValue;
    return this;
  }

  renderTo(div: HTMLElement): this {
    let box = d3
      .select(div)
      .append("div")
      .attr("id", `div-for-${this.elementID}`)
      .style("margin", "0.5em");
    let l = box
      .append("label")
      .style("display", "block")
      .style("margin", "0.1em");

    if (this.label === "" && this.withDefault) {
      l.text(this.defaultValue);
    } else {
      l.text(this.label);
    }

    this.renderedElement = box;
    return this;
  }

  storeEvent(handle: (value: any) => any): this {
    // skip it, because LabelBox is a non-interactive widget
    return this;
  }

  event(handle: ((value: any) => any) | undefined): this {
    // skip it, because LabelBox is a non-interactive widget
    return this;
  }

  element(): HTMLElement {
    return this.renderedElement.node() as HTMLElement;
  }
}

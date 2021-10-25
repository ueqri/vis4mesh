import * as d3 from "d3";
import { DivSelection } from "./widget";

export class RadioButtonGroup {
  protected renderedElement!: DivSelection;
  protected elementID: string;
  protected label: Array<string>;
  protected defaultValue: string;
  protected withDefault: boolean;
  protected events: Array<(value: any) => any>;

  constructor(id: string) {
    this.elementID = id;
    this.label = new Array<string>();
    this.withDefault = false;
    this.defaultValue = "";
    this.events = new Array<(value: any) => any>();
  }

  name(str: Array<string>): this {
    this.label = str;
    return this;
  }

  default(defaultValue: string): this {
    this.withDefault = true;
    this.defaultValue = defaultValue;
    return this;
  }

  renderTo(div: HTMLElement): this {
    let group = d3
      .select(div)
      .append("div")
      .attr("id", `div-for-${this.elementID}`)
      .attr("class", "btn-group")
      .attr("role", "group")
      .attr("aria-label", "Basic radio toggle button group")
      .style("margin-top", "1em");
    this.label.forEach((v, idx) => {
      let id = `div-for-${this.elementID}-btnradio${idx}`;
      let input = group
        .append("input")
        .attr("type", "radio")
        .attr("class", "btn-check")
        .attr("name", "btnradio")
        .attr("id", id)
        .attr("autocomplete", "off");
      if (this.withDefault && this.defaultValue == v) {
        input.append("checked");
      }
      group
        .append("label")
        .attr("class", "btn btn-outline-primary")
        .attr("for", id)
        .text(v);
    });
    this.renderedElement = group;
    return this;
  }

  storeEvent(handle: (value: any) => any): this {
    this.events.push(handle);
    return this;
  }

  event(handle: ((value: any) => any) | undefined): this {
    const events = this.events;
    this.renderedElement.selectAll("input").on("change", function () {
      let name: string;
      if ((this as any).checked === true) {
        name = (this as any).nextElementSibling.textContent;
      } else {
        return;
      }
      // console.log(this.nextElementSibling.textContent);
      if (handle === undefined) {
        events.forEach((func) => func(name));
      } else {
        handle(name);
      }
    });
    return this;
  }

  element(): HTMLElement {
    return this.renderedElement.node() as HTMLElement;
  }
}

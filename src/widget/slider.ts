import * as d3 from "d3";
import { DivSelection } from "./widget";

export class SingleSlider {
  protected renderedElement!: DivSelection;
  protected elementID: string;
  protected min: number;
  protected max: number;
  protected step: number;
  protected label: string;
  protected defaultValue: number;
  protected events: Array<(value: any) => any>;

  constructor(id: string, min: number, max: number, step: number = 1) {
    this.elementID = id;
    this.min = min;
    this.max = max;
    this.step = step;
    this.label = "Slider";
    this.defaultValue = (min + max) / 2;
    this.events = new Array<(value: any) => any>();
  }

  name(str: string): this {
    this.label = str;
    return this;
  }

  default(defaultValue: number): this {
    this.defaultValue = defaultValue;
    return this;
  }

  // Vanilla HTML5 style
  renderVanillaTo(div: HTMLElement): this {
    let item = d3
      .select(div)
      .append("div")
      .attr("id", `div-for-${this.elementID}`)
      .attr("class", "single-slider-div");
    item
      .append("label")
      .attr("class", "single-slider-label")
      .style("padding-right", "0.5em")
      .text(this.label);
    item
      .append("input")
      .attr("type", "range")
      .style("margin-bottom", "-0.25em")
      .attr("id", this.elementID)
      .attr("min", this.min)
      .attr("max", this.max)
      .attr("step", this.step)
      .property("value", this.defaultValue);
    item
      .append("output")
      .style("padding-left", "0.5em")
      .attr("id", `${this.elementID}output`)
      .text(this.defaultValue);
    item
      .append("bottom")
      .attr("type", "button")
      .style("margin-left", "0.5em")
      .attr("class", "btn btn-light")
      .attr("id", `${this.elementID}reset`)
      .text("Reset");

    this.renderedElement = item;
    return this;
  }

  // Bootstrap style
  renderTo(div: HTMLElement): this {
    let item = d3
      .select(div)
      .append("div")
      .attr("id", `div-for-${this.elementID}`)
      .attr("class", "single-slider-div");
    item.append("label").attr("class", "form-label").text(this.label);
    item
      .append("output")
      .style("margin-left", "0.75em")
      .attr("id", `${this.elementID}output`)
      .text(this.defaultValue);
    item
      .append("bottom")
      .attr("type", "button")
      .attr("class", "btn btn-light")
      .style("float", "right")
      .attr("id", `${this.elementID}reset`)
      .text("Reset");
    item
      .append("input")
      .attr("type", "range")
      .attr("class", "form-range")
      .attr("id", this.elementID)
      .attr("min", this.min)
      .attr("max", this.max)
      .attr("step", this.step)
      .property("value", this.defaultValue);

    this.renderedElement = item;
    return this;
  }

  storeEvent(handle: (value: any) => any): this {
    this.events.push(handle);
    return this;
  }

  event(handle: ((value: any) => any) | undefined): this {
    const events = this.events;
    let outputLabel = this.renderedElement.select("output");
    this.renderedElement.select("input").on("input", function () {
      const inputValue = (this as any).value;
      if (handle === undefined) {
        events.forEach((func) => func(inputValue));
      } else {
        handle(inputValue as number);
      }
      outputLabel.property("value", inputValue);
    });
    this.renderedElement.select("bottom").on("click", () => {
      this.renderedElement
        .select("input")
        .property("value", this.defaultValue)
        .dispatch("input");
    });
    return this;
  }

  element(): HTMLElement {
    return this.renderedElement.select("input").node() as HTMLElement;
  }
}

import * as d3 from "d3";

type DivSelection = d3.Selection<HTMLDivElement, unknown, null, undefined>;

export class SingleSlider {
  protected renderedElement!: DivSelection;
  protected elementID: string;
  protected min: number;
  protected max: number;
  protected step: number;
  protected label: string;
  protected defaultValue: number;

  constructor(id: string, min: number, max: number, step: number = 1) {
    this.elementID = id;
    this.min = min;
    this.max = max;
    this.step = step;
    this.label = "Slider";
    this.defaultValue = (min + max) / 2;
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

  event(handle: (value: number) => any): this {
    let outputLabel = this.renderedElement.select("output");
    this.renderedElement.select("input").on("input", function () {
      const inputNumber = (this as any).value;
      outputLabel.property("value", inputNumber);
      handle(inputNumber);
    });
    this.renderedElement.select("bottom").on("click", () => {
      this.renderedElement
        .select("input")
        .property("value", this.defaultValue)
        .dispatch("input");
    });
    return this;
  }
}

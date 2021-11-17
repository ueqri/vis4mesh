import { Widget } from "./widget";

/* Example usage:
  d3.select("div").append(() =>
    new SingleSlider("slider-test")
      .append({
        min: 0,
        max: 20,
        default: 5,
        step: 1,
        label: "Single Slider",
      })
      .event((v) => {
        console.log(`Value: ${v}`);
      })
      .node()
  );
*/

export interface SingleSliderOptions {
  min?: number;
  max: number;
  step?: number;
  default?: number;
  label?: string;
}

export class SingleSlider extends Widget {
  constructor(id?: string) {
    super(id);
  }

  append(opt: SingleSliderOptions): this {
    if (opt.min === undefined) {
      opt.min = 0;
    }

    if (opt.step === undefined) {
      opt.step = 1;
    }

    if (opt.default === undefined) {
      opt.default = opt.min;
    }

    if (typeof opt.label === "string") {
      this.div.append("label").attr("class", "form-label").text(opt.label);
    }

    // Output text of slider value
    this.div
      .append("output")
      .style("margin", "0.5em")
      .attr("id", `${this.id}-output`)
      .text(opt.default);

    // Button to reset
    this.div
      .append("button")
      .attr("type", "button")
      .attr("class", "btn btn-light")
      .style("float", "right")
      .attr("id", `${this.id}-reset`)
      .text("Reset");

    // Range slider
    this.div
      .append("input")
      .attr("type", "range")
      .attr("class", "form-range")
      .attr("id", `${this.id}-slider`)
      .attr("min", opt.min)
      .attr("max", opt.max)
      .attr("step", opt.step)
      .property("value", opt.default);

    // Bind button event, static function no need to jam in `event` method
    this.div.select("button").on("click", () => {
      this.div.select("input").property("value", opt.default).dispatch("input");
    });

    return this;
  }

  event(handle: (value: number) => any): this {
    let output = this.div.select("output");
    this.div.select("input").on("input", function () {
      const value: number = (this as any).value;
      handle(value);
      output.property("value", value);
    });
    return this;
  }
}

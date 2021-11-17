import { Widget } from "./widget";

export interface InputBoxOptions {
  label: string;
  placeholder?: string;
}

export class InputBoxWithFloatingLabel extends Widget {
  constructor(id?: string) {
    super(id);
    this.div.attr("class", "form-floating").style("margin", "0.25rem");
  }

  append(opt: InputBoxOptions): this {
    let boxID = `${this.id}-input`;
    let input = this.div
      .append("input")
      .attr("class", "form-control")
      .attr("id", boxID);

    if (typeof opt.placeholder === "string") {
      input.property("value", opt.placeholder);
    }

    this.div.append("label").attr("for", boxID).text(opt.label);

    return this;
  }

  event(handle: (value: any) => any): this {
    this.div.select("input").on("change", function () {
      const inputValue = (this as any).value;
      handle(inputValue);
    });
    return this;
  }

  deactivate(): this {
    this.div.select("input").attr("disabled", "true");
    return this;
  }

  activate(): this {
    this.div.select("input").attr("disabled", null);
    return this;
  }

  updateValueNotDispatchEvent(val: string | number): this {
    this.div.select("input").property("value", val);
    // need to consider whether to trigger/dispatch input `change` event again
    return this;
  }
}

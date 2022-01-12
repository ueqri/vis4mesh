import { ButtonSelection, Widget } from "./widget";

/* Example usage:
  d3.select("div").append(() =>
    new NormalButton("btn-reset")
      .append("Reset")
      .event(() => console.log(`Reset clicked`))
      .style("btn-light")
      .node()
  );
*/

export class NormalButton extends Widget {
  protected btn: ButtonSelection;

  constructor(id?: string) {
    super(id);
    this.div.style("margin", "0.25em").style("display", "inline-block");
    let btnID = `${this.id}-btn`;
    this.btn = this.div
      .append("button")
      .attr("type", "button")
      .attr("class", "btn btn-primary")
      .attr("id", btnID);
  }

  append(label: string): this {
    this.btn.text(label);
    return this;
  }

  event(handle: () => any): this {
    this.btn.on("click", () => handle());
    return this;
  }

  // Change color of button to Bootstrap5 style, e.g. btn-primary, btn-light
  color(bs5BtnStyle: string): this {
    this.btn.attr("class", `btn ${bs5BtnStyle}`);
    return this;
  }

  style(name: string, value: string): this {
    this.btn.style(name, value);
    return this;
  }

  hide(): this {
    this.div.style("display", "none");
    return this;
  }

  display(mode: string): this {
    this.div.style("display", mode);
    return this;
  }
}

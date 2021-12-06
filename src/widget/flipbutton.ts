import * as d3 from "d3";
import { ButtonSelection, Widget, WidgetSize } from "./widget";

export interface FlipButtonOptions {
  name: string;
  html?: string; // custom button label html, e.g. using SVG
  color?: string; // use Bootstrap 5 button css, e.g. "btn-light"
}

export class FlipButton extends Widget {
  protected flip: Array<FlipButtonOptions>;
  protected btn: ButtonSelection;

  constructor(id?: string, size?: WidgetSize) {
    super(id, size);
    this.div.style("margin", "0.25em");

    this.flip = new Array<FlipButtonOptions>();
    let btnID = `${this.id}-flip-btn`;
    this.btn = this.div
      .append("button")
      .attr("type", "button")
      .attr("class", "btn btn-sm btn-primary")
      .attr("id", btnID)
      .attr("flip-status", "0"); // attribute to store flip status
  }

  append(opts: FlipButtonOptions[]): this {
    this.flip = [...this.flip, ...opts];
    this.updateButton(this.flip[0], 0);
    // Initiate empty event, adding new events listened would remove this one
    this.event(() => {});
    return this;
  }

  event(handle: (value: any) => any): this {
    const flip = this.flip;
    const updateButton = this.updateButton;
    this.div.select("button").on("click", function () {
      const index = Number(d3.select(this).attr("flip-status"));
      const name = flip[index].name;
      const next = (index + 1) % flip.length;
      console.log(name);
      handle(name);
      updateButton(flip[next], next);
    });
    return this;
  }

  protected display(what: string): boolean {
    let exist = false;
    this.flip.some((v: FlipButtonOptions, idx: number) => {
      if (v.name === what) {
        this.updateButton(v, idx);
        exist = true;
        return true;
      }
    });
    return exist;
  }

  static(what: string): this {
    this.display(what);
    return this;
  }

  switch(to: string): this {
    // if switch to `Play`, display icon |> first and then dispatch click event
    // to play with icon || in the button
    if (this.display(to) === true) {
      this.div.select("button").dispatch("click");
    }
    return this;
  }

  protected updateButton = (opt: FlipButtonOptions, flipIndex: number) => {
    let btn = this.div.select("button");
    btn.html(opt.html === undefined ? opt.name : opt.html);
    if (typeof opt.color === "string") {
      btn.attr("class", `btn btn-sm ${opt.color}`);
    }
    btn.attr("flip-status", `${flipIndex}`);
  };
}

import { Widget } from "./widget";

export interface LabelBoxOptions {
  label: string;
  widgets?: Widget[];
}

export class LabelBox extends Widget {
  constructor(id?: string) {
    super(id);
    this.div.style("margin", "0.5em");
  }

  append(opts: LabelBoxOptions[]): this {
    opts.forEach((v) => {
      this.div
        .append("label")
        .style("display", "block")
        .style("margin", "0.25em")
        .text(v.label);
      if (v.widgets === undefined) {
        console.warn("append empty LabelBox");
      } else {
        v.widgets.forEach((w) => {
          this.div.append(() => w.node());
        });
      }
    });
    return this;
  }
}

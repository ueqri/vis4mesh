import * as d3 from "d3";
import StackedChart from "../widget/standalone/stackchart";

export interface EdgeTooltipOptions {
  src?: string;
  dst?: string;
  weight?: string;
  detail: string;
}

export class EdgeTooltip {
  opt!: EdgeTooltipOptions;
  chart!: StackedChart; // TODO
  constructor() {}

  use(opt: EdgeTooltipOptions): this {
    this.opt = opt;
    return this;
  }

  node(): string {
    return (
      `${this.opt.src} -> ${this.opt.dst}<br>` +
      `Weight: ${this.opt.weight}<br>` +
      `Detail: ${this.opt.detail}`
    );
  }
}

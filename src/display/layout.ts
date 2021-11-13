import * as d3 from "d3";
import { DataToDisplay, NodeDisplay, EdgeDisplay } from "./data";
import { DisplayConfig } from "./config";

export abstract class DisplayLayout {
  div: HTMLElement;
  abstract config: DisplayConfig;

  constructor(div: HTMLElement) {
    this.div = div;
  }

  // color platte scheme to map weight
  abstract colorScheme(weight: number | undefined): string;

  // render the specific layout to a new graph
  abstract render(data: DataToDisplay): void;

  // refresh existed attributes in the old graph
  refresh(data: DataToDisplay) {
    // render also support refreshing thanks to d3.exit and d3.enter
    this.render(data);
  }

  remove() {
    d3.select(this.div).selectAll("*").remove();
  }
}

export type AllNodeSelection = d3.Selection<
  d3.BaseType,
  NodeDisplay,
  d3.BaseType,
  unknown
>;

export type AllLinkSelection = d3.Selection<
  d3.BaseType,
  EdgeDisplay,
  d3.BaseType,
  unknown
>;

export type SVGSelection = d3.Selection<d3.BaseType, unknown, null, undefined>;

export interface MappedLocation {
  X: number;
  Y: number;
}

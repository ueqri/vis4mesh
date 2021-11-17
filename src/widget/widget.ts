import * as d3 from "d3";

export abstract class Widget {
  protected div: DetachedDivNode;
  protected id: string; // id of outer div

  constructor(id?: string, size?: WidgetSize) {
    this.div = d3.create("div");
    if (id === undefined) {
      this.id = generateID(); // assign random ID, but do not apply to HTML
    } else {
      this.div.attr("id", id);
      this.id = id;
    }
    if (size != undefined) {
      if (typeof size.height === "string") {
        this.div.attr("height", size.height);
      }
      if (typeof size.width === "string") {
        this.div.attr("width", size.width);
      }
    }
  }

  abstract append(item: any): any;

  node(): HTMLElement {
    return this.div.node()!;
  }
}

export type DetachedDivNode = d3.Selection<
  HTMLDivElement,
  undefined,
  null,
  undefined
>;

export type ButtonSelection = d3.Selection<
  HTMLButtonElement,
  undefined,
  null,
  undefined
>;

export interface WidgetSize {
  width?: string;
  height?: string;
}

function generateID() {
  return "_" + Math.random().toString(36).substr(2, 9);
}

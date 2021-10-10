import * as d3 from "d3";

type DivSelection = d3.Selection<HTMLDivElement, unknown, null, undefined>;

export class InputBoxWithFloatingLabel {
  protected renderedElement!: DivSelection;
  protected elementID: string;
  protected label: string;
  protected defaultValue: number;
  protected withDefault: boolean;
  protected events: Array<(value: any) => any>;

  constructor(id: string) {
    this.elementID = id;
    this.label = "InputBox";
    this.withDefault = false;
    this.defaultValue = 0;
    this.events = new Array<(value: any) => any>();
  }

  name(str: string): this {
    this.label = str;
    return this;
  }

  default(defaultValue: number): this {
    this.withDefault = true;
    this.defaultValue = defaultValue;
    return this;
  }

  renderTo(div: HTMLElement): this {
    let item = d3
      .select(div)
      .append("div")
      .attr("id", `div-for-${this.elementID}`)
      .attr("class", "form-floating");
    let input = item
      .append("input")
      .attr("class", "form-control")
      .attr("id", this.elementID);
    if (this.withDefault) {
      input.property("value", this.defaultValue);
    }
    item.append("label").attr("for", this.elementID).text(this.label);

    this.renderedElement = item;
    return this;
  }

  storeEvent(handle: (value: any) => any): this {
    this.events.push(handle);
    return this;
  }

  event(handle: ((value: number) => any) | undefined): this {
    const events = this.events;
    this.renderedElement.select("input").on("change", function () {
      const inputValue = (this as any).value;
      if (handle === undefined) {
        events.forEach((func) => func(inputValue));
      } else {
        handle(inputValue);
      }
    });
    return this;
  }
}

export function GroupRenderAsColumns(
  renderToDiv: HTMLElement,
  group: Array<InputBoxWithFloatingLabel>
) {
  let row = d3
    .select(renderToDiv)
    .append("div")
    .attr("class", `row g-${group.length}`);
  group.forEach((v) => {
    v.renderTo(
      row.append("div").attr("class", "col-md").node() as HTMLElement
    ).event(undefined);
  });
}

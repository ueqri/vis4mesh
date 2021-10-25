import * as d3 from "d3";

export type DivSelection = d3.Selection<
  HTMLDivElement,
  unknown,
  null,
  undefined
>;

export interface Widget {
  name(str: any): this;
  default(defaultValue: any): this;
  renderTo(div: HTMLElement): this;

  // Add the events into array if you want or must tag the event callbacks
  // before the `renderTo` method. Otherwise, you could choose `event` method
  // directly.
  storeEvent(handle: (value: any) => any): this;

  // Bind the events with initiated HTML element, so this method must be
  // called after `renderTo` method. If you want to tag the event callbacks
  // before rendering the items into target div, you could use `storeEvent`
  // to add the events into an array and call them eventually.
  event(handle: ((value: any) => any) | undefined): this;

  element(): HTMLElement;
}

export function GroupRenderAsColumns(
  renderToDiv: HTMLElement,
  group: Array<Widget>
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

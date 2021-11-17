import { Widget } from "./widget";

/* Example usage:
  d3.select("div").append(() =>
    new RadioButtonGroup("radio-test")
      .append(["1X", "2X", "4X", "8X"])
      .switch("2X")
      .event((v) => {
        console.log(`Select: ${v}`);
      })
      .node()
  );
*/

export class RadioButtonGroup extends Widget {
  protected numButtons: number;
  protected items: Array<string>; // items of radio button group

  constructor(id?: string) {
    super(id);
    this.numButtons = 0;
    this.items = new Array<string>();
    this.div
      .attr("class", "btn-group")
      .attr("role", "group")
      .attr("aria-label", "Radio toggle button group")
      .style("margin", "0.25em");
  }

  protected radioID(index: number): string {
    return `${this.id}-btnradio${index}`;
  }

  append(items: Array<string>): this {
    this.items = [...this.items, ...items];
    items.forEach((v) => {
      let radio = this.radioID(this.numButtons);
      let input = this.div
        .append("input")
        .attr("type", "radio")
        .attr("class", "btn-check")
        .attr("name", `${this.id}-btnradio`) // `name` distinguish certain group
        .attr("id", radio)
        .attr("autocomplete", "off");

      this.div
        .append("label")
        .attr("class", "btn btn-outline-primary")
        .attr("for", radio)
        .text(v);

      this.numButtons += 1; // enable multiple calls for `append`
    });
    return this;
  }

  event(handle: (value: any) => any): this {
    this.div.selectAll("input").on("change", function () {
      let name: string;
      if ((this as any).checked === true) {
        name = (this as any).nextElementSibling.textContent;
      } else {
        return;
      }
      // console.log(name);
      handle(name);
    });
    return this;
  }

  switch(to: string): this {
    this.items.some((v: string, idx: number) => {
      if (v === to) {
        let radio = this.radioID(idx);
        this.div.select(`#${radio}`).property("checked", true);
        return true;
      }
    });
    return this;
  }
}

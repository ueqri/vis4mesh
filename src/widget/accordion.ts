import { Widget } from "./widget";

export interface AccordionSection {
  name: string;
  widgets: Widget[];
  collapse?: boolean; // true by default
}

export class AccordionPanel extends Widget {
  protected numSections: number;
  protected names: Array<string>;

  constructor(id?: string) {
    super(id);
    this.numSections = 0;
    this.names = new Array<string>();
    this.div.attr("class", "accordion");
  }

  append(s: AccordionSection[]) {
    s.forEach((v) => {
      this.appendItem(v);
    });
  }

  appendItem(s: AccordionSection) {
    let labelID = `${this.id}-heading${this.numSections}`;
    let innerID = this.innerBodyID(this.numSections);
    let contentID = `${this.id}-content${this.numSections}`;
    let collapse: boolean = s.collapse === undefined ? true : s.collapse;

    let item = this.div.append("div").attr("class", "accordion-item");

    let h2 = item
      .append("h2")
      .attr("class", "accordion-header")
      .attr("id", labelID);
    h2.append("button")
      .attr("class", "accordion-button collapsed")
      .attr("type", "button")
      .attr("data-bs-toggle", "collapse")
      .attr("data-bs-target", `#${innerID}`)
      .attr("aria-expanded", "false")
      .attr("aria-controls", innerID)
      .text(s.name);

    let body = item
      .append("div")
      .attr("id", innerID)
      .attr(
        "class",
        `accordion-collapse collapse${collapse === false ? " show" : ""}`
      )
      .attr("aria-labelledby", labelID)
      .append("div")
      .attr("class", "accordion-body")
      .attr("id", contentID);

    s.widgets.forEach((w) => {
      body.append(() => w.node());
    });

    this.numSections += 1;
    this.names.push(s.name);
  }

  protected innerBodyID(index: number): string {
    return `${this.id}-collapse${index}`;
  }

  show(target: string) {
    this.names.some((v: string, idx: number) => {
      if (v === target) {
        let inner = this.innerBodyID(idx);
        this.div
          .select(`#${inner}`)
          .attr("class", "accordion-collapse collapse show");
        return true;
      }
    });
  }
}

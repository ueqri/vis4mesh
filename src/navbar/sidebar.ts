import { SignalMap } from "../controller/controller";
import { Widget } from "../widget/widget";
import * as d3 from "d3";
import { AccordionPanel } from "widget/accordion";

export abstract class ConfigSection {
  name: string;
  widgets: Array<Widget>;

  constructor(sectionName: string) {
    this.name = sectionName;
    this.widgets = new Array<Widget>();
  }

  abstract bindEvents(v: any): any;
}

export class Sidebar {
  protected div: HTMLElement;
  protected accordion: AccordionPanel;

  constructor(div: HTMLElement) {
    this.div = div;
    this.accordion = new AccordionPanel("sidebar-accordion");
  }

  loadSections(sections: ConfigSection[]) {
    this.accordion.append(sections);
  }
}

import { SignalMap } from "../controller/controller";
import * as d3 from "d3";

export abstract class ConfigItem {
  constructor(sectionName: string) {}
  abstract bind(signal: SignalMap): void;
}

export class Sidebar {
  protected div: HTMLElement;

  constructor(div: HTMLElement) {
    this.div = div;
  }

  loadItem(item: ConfigItem, signal: SignalMap) {
    item.bind(signal);
  }
}

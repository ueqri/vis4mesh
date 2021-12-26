import * as d3 from "d3";
import { AccordionPanel } from "../widget/accordion";
import RenderSettingPlayerSection from "./settingsection/player";
import Ticker from "../timebar/ticker";
import RenderSettingFilterSection from "./settingsection/filter";
import Filter from "../controller/module/filter";
import { FilterBar } from "../filterbar/filterbar";

let div = d3.select("#setting");
let accordion: AccordionPanel = new AccordionPanel("accordion-setting");

interface SettingOptions {
  ticker: Ticker;
  filterBar: FilterBar;
  filterModule: Filter;
}

export default function RenderAccordionSetting(opt: SettingOptions) {
  let player = RenderSettingPlayerSection(opt.ticker);
  let filter = RenderSettingFilterSection(
    opt.ticker,
    opt.filterBar,
    opt.filterModule
  );

  accordion.append([
    {
      name: "Player",
      widgets: [player],
    },
    {
      name: "Filter",
      widgets: [filter],
    },
  ]);

  div.append(() => accordion.node());
}

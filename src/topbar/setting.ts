import * as d3 from "d3";
import { AccordionPanel } from "../widget/accordion";
import RenderSettingPlayerSection from "./settingsection/player";
import Ticker from "../timebar/ticker";

let div = d3.select("#setting");
let accordion: AccordionPanel = new AccordionPanel("accordion-setting");

interface SettingOptions {
  ticker: Ticker;
}

export default function RenderAccordionSetting(opt: SettingOptions) {
  let player = RenderSettingPlayerSection(opt.ticker);

  accordion.append([
    {
      name: "Player",
      widgets: [player],
    },
  ]);

  div.append(() => accordion.node());
}

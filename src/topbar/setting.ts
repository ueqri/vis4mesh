import * as d3 from "d3";
import { AccordionPanel } from "../widget/accordion";
import RenderSettingPlayerSection from "./settingsection/player";
import RenderSettingFilterSection from "./settingsection/filter";
import RenderSettingLayoutSection from "./settingsection/layout";

let div = d3.select("#setting");
let accordion: AccordionPanel = new AccordionPanel("accordion-setting");

export default function RenderAccordionSetting() {
  accordion.append([
    {
      name: "Player",
      widgets: [RenderSettingPlayerSection()],
    },
    {
      name: "Filter",
      widgets: [RenderSettingFilterSection()],
    },
    {
      name: "Layout",
      widgets: [RenderSettingLayoutSection()],
    },
  ]);

  div.append(() => accordion.node());
}

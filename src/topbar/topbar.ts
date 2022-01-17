import RenderPlayerButton from "./playerbutton";
import RenderDataPortStatus from "./status";
import RenderAccordionSetting from "./setting";

export function RenderTopbar() {
  RenderDataPortStatus();
  RenderPlayerButton();
  RenderAccordionSetting();
}

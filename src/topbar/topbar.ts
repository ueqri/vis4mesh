import RenderPlayerButton from "./playerbutton";
import RenderMainViewToggleButton from "./mainviewbutton";
import RenderDataPortStatus from "./status";
import RenderAccordionSetting from "./setting";

export function RenderTopbar() {
  RenderDataPortStatus();
  RenderPlayerButton();
  RenderMainViewToggleButton();
  RenderAccordionSetting();
}

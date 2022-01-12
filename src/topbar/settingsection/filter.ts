import { LabelBox } from "../../widget/labelbox";
import { RadioButtonGroup } from "../../widget/radiobutton";
import Ticker from "../../timebar/ticker";
import Filter from "../../controller/module/filter";
import {
  FilterBar,
  SwitchTrafficFilterCheckboxes,
} from "../../filterbar/filterbar";
import { NormalButton } from "../../widget/normalbutton";
import Config from "../../global";

const NumLevels = Config.EdgeTrafficLegendLevel;

// These widgets must be generated before certain controlling radio group,
// otherwise the `display: inline-block` won't work at all on a nonexistent
// element in event function (which is called after trigger `switch` method)
// when building the radio widget.
let btnSelectAllTrafficBox = new NormalButton("btn-all-edge-cb")
  .append("Select All")
  .style("margin-top", "0.4em")
  .style("margin-bottom", "0.4em")
  .event(() =>
    SwitchTrafficFilterCheckboxes(Array<boolean>(NumLevels).fill(true))
  )
  .hide();

let btnUnselectAllTrafficBox = new NormalButton("btn-none-edge-cb")
  .append("Unselect All")
  .style("margin-top", "0.4em")
  .style("margin-bottom", "0.4em")
  .event(() =>
    SwitchTrafficFilterCheckboxes(Array<boolean>(NumLevels).fill(false))
  )
  .hide();

export default function RenderSettingFilterSection(
  t: Ticker,
  filterBar: FilterBar,
  filterModule: Filter
) {
  return new LabelBox("filter-setting").append([
    {
      label: "Message Filter",
      widgets: [
        new RadioButtonGroup("filter-msg-radio")
          .append(["Groups", "Data/Command"])
          .event((v: string) => {
            t.signal["state"]("pause");
            console.log("event", v);
            if (v === "Groups") {
              filterModule.signal["msg"]("group");
              filterBar.signal["msg"]("group");
            } else if (v === "Data/Command") {
              filterModule.signal["msg"]("doc");
              filterBar.signal["msg"]("doc");
            } else {
              console.error(
                "internal error in radio for message filter setting"
              );
            }
          })
          .switch("Groups"),
      ],
    },
    {
      label: "Edge Traffic Filter",
      widgets: [
        new RadioButtonGroup("filter-edge-radio")
          .append(["Checkbox", "Slider"])
          .event((v: string) => {
            console.log("event", v);
            t.signal["state"]("pause");
            if (v === "Checkbox") {
              filterBar.signal["edge"]("checkbox");
              DisplayWidgetsForTrafficCheckbox();
            } else if (v === "Slider") {
              filterBar.signal["edge"]("slider");
              HideWidgetsForTrafficCheckbox();
            } else {
              console.error(
                "internal error in radio for edge traffic filter setting"
              );
            }
          })
          .switch("Checkbox"),
        btnSelectAllTrafficBox,
        btnUnselectAllTrafficBox,
      ],
    },
  ]);
}

function DisplayWidgetsForTrafficCheckbox() {
  btnSelectAllTrafficBox.display("inline-block");
  btnUnselectAllTrafficBox.display("inline-block");
}

function HideWidgetsForTrafficCheckbox() {
  btnSelectAllTrafficBox.hide();
  btnUnselectAllTrafficBox.hide();
}

import { LabelBox } from "widget/labelbox";
import { RadioButtonGroup } from "widget/radiobutton";
import { NormalButton } from "widget/normalbutton";
import { Module, Element } from "global";
import {
  SwitchTrafficFilterCheckboxes,
  FlipTrafficFilterCheckboxes,
} from "filterbar/filterbar";

const NumLevels = 10;

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

let btnFlipAllTrafficBox = new NormalButton("btn-flip-edge-cb")
  .append("Flip All")
  .style("margin-top", "0.4em")
  .style("margin-bottom", "0.4em")
  .event(() => FlipTrafficFilterCheckboxes())
  .hide();

export default function RenderSettingFilterSection() {
  return new LabelBox("filter-setting").append([
    {
      label: "Message Filter",
      widgets: [
        new RadioButtonGroup("filter-msg-radio")
          .append(["Groups", "Data/Command"])
          .event((v: string) => {
            console.log("event", v);
            if (v === "Groups") {
              Module.filterMsg.signal["msg"]("group");
              Element.filterbar.signal["msg"]("group");
            } else if (v === "Data/Command") {
              Module.filterMsg.signal["msg"]("doc");
              Element.filterbar.signal["msg"]("doc");
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
            if (v === "Checkbox") {
              Element.filterbar.signal["edge"]("checkbox");
              DisplayWidgetsForTrafficCheckbox();
            } else if (v === "Slider") {
              Element.filterbar.signal["edge"]("slider");
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
        btnFlipAllTrafficBox,
      ],
    },
  ]);
}

function DisplayWidgetsForTrafficCheckbox() {
  btnSelectAllTrafficBox.display("inline-block");
  btnUnselectAllTrafficBox.display("inline-block");
  btnFlipAllTrafficBox.display("inline-block");
}

function HideWidgetsForTrafficCheckbox() {
  btnSelectAllTrafficBox.hide();
  btnUnselectAllTrafficBox.hide();
  btnFlipAllTrafficBox.hide();
}

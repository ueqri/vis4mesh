import { InputBoxWithFloatingLabel } from "widget/input";
import { LabelBox } from "widget/labelbox";
import { RadioButtonGroup } from "widget/radiobutton";
import { Component } from "global";

export default function RenderSettingPlayerSection() {
  const t = Component.ticker;
  return new LabelBox("player-setting").append([
    {
      label: "Speed: rate of ticks per second",
      widgets: [
        new RadioButtonGroup("player-speed-radio")
          .append(["1X", "2X", "4X"])
          .event((v: string) => {
            console.log("event", v);
            t.signal["state"]("pause");
            if (v === "1X") {
              t.signal["speed"](1);
            } else if (v === "2X") {
              t.signal["speed"](2);
            } else if (v === "4X") {
              t.signal["speed"](4);
            } else {
              console.error("internal error in radio for speed setting");
            }
          })
          .switch("1X"),
      ],
    },
    {
      label: "Step: rate of time slices per tick",
      widgets: [
        new InputBoxWithFloatingLabel("player-step-input")
          .append({
            label: "time slices per tick",
            placeholder: "1",
          })
          .event((v: string) => {
            t.signal["state"]("pause");
            const step = Number(v);
            if (Number.isNaN(step)) {
              console.error("NaN is not allowed for step setting");
            } else {
              t.signal["step"](step);
            }
          }),
      ],
    },
    {
      label: "Mode: tick slice or tick end time",
      widgets: [
        new RadioButtonGroup("player-mode-radio")
          .append(["Slice Tick", "Range Tick"])
          .event((v: string) => {
            console.log("event", v);
            t.signal["state"]("pause");
            if (v === "Slice Tick") {
              t.signal["mode"]("slice");
            } else if (v === "Range Tick") {
              t.signal["mode"]("range");
            } else {
              console.error("internal error in radio for mode setting");
            }
          })
          .switch("Slice Tick"),
      ],
    },
  ]);
}

import { InputBoxWithFloatingLabel } from "../../widget/input";
import { LabelBox } from "../../widget/labelbox";
import { RadioButtonGroup } from "../../widget/radiobutton";
import { Ticker } from "../../timebar/ticker";

export default function RenderSettingPlayerSection(t: Ticker) {
  return new LabelBox("player-setting").append([
    {
      label: "Speed: rate of ticks per second",
      widgets: [
        new RadioButtonGroup("player-speed-radio")
          .append(["1X", "2X", "4X"])
          .switch("1X")
          .event((v: string) => {
            t.signal["state"]("pause");
            console.log(v);
            if (v === "1X") {
              t.signal["speed"](1);
            } else if (v === "2X") {
              t.signal["speed"](2);
            } else if (v === "4X") {
              t.signal["speed"](4);
            } else {
              console.error("internal error in radio for speed setting");
            }
          }),
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
          .switch("Slice Tick")
          .event((v: string) => {
            console.log(v);

            t.signal["state"]("pause");
            if (v === "Slice Tick") {
              t.signal["mode"]("slice");
            } else if (v === "Range Tick") {
              t.signal["mode"]("range");
            } else {
              console.error("internal error in radio for mode setting");
            }
          }),
      ],
    },
  ]);
}

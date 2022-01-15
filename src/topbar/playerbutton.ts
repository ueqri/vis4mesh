import * as d3 from "d3";
import { FlipButton } from "../widget/flipbutton";
import Ticker from "../timebar/ticker";

const PlaySVG: string = require("../../public/icon/play.svg");
const StopSVG: string = require("../../public/icon/stop.svg");

export default function RenderPlayerButton(t: Ticker): FlipButton {
  let flip = new FlipButton("player-button");

  d3.select("#player-status").append(() =>
    flip
      .append([
        {
          name: "Play", // clicking this icon means to play
          color: "btn-secondary",
          html: `<img src="${PlaySVG}" />`,
        },
        {
          name: "Pause",
          color: "btn-primary",
          html: `<img src="${StopSVG}" />`,
        },
      ])
      .event((v: string) => {
        if (v === "Play") {
          // if `Play` icon is clicked
          t.signal["state"]("auto");
        } else if (v === "Pause") {
          t.signal["state"]("pause");
        }
      })
      .node()
  );
  return flip;
}

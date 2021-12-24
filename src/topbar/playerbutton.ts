import * as d3 from "d3";
import { FlipButton } from "../widget/flipbutton";
import Ticker from "../timebar/ticker";

export default function RenderPlayerButton(t: Ticker): FlipButton {
  // TODO: SVG to file
  let flip = new FlipButton("player-button");
  d3.select("#player-status").append(() =>
    flip
      .append([
        {
          name: "Play", // clicking this icon means to play
          color: "btn-secondary",
          html: `<svg transform="scale(1.2)" xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" fill="white" class="bi bi-play" viewBox="0 0 16 16">
      <path d="M10.804 8 5 4.633v6.734L10.804 8zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692z"/>
    </svg>`,
        },
        {
          name: "Pause",
          color: "btn-primary",
          html: `<svg transform="scale(1.2)" xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" fill="white" class="bi bi-pause" viewBox="0 0 16 16">
      <path d="M6 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5z"/>
    </svg>`,
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

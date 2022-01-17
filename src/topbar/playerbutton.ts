import * as d3 from "d3";
import { FlipButton } from "../widget/flipbutton";
import { Component } from "global";

const PlaySVG: string = require("../../public/icon/play.svg");
const StopSVG: string = require("../../public/icon/stop.svg");

export default function RenderPlayerButton() {
  const t = Component.ticker;
  const flip = new FlipButton("player-button");

  // Render HTML element
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
      .static("Play")
      .node()
  );

  // Register other events of player button
  let state: boolean = false;
  t.setStatusChangeCallback((running) => {
    flip.static(running ? "Pause" : "Play");
    state = running;
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === " " || event.key === "p") {
      if (state === true) {
        t.signal["state"]("pause");
      } else {
        t.signal["state"]("auto");
      }
    }
  });
}

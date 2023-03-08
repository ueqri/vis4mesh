import * as d3 from "d3";
import { FlipButton } from "../widget/flipbutton";

export default function RenderMainViewToggleButton() {
  const flip = new FlipButton("mainview-toggle-button");

  d3.select("#mainview-toggle").append(() =>
    flip
      .append([
        {
          name: "Minimize", // clicking this icon means to minimize bird view
          color: "btn-secondary",
          html: "Minimize Bird View",
        },
        {
          name: "Show",
          color: "btn-secondary",
          html: "Show Bird View",
        },
      ])
      .event((v: string) => {
        if (v === "Minimize") {
          // if `Minimize` icon is clicked
          d3.select("#minimap").style("display", "none");
        } else if (v === "Show") {
          d3.select("#minimap").style("display", null);
        }
      })
      .switch("Show")
      .node()
  );
}

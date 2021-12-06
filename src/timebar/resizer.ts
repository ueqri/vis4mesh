import * as d3 from "d3";
export type DivSelection = d3.Selection<d3.BaseType, unknown, HTMLElement, any>;

export default function RegisterResizerEvent(
  div: DivSelection,
  resizer: DivSelection,
  callback: (delta: number) => any
) {
  const container = div.node() as HTMLElement;

  resizer
    .on("mouseover", function () {
      d3.select(this).transition().style("background-color", "#bdbdbd");
    })
    .on("mousedown", resizerMouseEvent())
    .on("mouseout", function () {
      d3.select(this).transition().style("background-color", null);
    });

  function resizerMouseEvent() {
    let y = 0; // current mouse position
    let h = 0; // dimension of the div element

    // Handle the mousedown event triggered when user drags the resizer
    const mouseDownHandler = function (e: any) {
      // Get the current mouse position
      y = e.clientY;

      // Calculate the dimension of element
      const styles = window.getComputedStyle(container);
      h = parseInt(styles.height, 10);

      // Attach the listeners to `document`
      document.addEventListener("mousemove", mouseMoveHandler);
      document.addEventListener("mouseup", mouseUpHandler);
    };

    const mouseMoveHandler = function (e: any) {
      // How far the mouse has been moved
      const dy = y - e.clientY;

      // Adjust the dimension of element
      if (h + dy >= 65) {
        container.style.height = `${h + dy}px`;
        callback(dy); // trigger callback, e.g. resize the SVG
      } else {
        container.style.height = "0px"; // assume it as the hidden action
      }
    };

    const mouseUpHandler = function () {
      // Remove the handlers of `mousemove` and `mouseup`
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
    };

    return mouseDownHandler;
  }
}

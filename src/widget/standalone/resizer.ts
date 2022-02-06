import * as d3 from "d3";
export type DivSelection = d3.Selection<d3.BaseType, unknown, HTMLElement, any>;

export interface ResizableContainer {
  div: DivSelection;
  // Calculate dimension of container after resizing
  calc: ([w, h, dx, dy]: [number, number, number, number]) => [number, number];
  callback: ([w, h]: [number, number]) => any; // callback after resizing
}

export default function RegisterResizerEvent(
  resizer: DivSelection,
  containers: ResizableContainer[]
) {
  resizer
    .on("mouseover", function () {
      d3.select(this).transition().style("background-color", "#bdbdbd");
    })
    .on("mousedown", resizerMouseEvent())
    .on("mouseout", function () {
      d3.select(this).transition().style("background-color", null);
    });

  function resizerMouseEvent() {
    let pos = [0, 0]; // current mouse position
    let dims: Array<[number, number]>; // dimension of the div element

    // Handle the mousedown event triggered when user drags the resizer
    const mouseDownHandler = function (e: any) {
      // Get the current mouse position
      pos[0] = e.clientX;
      pos[1] = e.clientY;
      dims = new Array<[number, number]>();

      // Calculate the dimension of element
      containers.forEach((c) => {
        const styles = window.getComputedStyle(c.div.node() as HTMLElement);
        dims.push([parseInt(styles.width, 10), parseInt(styles.height, 10)]);
      });

      // Attach the listeners to `document`
      document.addEventListener("mousemove", mouseMoveHandler);
      document.addEventListener("mouseup", mouseUpHandler);
    };

    const mouseMoveHandler = function (e: any) {
      // How far the mouse has been moved
      const [dx, dy] = [e.clientX - pos[0], e.clientY - pos[1]];

      // Adjust the dimension of element
      containers.forEach((c, i) => {
        const container = c.div.node() as HTMLElement;
        const dim = c.calc([dims[i][0], dims[i][1], dx, dy]);
        container.style.width = `${dim[0]}px`;
        container.style.height = `${dim[1]}px`;
        // Trigger callback, e.g. resize the SVG
        c.callback(dim);
      });
    };

    const mouseUpHandler = function () {
      // Remove the handlers of `mousemove` and `mouseup`
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
    };

    return mouseDownHandler;
  }
}

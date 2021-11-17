import * as noUiSlider from "nouislider";
import "nouislider/dist/nouislider.css";

// SmartSlider supports multiple handles and binding input box respectively
export class SmartSlider {
  protected slider: noUiSlider.API;

  constructor(div: HTMLElement, length: number, handlePos: number[]) {
    this.slider = noUiSlider.create(div, {
      start: handlePos,
      step: 1,
      behaviour: "drag-tap",
      connect: true,
      range: {
        min: 0,
        max: length,
      },
      pips: {
        mode: "count" as noUiSlider.PipsMode.Count,
        values: 5,
        density: 1,
      },
    });
  }

  updateStyle(custom: (s: noUiSlider.API) => void) {
    custom(this.slider);
  }

  bindInput(inputs: HTMLInputElement[]) {
    let slider = this.slider;
    slider.on("update", function (values, handle) {
      inputs[handle].value = values[handle] as string;
    });

    // Listen to keydown events on the input field
    inputs.forEach(function (input, handle) {
      input.addEventListener("change", function () {
        slider.setHandle(handle, this.value);
      });

      input.addEventListener("keydown", function (e) {
        let values = slider.get();
        let value = Number(values[handle]);

        // Although `slider.steps()` is not necessary for linear sliders as
        // the step is always constant in that case, we leave the opportunity
        // here for the possible features. For reference, see here:
        // https://refreshless.com/nouislider/examples/#section-steps-api

        // [[handle0_down, handle0_up], [handle1_down, handle1_up]]
        let steps = slider.steps();

        // [down, up]
        let step = steps[handle];

        let position;

        switch (e.key) {
          case "Enter":
            slider.setHandle(handle, this.value);
            break;

          case "ArrowUp":
          case "ArrowLeft":
            // Get step to go increase slider value (up)
            position = step[1];

            // false = no step is set
            if (position === false) {
              position = 1;
            }

            // null = edge of slider
            if (position !== null) {
              slider.setHandle(handle, value + position);
            }

            break;

          case "ArrowDown":
          case "ArrowRight":
            position = step[0];

            if (position === false) {
              position = 1;
            }

            if (position !== null) {
              slider.setHandle(handle, value - position);
            }

            break;
        }
      });
    });
  }

  setLeft(val: number) {
    this.slider.set([val, null!]);
  }

  setRight(val: number) {
    this.slider.set([null!, val]);
  }
}

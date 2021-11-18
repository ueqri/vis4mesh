import * as noUiSlider from "nouislider";
import "nouislider/dist/nouislider.css";

// SmartSlider supports multiple handles and binding input box respectively
export class SmartSlider {
  protected slider: noUiSlider.API;
  protected noFireCallbacks: boolean;

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

    this.noFireCallbacks = false;
  }

  updateStyle(custom: (s: noUiSlider.API) => void) {
    custom(this.slider);
  }

  protected checkFireCallbacks = () => {
    return !this.noFireCallbacks;
  };

  // Due to the tight coupling of noUiSlider and input view box in this version,
  // we use standalone methods for these two widgets instead of unified abstract
  // method. `callbacks` are value change event callbacks for each input box.
  bindInput(inputs: HTMLInputElement[], callbacks: ((v: number) => void)[]) {
    let slider = this.slider;
    let checkFireCallbacks = this.checkFireCallbacks;
    slider.on("update", function (values, handle) {
      const valInt = parseInt(values[handle] as string);
      inputs[handle].value = `${valInt}`;
      if (checkFireCallbacks()) {
        callbacks[handle](valInt);
        console.log("slider update event");
      }
    });

    // Listen to keydown events on the input field
    inputs.forEach(function (input, handle) {
      input.addEventListener("change", function () {
        slider.setHandle(handle, this.value);
        console.log("input change event");
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
          case "ArrowDown":
          case "ArrowRight":
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

          case "ArrowUp":
          case "ArrowLeft":
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

  // these two methods wouldn't fire callbacks in `update` event of slider
  setLeft(val: number) {
    this.noFireCallbacks = true;
    this.slider.set([val, null!]);
    this.noFireCallbacks = false;
  }

  setRight(val: number) {
    this.noFireCallbacks = true;
    this.slider.set([null!, val]);
    this.noFireCallbacks = false;
  }
}

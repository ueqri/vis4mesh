import * as d3 from "d3";
import Event from "event";

const ev = {
  EdgeTrafficCheckbox: "FilterETCheckbox",
};

interface CheckboxData {
  lv: number;
  upper: number;
  checked: boolean;
}

const NumLevels = 10;
const TrafficLevelDomain = Array.from(Array(NumLevels).keys());

const c = {
  boxWidth: 40,
  boxHeight: 20,
  boxPadding: 0,
  yPadding: 8,
};

function colorOf(lv: number): string {
  return d3.interpolateReds((lv+1)/10);
}

const svg = d3
  .create("svg")
  .attr(
    "viewBox",
    `0 0 ${c.boxWidth * 1.5} ${c.boxHeight * NumLevels + 2 * c.yPadding}`
  );

const g = svg.append("g");

class EdgeTrafficCheckboxes {
  data: Array<CheckboxData>;

  constructor() {
    this.data = new Array<CheckboxData>();

    TrafficLevelDomain.forEach((lv) => {
      this.data.push({
        lv: lv,
        upper: 0,
        checked: true,
      });
    });

    this.render(this.data);
  }

  protected updateTrafficCheckbox(lv: number, checked: boolean) {
    this.data[lv].checked = checked;
    Event.FireEvent(ev.EdgeTrafficCheckbox, this.selected());
  }

  protected render(data: CheckboxData[]) {
    const size = c.boxHeight + c.boxPadding;
    const rectID = (lv: number) => {
      return `rect-etl-${lv}`;
    };
    const mapY = (lv: number) => {
      return (9 - lv) * size + c.yPadding;
    };
    const mapLv = (y: number) => {
      return 9 - Math.floor((y - c.yPadding) / size);
    };
    const handle = (lv: number, checked: boolean) => {
      this.updateTrafficCheckbox(lv, checked);
    };

    // console.log(data);

    // Box
    g.selectAll("rect")
      .data(data)
      .join(
        function (enter) {
          return enter
            .append("rect")
            .attr("id", function (d) {
              return rectID(d.lv);
            })
            .attr("width", c.boxWidth)
            .attr("height", c.boxHeight)
            .attr("stroke", "#ccc")
            .attr("stroke-width", "0.25%");
        },
        function (update) {
          return update;
        },
        function (exit) {
          return exit.on("end", function () {
            d3.select(this).remove();
          });
        }
      )
      .attr("x", 0)
      .attr("y", function (d) {
        return mapY(d.lv);
      })
      .attr("fill", function (d) {
        return d.checked === true ? colorOf(d.lv) : "none";
      });

    svg.on("click", (event) => {
      const [x, y] = d3.pointer(event);
      if (x <= c.boxWidth) {
        const lv = mapLv(y);
        const rect = d3.select(`#${rectID(lv)}`);
        if (this.data[lv].checked === false) {
          rect.transition().attr("fill", colorOf(lv));
          handle(lv, true);
        } else {
          rect.transition().attr("fill", "none");
          handle(lv, false);
        }
      }
    });

    // Label
    g.selectAll(".legend-label")
      .data(data.concat({ lv: -1, upper: 0, checked: true }))
      .join(
        function (enter) {
          return enter
            .append("text")
            .attr("class", "legend-label")
            .attr("dominant-baseline", "middle");
        },
        function (update) {
          return update;
        },
        function (exit) {
          return exit.on("end", function () {
            d3.select(this).remove();
          });
        }
      )
      .attr("x", c.boxWidth + 2)
      .attr("y", function (d) {
        return mapY(d.lv);
      })
      .text(function (d) {
        const format = d3.format(".3s")(d.upper);
        const len = format.length;
        const trans = Number(format);
        if (Number.isNaN(trans) === true) {
          const prefix = format.substring(0, len - 1);
          return `${Number(prefix)}${format.charAt(len - 1)}`;
        } else {
          return trans;
        }
      });
  }

  selected(): number[] {
    return TrafficLevelDomain.filter((lv) => this.data[lv].checked);
  }

  node(): SVGSVGElement {
    return svg.node()!;
  }

  applyUpperBound(uppers: number[]) {
    uppers.forEach((u, i) => {
      this.data[i].upper = u;
    });
    this.render(this.data);
  }

  switch(checkedMap: boolean[]) {
    checkedMap.forEach((checked, i) => {
      this.data[i].checked = checked;
    });
    this.render(this.data);
    Event.FireEvent(ev.EdgeTrafficCheckbox, this.selected());
  }

  flip() {
    this.data.forEach((d, i) => {
      d.checked = !d.checked;
    });
    this.render(this.data);
    Event.FireEvent(ev.EdgeTrafficCheckbox, this.selected());
  }
}

export default new EdgeTrafficCheckboxes();

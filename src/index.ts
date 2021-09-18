import G6 from "@antv/g6";
import insertCss from "insert-css";

import data from "./content.json";

//
// Global Variables & Initiations
//

const edgeWidth = 7;
const colorPalette = [
  "#ab162a",
  "#cf5246",
  "#eb9172",
  "#fac8af",
  "#faeae1",
  "#e6eff4",
  "#bbdaea",
  "#7bb6d6",
  "#3c8abe",
  "#1e61a5",
];
data.edges.forEach(item => {
  item.style = {}
  item.style.stroke = colorPalette[9-item.value]
})

//
// Plugins
//

const toolbar = new G6.ToolBar();

insertCss(`
  .g6-component-tooltip {
    background-color: rgba(255, 255, 255, 0.8);
    padding: 0px 10px 24px 10px;
    box-shadow: rgb(174, 174, 174) 0px 0px 10px;
  }
`);
const tooltip = new G6.Tooltip({
  offsetX: 10,
  offsetY: 10,
  trigger: "click",
  // the types of items that allow the tooltip show up
  itemTypes: ["node", "edge"],
  // custom the tooltip's content
  getContent: (e) => {
    const outDiv = document.createElement("div");
    outDiv.style.width = "fit-content";
    //outDiv.style.padding = '0px 0px 20px 0px';
    const type = e.item.getType();
    const model = e.item.getModel();

    if (type == "node") {
      outDiv.innerHTML = `
      <h4>Node Info</h4>
      <p>Status: ${model.details}</p>`;
    } else if (type == "edge") {
      outDiv.innerHTML = `
      <h4>Edge Info</h4>
      <p>Status: ${model.details}</p>`;
    }
    return outDiv;
  },
});

const legendData = {
  edges: [
    {
      id: "eType0",
      label: "Extremely-high Crowded",
    },
    {
      id: "eType1",
      label: "High Crowded",
    },
    {
      id: "eType2",
      label: "Moderate Crowded",
    },
    {
      id: "eType3",
      label: "Low Crowded",
    },
    {
      id: "eType4",
      label: "Slightly Crowded",
    },
    {
      id: "eType5",
      label: "Slightly Idle",
    },
    {
      id: "eType6",
      label: "Low Idle",
    },
    {
      id: "eType7",
      label: "Moderate Idle",
    },
    {
      id: "eType8",
      label: "High Idle",
    },
    {
      id: "eType9",
      label: "Extremely-high Idle",
    },
  ],
};
const legendEdgeWidth = 10;
legendData.edges.forEach((item, idx) => {
  item.style = {
    lineWidth: legendEdgeWidth,
    width: legendEdgeWidth,
    stroke: colorPalette[idx],
  };
});
const legend = new G6.Legend({
  data: legendData,
  align: "center",
  layout: "horizontal", // vertical
  position: "bottom-left",
  vertiSep: 12,
  horiSep: 24,
  offsetY: -1,
  padding: [4, 16, 8, 16],
  containerStyle: {
    fill: "#ccc",
    lineWidth: 1,
  },
  title: "Legend",
  titleConfig: {
    position: "center",
    offsetX: 0,
    offsetY: 12,
  },
  filter: {
    enable: true,
    multiple: true,
    trigger: "click",
    graphActiveState: "activeByLegend",
    graphInactiveState: "inactiveByLegend",
    filterFunctions: {
      eType0: (d) => {
        if (d.value === 9) return true;
        return false;
      },
      eType1: (d) => {
        if (d.value === 8) return true;
        return false;
      },
      eType2: (d) => {
        if (d.value === 7) return true;
        return false;
      },
      eType3: (d) => {
        if (d.value === 6) return true;
        return false;
      },
      eType4: (d) => {
        if (d.value === 5) return true;
        return false;
      },
      eType5: (d) => {
        if (d.value === 4) return true;
        return false;
      },
      eType6: (d) => {
        if (d.value === 3) return true;
        return false;
      },
      eType7: (d) => {
        if (d.value === 2) return true;
        return false;
      },
      eType8: (d) => {
        if (d.value === 1) return true;
        return false;
      },
      eType9: (d) => {
        if (d.value === 0) return true;
        return false;
      },
    },
  },
});

//
// Graph Config
//

const container = document.getElementById("mountNode");
const width = container.scrollWidth;
const height = container.scrollHeight || 1250;

const graph = new G6.Graph({
  container: "mountNode",
  width,
  height,
  modes: {
    default: ["zoom-canvas", "drag-canvas"],
  },
  layout: {
    type: "grid",
    begin: [0, 0],
    rows: 8,
    cols: 8,
    preventOverlap: true,
    preventOverlapPdding: 20,
    condense: false,
    sortBy: "weight",
    width: width - 20,
    height: height - 20,
  },
  animate: true,
  defaultNode: {
    style: {
      opacity: 0.2,
      fill: "#8fbdd1",
      stroke: "#599dbb",
      lineWidth: 4,
    },
    size: 52,
  },
  defaultEdge: {
    style: {
      stroke: "#8fb2d1",
      lineWidth: edgeWidth,
    },
    labelCfg: {
      position: "end",
      refY: -10,
    },
  },
  edgeStateStyles: {
    activeByLegend: {
      lineWidth: edgeWidth * 1.6,
      strokeOpacity: 0.72,
    },
    inactiveByLegend: {
      opacity: 0.12,
    },
    active: {
      fill: "LightCoral",
      stroke: "LightCoral",
      lineWidth: edgeWidth,
      shadowColor: 'LightCoral',
      shadowBlur: 9,
    },
  },
  plugins: [toolbar, tooltip, legend],
});

graph.data(data);
graph.render();

//
// Events
//

graph.on("node:mouseenter", (e) => {
  graph.setItemState(e.item, "active", true);
});
graph.on("node:mouseleave", (e) => {
  graph.setItemState(e.item, "active", false);
});
graph.on("edge:mouseenter", (ev) => {
  graph.setItemState(ev.item, "active", true);
});
graph.on("edge:mouseleave", (ev) => {
  graph.setItemState(ev.item, "active", false);
});

//
// Resize
//

if (typeof window !== "undefined")
  window.onresize = () => {
    if (!graph || graph.get("destroyed")) return;
    if (!container || !container.scrollWidth || !container.scrollHeight) return;
    graph.changeSize(container.scrollWidth, container.scrollHeight);
  };

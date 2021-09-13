import G6 from '@antv/g6';

const data = {
  nodes: [
    {
      id: '0',
      label: 'Switch3',
    },
    {
      id: '1',
      label: 'Switch2',
    },
    {
      id: '2',
      label: 'Switch1',
    },
    {
      id: '3',
      label: 'Switch0',
    },
  ],
  edges: [
    {
      source: '0',
      target: '1',
    },
    {
      source: '0',
      target: '2',
    },
    {
      source: '3',
      target: '2',
    },
    {
      source: '1',
      target: '3',
    },
  ],
};

const container = document.getElementById('mountNode');
const width = container.scrollWidth;
const height = container.scrollHeight || 1200;
const graph = new G6.Graph({ 
  container: 'mountNode',
  width,
  height,
  modes: {
    default: ['zoom-canvas', 'drag-canvas'],
  },
  layout: {
    type: 'grid',
    begin: [0, 0],
    rows: 2,
    cols: 2,
    preventOverlap: true,
    preventOverlapPdding: 20,
    condense: false,
    sortBy: 'id',
    width: width - 20,
    height: height - 20,
  },
  animate: true,
  defaultNode: {
    style: {
      opacity: 0.2,
      fill: '#8fbdd1',
      stroke: '#599dbb',
      lineWidth: 5,
    },
    size: 60,
  },
  defaultEdge: {
    style: {
      stroke: '#8fb2d1',
      lineWidth: 7,
    },
    labelCfg: {
      position: 'end',
      refY: -10,
    },
  },
});

graph.data(data);
graph.render();

if (typeof window !== 'undefined')
  window.onresize = () => {
    if (!graph || graph.get('destroyed')) return;
    if (!container || !container.scrollWidth || !container.scrollHeight) return;
    graph.changeSize(container.scrollWidth, container.scrollHeight);
  };

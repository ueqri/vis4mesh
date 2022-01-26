export default class AbstractNode {
  id: number;
  link: Array<NodeLink>;
  allocX: number;
  allocY: number;
  include: Array<AbstractNode>;
  label: string;

  constructor(id: number, label?: string) {
    this.id = id;
    this.link = new Array<NodeLink>();
    this.allocX = this.allocY = 1;
    this.include = new Array<AbstractNode>();
    this.label = label === undefined ? `${id}` : label;
  }
}

export interface NodeLink {
  dst: number;
  weight: number; // real count before normalization
  label: string;
}

export function PackNodes(nodes: AbstractNode[], label?: string): AbstractNode {
  // Check length of node list
  if (nodes.length <= 1) {
    console.error("PackNodes only accepts node list with length > 1");
  }

  // Assume all nodes are adjacent
  nodes.sort((a, b) => a.id - b.id);

  // Use head ID of the nodes as group node ID
  const id = nodes[0].id;
  if (label === undefined) {
    label = `G${id}`;
  }
  let g = new AbstractNode(id, label);

  // Calculate block size
  for (let idx = 1; idx < nodes.length; idx++) {
    if (nodes[idx].id - nodes[idx - 1].id !== 1) {
      g.allocY++; // line break is encountered
    }
  }
  g.allocX = nodes.length / g.allocY;
  console.log(`${g.allocX} * ${g.allocY}`);

  // Remove the interior links
  let inside: { [id: number]: boolean } = {};
  nodes.forEach((d) => {
    g.include.push(d);
    inside[d.id] = true;
    g.link = [...g.link, ...d.link];
  });
  g.link = g.link.filter((lk) => inside[lk.dst] !== true);

  return g;
}

export function RedirectLinkAfterPack(nodes: AbstractNode[]) {
  let locate: { [id: number]: number } = {};
  nodes.forEach((d) => {
    if (d.include.length != 0) {
      // Only shallow locating, i.e. the deep nodes won't be added recursively
      d.include.forEach((inside) => (locate[inside.id] = d.id));
    }
  });

  nodes.forEach((d) => {
    let count: { [dst: number]: number } = {};
    let linkMap: { [dst: number]: NodeLink } = {};
    d.link.forEach((lk) => {
      // Redirect links if connecting to a packed node
      if (locate[lk.dst] !== undefined) {
        lk.dst = locate[lk.dst];
      }
      // Squash the links with the same destination
      if (linkMap[lk.dst] === undefined) {
        linkMap[lk.dst] = lk;
        count[lk.dst] = 1;
      } else {
        linkMap[lk.dst].weight += lk.weight;
        linkMap[lk.dst].label = MergeTwoNodeLinkLabel(
          linkMap[lk.dst].label,
          lk.label
        );
      }
    });
    d.link = Object.values(linkMap);
    d.link.forEach((lk) => {
      lk.weight = Math.round(lk.weight / count[lk.dst]); // average weight
    });
  });
}

function MergeTwoNodeLinkLabel(labelA: string, labelB: string): string {
  let merge = (Number(labelA) + Number(labelB)).toString();
  return merge === "0" ? "" : merge;
}

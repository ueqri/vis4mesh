export default class AbstractNode {
  id: number;
  link: Array<NodeLink>;
  // `baseLink` stores full link information with exact destination no matter
  // the node is packed or single, while `link` stores the squashed links for
  // render engine to display. In other word, `link` is derived from `baseLink`.
  protected baseLink: Array<NodeLink>;
  allocX: number;
  allocY: number;
  include: Array<AbstractNode>;
  record: Array<number>;
  label: string;

  constructor(id: number, label?: string) {
    this.id = id;
    this.link = new Array<NodeLink>();
    this.baseLink = new Array<NodeLink>();
    this.allocX = this.allocY = 1;
    this.include = new Array<AbstractNode>();
    this.record = [id];
    this.label = label === undefined ? `${id}` : label;
  }

  AppendBaseLink(lk: NodeLink): void {
    this.baseLink.push(lk);
  }

  CloneBaseLink(): void {
    this.link = new Array<NodeLink>();
    this.baseLink.forEach((lk) => {
      // Clone link object instead of copying reference
      this.link.push(Object.assign({}, lk));
    });
  }

  GetBaseLink(): readonly NodeLink[] {
    return this.baseLink;
  }

  RebuildBaseLink() {
    // Remove interior links of a packed node
    if (this.include.length !== 0) {
      console.log(`${this} is a packed node`);
      let inside: { [id: number]: boolean } = {};
      this.include.forEach((d) => {
        inside[d.id] = true;
        this.baseLink = [...this.baseLink, ...d.GetBaseLink()];
      });
      this.baseLink = this.baseLink.filter((lk) => inside[lk.dst] !== true);
    }
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
      // TODO: support more flexible pack, instead of pack the base node
    }
  }
  g.allocX = nodes.length / g.allocY;
  console.log(`${g.allocX} * ${g.allocY}`);

  // Store nodes and rebuild base links
  nodes.forEach((d) => {
    g.include.push(d);
    g.record = [...g.record, ...d.record];
  });
  g.RebuildBaseLink();

  return g;
}

export function UnpackNode(node: AbstractNode): AbstractNode[] {
  if (node.include.length == 0) {
    console.warn("Unpacking base node is an undefined behavior");
  }
  return node.include;
}

export function ReestablishLinks(nodes: AbstractNode[]) {
  let locate: { [id: number]: number } = {};
  nodes.forEach((d) => {
    d.record.forEach((rec) => {
      locate[rec] = d.id; // the deep nodes would be added recursively
    });
  });

  nodes.forEach((d) => {
    let count: { [dst: number]: number } = {};
    let linkMap: { [dst: number]: NodeLink } = {};
    // Use full information to squash links, especially after **unpacking**
    d.CloneBaseLink();
    d.link.forEach((lk) => {
      // Redirect links if connecting to a packed node
      lk.dst = locate[lk.dst];
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

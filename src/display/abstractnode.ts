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
  record: Array<number>; // record IDs of nodes recursively
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
      let inside: { [id: number]: boolean } = {};
      const length = this.include.length;
      for (let idx = 0; idx < length; idx++) {
        const d = this.include[idx];
        inside[d.id] = true;
        this.baseLink = [...this.baseLink, ...d.GetBaseLink()];
      }
      this.baseLink = this.baseLink.filter((lk) => inside[lk.dst] !== true);
    }
  }
}

export interface NodeLink {
  dst: number;
  weight: number; // real count before normalization
  label: string;
}

export function PackNodes(
  nodes: AbstractNode[],
  gridDim: number, // the information is necessary to calculate block size
  label?: string
): AbstractNode {
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

  // Store nodes and rebuild base links
  g.record = []; // clear array since it is not empty after class construction
  nodes.forEach((d) => {
    g.include.push(d);
    g.record = [...g.record, ...d.record];
  });
  g.RebuildBaseLink();

  // Calculate block size
  let inside: { [id: number]: boolean } = {};
  g.record.forEach((rec) => (inside[rec] = true));
  for (let row = 1; row <= gridDim; row++) {
    if (inside[row * gridDim + id] !== true) {
      g.allocY = row;
      break;
    }
  }
  g.allocX = g.record.length / g.allocY;
  console.log(`${g.allocX} * ${g.allocY}`);

  return g;
}

export function UnpackNode(node: AbstractNode): AbstractNode[] {
  if (node.include.length === 0) {
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

//
// Easy shorthand for packing and unpacking operations
//

export function PackNodesWithIDs(
  nodeMap: { [id: number]: AbstractNode },
  ids: number[],
  gridDim: number
) {
  // Pack nodes
  let nodes = new Array<AbstractNode>();
  ids.forEach((id) => {
    nodes.push(nodeMap[id]);
    delete nodeMap[id];
  });
  let g = PackNodes(nodes, gridDim);
  nodeMap[g.id] = g;
  // console.log(nodeMap);
  // ReestablishLinks(Object.values(nodeMap));
}

export function UnpackNodeWithID(
  nodeMap: { [id: number]: AbstractNode },
  id: number
) {
  let target = nodeMap[id];
  if (target.record.length > 1) {
    delete nodeMap[id];
    UnpackNode(target).forEach((d) => (nodeMap[d.id] = d));
    // ReestablishLinks(Object.values(nodeMap));
  }
}

// Notice: only for block generation from base nodes
export function GenerateBlockListsFromBaseNodes(
  blockDim: number,
  gridDim: number
): Array<Array<number>> {
  if (blockDim === 0) {
    console.error("Zero is not a valid block dimension");
    return [[]];
  }
  let grid = new Array<Array<number>>();
  const blockRowSize = blockDim * gridDim;
  const dim = gridDim / blockDim;
  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) {
      const leftTopID = i * blockRowSize + j * blockDim;
      grid.push(
        GenerateSingleBlockOfBaseNodesByLeftTopID(leftTopID, blockDim, gridDim)
      );
    }
  }
  return grid;
}

// Notice: only for block generation from base nodes
function GenerateSingleBlockOfBaseNodesByLeftTopID(
  id: number,
  blockDim: number,
  gridDim: number
): number[] {
  let block = new Array<number>();
  for (let i = 0; i < blockDim; i++) {
    const rowBegin = id + i * gridDim;
    for (let j = 0; j < blockDim; j++) {
      block.push(rowBegin + j);
    }
  }
  return block;
}

export function GenerateBlockListsFromNonBaseNodes(
  blockDim: number,
  deflatedGridDim: number,
  largeGridDim: number
): Array<Array<number>> {
  if (blockDim === 0) {
    console.error("Zero is not a valid block dimension");
    return [[]];
  }
  let grid = new Array<Array<number>>();
  // 1 for base node
  const deflatedBlockDim = largeGridDim / deflatedGridDim;
  // gridDim for base node
  const deflatedBlockRowSize = deflatedBlockDim * largeGridDim;
  // gridDim * blockDim for base node
  const realBlockRowSize = deflatedBlockDim * largeGridDim * blockDim;
  // blockDim for base node
  const realBlockDim = blockDim * deflatedBlockDim;
  const dim = deflatedGridDim / blockDim;
  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) {
      const leftTopID = i * realBlockRowSize + j * realBlockDim;
      grid.push(
        GenerateSingleBlockOfNonBaseNodesByLeftTopID(
          leftTopID,
          blockDim,
          deflatedBlockRowSize,
          deflatedBlockDim
        )
      );
    }
  }
  return grid;
}

function GenerateSingleBlockOfNonBaseNodesByLeftTopID(
  id: number,
  blockDim: number,
  rowSize: number,
  deflatedBlockDim: number
): number[] {
  let block = new Array<number>();
  for (let i = 0; i < blockDim; i++) {
    const rowBegin = id + i * rowSize;
    for (let j = 0; j < blockDim; j++) {
      block.push(rowBegin + j * deflatedBlockDim);
    }
  }
  return block;
}

const step = 66;
const cover = 12;

export interface NodeBorder {
  top: number;
  down: number;
  left: number;
  right: number;
}

export enum OBDirection {
  Vertical,
  Horizontal,
  NIL,
}

interface OverLappedBorder {
  posBegin?: number;
  posEnd?: number;
  direction: OBDirection;
}

export enum Direction {
  N,
  S,
  W,
  E,
  NotAdjacent,
}

export class GridBoard {
  dim: number;
  grid: Array<Array<number>>;
  pX: number;
  pY: number;
  border: { [id: number]: NodeBorder };

  constructor(dim: number) {
    this.dim = dim;
    this.grid = new Array<Array<number>>();
    for (let i = 0; i < dim; i++) {
      let row = new Array<number>();
      for (let j = 0; j < dim; j++) {
        row.push(-1);
      }
      this.grid.push(row);
    }
    this.pX = this.pY = 0;
    this.border = {};
  }

  span() {
    return (this.dim + 1) * step;
  }

  step() {
    return step;
  }

  clear() {
    this.border = {};
    this.pX = this.pY = 0;
    for (let i = 0; i < this.dim; i++) {
      for (let j = 0; j < this.dim; j++) {
        this.grid[i][j] = -1;
      }
    }
  }

  yield(id: number, sizeX: number, sizeY: number): void {
    if (this.pY == this.dim) {
      console.error("GridBoard is full and can't yield empty position");
    } else if (sizeX <= 0 || sizeY <= 0) {
      console.error("GridBoard only yields block with positive size");
    } else {
      for (let i = this.pY; i < this.dim; i++) {
        const begin = i == this.pY ? this.pX : 0; // begin index of a row
        for (let j = begin; j < this.dim; j++)
          if (this.grid[i][j] === -1) {
            this.gridColorize(i, j, sizeX, sizeY, id);
            this.pY = i; // move pointer lazily, not exactly to empty slot
            this.pX = j;
            const baseline = {
              top: (this.pY + 1) * step,
              down: (this.pY + sizeY) * step,
              left: (this.pX + 1) * step,
              right: (this.pX + sizeX) * step,
            };
            this.border[id] = {
              top: baseline.top - cover,
              down: baseline.down + cover,
              left: baseline.left - cover,
              right: baseline.right + cover,
            };
            return;
          }
      }
    }
  }

  nodeBorder(id: number): NodeBorder {
    if (this.border[id] === undefined) {
      console.error(`GridBoard doesn't contain ${id} element`);
    }
    return this.border[id];
  }

  overlappedBorder(idA: number, idB: number): OverLappedBorder {
    const a = this.border[idA];
    const b = this.border[idB];
    // AA OR BB
    // BB    AA
    if (a.down < b.top || b.down < a.top) {
      const begin = Math.max(a.left, b.left);
      const end = Math.min(a.right, b.right);
      if (begin < end) {
        return {
          posBegin: begin,
          posEnd: end,
          direction: OBDirection.Horizontal,
        };
      }
    }
    // AB OR BA
    // AB    BA
    if (a.right < b.left || b.right < a.left) {
      const begin = Math.max(a.top, b.top);
      const end = Math.min(a.down, b.down);
      if (begin < end) {
        return {
          posBegin: begin,
          posEnd: end,
          direction: OBDirection.Vertical,
        };
      }
    }
    return { direction: OBDirection.NIL };
  }

  direction(base: number, target: number): Direction {
    switch (this.overlappedBorder(base, target).direction) {
      case OBDirection.Horizontal: {
        return base < target ? Direction.S : Direction.N;
      }
      case OBDirection.Vertical: {
        return this.border[base].right < this.border[target].left
          ? Direction.E
          : Direction.W;
      }
      default: {
        return Direction.NotAdjacent;
      }
    }
  }

  // Deflate the grid to a smaller one, e.g. blockDim is 2
  // 0  0  2  2  =>  0  2
  // 0  0  2  2      8 10
  // 8  8 10 10
  // 8  8 10 10
  // Particularly, setting blockDim to 1 would get full [0, this.dim ^ 2 ) grid
  deflate(blockDim: number) {
    const dim = this.dim / blockDim;
    const blockRowSize = blockDim * this.dim;
    let g = new Array<Array<number>>();

    this.dim = dim;
    for (let i = 0; i < dim; i++) {
      let row = new Array<number>();
      for (let j = 0; j < dim; j++) {
        row.push(-1);
      }
      g.push(row);
    }
    this.grid = g;
    this.clear();

    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        const leftTopID = i * blockRowSize + j * blockDim;
        this.yield(leftTopID, 1, 1);
      }
    }
  }

  protected gridColorize(
    posY: number,
    posX: number,
    spanX: number,
    spanY: number,
    id: number
  ) {
    for (let i = 0; i < spanY; i++) {
      const row = posY + i;
      for (let j = 0; j < spanX; j++) {
        const col = posX + j;
        this.grid[row][col] = id;
      }
    }
  }
}

// TODO: add buffer behind DataPort
class LinearBuffer<DataType> {
  protected buf: Array<DataType>;
  protected size: number;

  constructor() {
    this.buf = new Array<DataType>();
    this.size = 0;
  }

  length(): number {
    return 0;
  }

  capacity(): number {
    return 0;
  }

  clear() {}
}

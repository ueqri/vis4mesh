import DataPort from "./dataport";

import { MsgTypes } from "./classification";
import { MetaData, NodeData, EdgeData, FlatData } from "./data";

import { FileLoader } from "./fileloader";
import { directoryOpen } from "browser-fs-access";

export default class LocalDataPort extends DataPort {
  protected loader!: FileLoader;
  protected meta!: MetaData;
  protected overview!: FlatData;
  protected nodes!: NodeData[];

  constructor() {
    super();
  }

  protected async initData(dataType: string) {
    let content = await this.loader.getFileContent(dataType);
    if (content === undefined) {
      throw new Error("Unreachable code of getFileContent");
    }
    return content;
  }

  protected async edgeEmptyData() {
    const empty = new Array<number>(MsgTypes.length).fill(0);
    const t: EdgeData[] = JSON.parse(await this.loader.getEdgeFileContent(0));
    t.forEach((edge) => {
      edge.value = empty;
    });
    return t;
  }

  async init() {
    console.log("begin read dir");
    const dirEntries = await directoryOpen({ recursive: true });
    console.log("read dirs finish");
    console.log(dirEntries);

    this.loader = new FileLoader(dirEntries);
    // load lightweight file handles of all edge files at once
    await this.loader.getEdgeFiles();
    try {
      this.meta = JSON.parse(await this.initData("meta")) as MetaData;
      this.overview = JSON.parse(await this.initData("flat")) as FlatData;
      this.nodes = JSON.parse(await this.initData("nodes")) as NodeData[];
    } catch (err) {
      console.error(err);
    }
    return this.meta;
  }

  async flat() {
    return this.overview;
  }

  async snapshotByEdge(edgeName: string) {
    if (edgeName === "flat") {
      this.overview = JSON.parse(await this.initData("flat")) as FlatData;
    } else {
      console.log("load edge history to flat data: " + edgeName);
      let history = await this.loader.getEdgeSnapshot(edgeName);
      console.log(history);
      this.overview = JSON.parse(history) as FlatData;
    }
  }

  async range(start: number, end: number) {
    console.log(start, end);
    if (start == 0 && end == 0) {
      return {
        meta: this.meta,
        nodes: this.nodes,
        edges: await this.edgeEmptyData(),
      };
    } else if (end > this.meta.elapse || start >= end || start < 0) {
      throw new Error("Exceeded range in DataPort when calling `range`");
    } else {
      const edges = JSON.parse(
        await this.loader.getEdgeFileContent(end - 1) // return [start, end)
      ) as EdgeData[];
      const numEdges = edges.length;
      const numMsgTypes = MsgTypes.length;
      if (start != 0) {
        let redundant = JSON.parse(
          await this.loader.getEdgeFileContent(start - 1)
        ) as EdgeData[];
        for (let i = 0; i < numEdges; i++) {
          for (let j = 0; j < numMsgTypes; j++) {
            edges[i].value[j] -= redundant[i].value[j];
          }
        }
      }
      return { meta: this.meta, nodes: this.nodes, edges: edges };
    }
  }
}

import { FileLoader } from "./fileloader";
import { NodeData, SnapShotData, MetaData, EdgeArray } from "./data";
import {FileWithDirectoryAndFileHandle} from "browser-fs-access";
import { MsgTypes } from "./classification";

export default class MeshInfo {
    meta!: MetaData;
    overview!: SnapShotData[];
    nodes!: NodeData[];
    loader: FileLoader;
    
    constructor(fileLoader: FileLoader) {
      this.loader = fileLoader;
    }

    private async initData(dataName: string) {
        let content = await this.loader.getFileContent(dataName);
        if(content === undefined) {
            throw new Error("Unreachable code of getFileContent");
        }
        return content;
    }
  
    // ! init: Must be called 
    public async init() {
      try {
        this.meta = JSON.parse(await this.initData("meta")) as MetaData;
        this.overview = JSON.parse(await this.initData("flat")) as SnapShotData[];
        this.nodes = JSON.parse(await this.initData("nodes")) as NodeData[];
      } catch (err) {
          console.error(err);
      }
    }
  
    // ! getRangedEdges: start and end must be limited by caller
    // return edge info of [start, end]
    public async getRangedEdges(start: number, end: number) {
      if(end >= this.meta.elapse || start > end || start < 0) {
        throw new Error("Fatal: Exceeded range");
      }
      let nKinds = MsgTypes.length;
      let result = JSON.parse(await this.loader.getEdgeFileContent(end)) as EdgeArray[];
      let len = result.length; 
      if(start != 0) {
        let redundant = JSON.parse(await this.loader.getEdgeFileContent(start-1)) as EdgeArray[];
        for(let i = 0; i < len; i++) 
          for(let j = 0; j < nKinds; j++) 
            result[i].value[j] -= redundant[i].value[j];
      }
      return result;
    }
}
  

export const buildMeshInfo = async(dirHandle: FileWithDirectoryAndFileHandle[])=> {
    let fileLoader = new FileLoader(dirHandle);
    await fileLoader.getEdgeFiles();
    const meshInfo = new MeshInfo(fileLoader);
    await meshInfo.init();
    return meshInfo;
}
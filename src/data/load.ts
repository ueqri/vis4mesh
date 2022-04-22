
import * as fs from 'fs-extra';
import {EdgeData, SnapShotData, NodeData} from "./data";
export interface MetaData {
  width: number;
  height: number;
  slice: number;
  elapse: number;
}

export interface ElapsesData {
  edges: EdgeData[];
}

export default class MeshInfo {
  meta!: MetaData;
  overview!: SnapShotData[];
  nodes!: NodeData[];
  elapses!: ElapsesData[];
  taskDone: number;
  
  constructor(dirPath: string) {
    this.taskDone = 0;
    this.initData(dirPath);
  }

  build<T>(filePath: string): Promise<T> {
    return new Promise<T>((resolve) => {
      readContent(filePath).then((data) => {
        let metrics = JSON.parse(data) as T;
        resolve(metrics);
      }).then(()=> {
        console.log("Read and built ".concat(filePath));
      });
    });
  }

  done(): boolean {
    return this.taskDone === 4;
  }

  initData(dirPath: string) {
    this.build<MetaData>(dirPath.concat("/meta.json")).then((metrics)=> {
      this.meta = metrics;
      this.taskDone ++;
    }).then(()=> {
      var i: number;
      let prefixPath = dirPath.concat("/edge_prefix_sum/");
      for(i = 0; i < this.meta.elapse; i++) {
        let filePath = prefixPath.concat(i.toString()).concat(".json");
        this.elapses.push(JSON.parse(fs.readFileSync(filePath, "utf8")) as ElapsesData); 
      }
      this.taskDone ++;
    });
    this.build<NodeData[]>(dirPath.concat("/nodes.json")).then((metrics)=> {
      this.nodes = metrics;
      this.taskDone ++;
    });
    this.build<SnapShotData[]>(dirPath.concat("/flat.json")).then((metrics)=> {
      this.overview = metrics;
      this.taskDone ++;
    });
  }
}

function readContent(filePath: string): Promise<string> {
  return new Promise((resolve) => {
    fs.readFile(filePath, "utf8", (err, data)=> { resolve(data); })
  });
}


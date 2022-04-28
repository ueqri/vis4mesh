import MeshInfo from "./meshinfo"
import {DataPortRangeResponse} from "./data"
import { MsgTypes } from "./classification";
import { EdgeData, EdgeArray, MetaData } from "./data";

export default class DataWrapper {
    meshInfo!: MeshInfo;

    constructor() {
        
    }

    flat() {
        return this.meshInfo.overview;
    }

    private wrapEdgeData(edgesArray: EdgeArray[]) {
        let len = edgesArray.length;
        let edgesData: EdgeData[] = [];
        for(let i = 0; i < len; i++) {
          let valueMap = new Object();
          MsgTypes.forEach((t, idx) => {
            valueMap[t] = edgesArray[i].value;
          });
          edgesData.push({
              source: edgesArray[i].source,
              target: edgesArray[i].target,
              value: valueMap,
              label: edgesArray[i].label,
              detail: edgesArray[i].detail,
          });
        }
        return edgesData;
    }

    async range(start: number, end: number) {
        let edgesArray = await this.meshInfo.getRangedEdges(start, end);
        let response: DataPortRangeResponse = {
            meta: Object(this.meshInfo.meta),
            nodes: this.meshInfo.nodes, 
            edges: this.wrapEdgeData(edgesArray),
        };
        return response;
    }
}
// import {
//   NodeData,
//   EdgeData,
//   MetaData,
//   DataPortMetaResponse,
//   DataPortFlatResponse,
//   DataPortRangeResponse,
// } from "./data";
// import { DataPort } from "./dataport";
// import { WebSocketClient } from "./websocket";

// export default class RemoteDataPort extends DataPort {
//   conn: WebSocketClient;

//   savedMeta!: MetaData;
//   savedNodes!: NodeData[];
//   savedEdges!: EdgeData[];

//   constructor(uri: string) {
//     super(uri);
//     this.conn = new WebSocketClient(uri);
//   }

//   protected initInner(
//     t: "meta" | "node" | "edge",
//     callback: (data: any) => any
//   ): boolean {
//     if (!this.conn.isClosed()) {
//       this.conn.send(`init ${t}`, callback);
//       return true;
//     } else {
//       console.error(
//         "DataPort cannot send init-type inst, connection not works"
//       );
//       return false;
//     }
//   }

//   protected rangeInner(
//     start: number,
//     end: number,
//     callback: (data: any) => any
//   ): boolean {
//     if (!this.conn.isClosed()) {
//       this.conn.send(`range ${start} ${end}`, callback);
//       return true;
//     } else {
//       console.error(
//         "DataPort cannot send range-type inst, connection not works"
//       );
//       return false;
//     }
//   }

//   protected flatInner(
//     frameSize: number,
//     callback: (data: any) => any
//   ): boolean {
//     if (!this.conn.isClosed()) {
//       this.conn.send(`flat ${frameSize}`, callback);
//       return true;
//     } else {
//       console.error(
//         "DataPort cannot send flat-type inst, connection not works"
//       );
//       return false;
//     }
//   }

//   init(): Promise<DataPortMetaResponse> {
//     return new Promise((resolve, reject) => {
//       function check(ok: boolean) {
//         if (!ok) {
//           reject(new Error("DataPort cannot handle `init`"));
//         }
//       }
//       // Get initial nodes and edges
//       // TODO: use more graceful way to replace the nested callbacks
//       check(
//         this.initInner("node", (nodes: any) => {
//           this.savedNodes = ZippedResponseToNodeDataArray(
//             JSON.parse(nodes) as ZippedResponse
//           );
//           check(
//             this.initInner("edge", (edges: any) => {
//               this.savedEdges = ZippedResponseToEdgeDataArray(
//                 JSON.parse(edges) as ZippedResponse
//               );
//               check(
//                 this.initInner("meta", (meta: any) => {
//                   this.savedMeta = JSON.parse(meta) as MetaData;
//                   resolve(this.savedMeta);
//                 })
//               );
//             })
//           );
//         })
//       );
//     });
//   }

//   range(start: number, end: number): Promise<DataPortRangeResponse> {
//     return new Promise((resolve, reject) => {
//       if (start == 0 && end == 0) {
//         resolve({
//           meta: this.savedMeta,
//           nodes: this.savedNodes,
//           edges: this.savedEdges,
//         });
//       } else if (
//         this.rangeInner(start, end, (d: any) => {
//           resolve({
//             meta: this.savedMeta,
//             nodes: this.savedNodes,
//             edges: ZippedResponseToEdgeDataArray(
//               JSON.parse(d) as ZippedResponse
//             ),
//           });
//         }) === false
//       ) {
//         reject(new Error("DataPort cannot handle `range`"));
//       }
//     });
//   }

//   flat(): Promise<DataPortFlatResponse> {
//     return new Promise((resolve, reject) => {
//       if (
//         this.flatInner(1, (d: any) => {
//           resolve(JSON.parse(d) as DataPortFlatResponse);
//         }) === false
//       ) {
//         reject(new Error("DataPort cannot handle `flat`"));
//       }
//     });
//   }
// }

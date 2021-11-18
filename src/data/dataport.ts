import { DataPortResponse } from "./data";
import { WebSocketClient } from "./websocket";

export class DataPort {
  conn: WebSocketClient;

  constructor(url: string) {
    this.conn = new WebSocketClient(url);
  }

  range(start: number, end: number, callback: (data: any) => any): boolean {
    if (!this.conn.isClosed()) {
      this.conn.send(`range ${start} ${end}`, callback);
      return true;
    } else {
      console.error("DataPort cannot send `range`, connection not works.");
      return false;
    }
  }

  init(callback: (meta: Object) => void) {
    this.range(0, 0, (d: any) => {
      callback((JSON.parse(d) as DataPortResponse).meta);
    });
  }
  async rangePromise(start: number, end: number): Promise<DataPortResponse> {
    return new Promise((resolve) => {
      this.range(start, end, (d: DataPortResponse) => {
        resolve(d);
      });
    });
  }
}

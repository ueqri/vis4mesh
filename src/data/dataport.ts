import { DataPortFlatResponse, DataPortRangeResponse } from "./data";
import { WebSocketClient } from "./websocket";

export default class DataPort {
  conn: WebSocketClient;

  constructor(url: string) {
    this.conn = new WebSocketClient(url);
  }

  protected rangeInner(
    start: number,
    end: number,
    callback: (data: any) => any
  ): boolean {
    if (!this.conn.isClosed()) {
      this.conn.send(`range ${start} ${end}`, callback);
      return true;
    } else {
      console.error("DataPort cannot send `range`, connection not works");
      return false;
    }
  }

  protected flatInner(
    frameSize: number,
    callback: (data: any) => any
  ): boolean {
    if (!this.conn.isClosed()) {
      this.conn.send(`flat ${frameSize}`, callback);
      return true;
    } else {
      console.error("DataPort cannot send `flat`, connection not works");
      return false;
    }
  }

  init(): Promise<Object> {
    return new Promise((resolve, reject) => {
      if (
        this.rangeInner(0, 0, (d: any) => {
          resolve((JSON.parse(d) as DataPortRangeResponse).meta);
        }) === false
      ) {
        reject(new Error("DataPort cannot handle `init`"));
      }
    });
  }

  range(start: number, end: number): Promise<DataPortRangeResponse> {
    return new Promise((resolve, reject) => {
      if (
        this.rangeInner(start, end, (d: any) => {
          resolve(JSON.parse(d) as DataPortRangeResponse);
        }) === false
      ) {
        reject(new Error("DataPort cannot handle `range`"));
      }
    });
  }

  flat(frameSize: number): Promise<DataPortFlatResponse> {
    return new Promise((resolve, reject) => {
      if (
        this.flatInner(frameSize, (d: any) => {
          resolve(JSON.parse(d) as DataPortFlatResponse);
        }) === false
      ) {
        reject(new Error("DataPort cannot handle `flat`"));
      }
    });
  }
}

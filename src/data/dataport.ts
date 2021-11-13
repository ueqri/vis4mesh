import { WebSocketClient } from "./websocket";

export class DataPort {
  conn: WebSocketClient;

  constructor(url: string) {
    this.conn = new WebSocketClient(url);
  }

  range(start: number, end: number, callback: (data: any) => any) {
    if (!this.conn.isClosed()) {
      this.conn.send(`range ${start} ${end}`, callback);
    } else {
      console.error("DataPort cannot send `range`, connection not works.");
    }
  }
}

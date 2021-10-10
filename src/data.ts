export interface NodeData {
  id: string;
  name: string;
  xid: number;
  yid: number;
}

export interface EdgeData {
  source: string;
  target: string;
  value: number;
  details: string;
}

class WebSocketClient {
  ws: WebSocket;
  pending: boolean;
  handleMsg!: (data: any) => any | null;

  constructor(url: string) {
    this.pending = true;
    this.ws = new WebSocket(url);
    const currentHandler = this.currentHandler;
    const notifyFree = this.notifyFree;
    const heartBeat = this.heartBeat;

    this.ws.onopen = function () {
      console.log("WebSocket connection established");
      notifyFree();
      heartBeat();
    };

    this.ws.onmessage = function (e) {
      console.log(`WebSocket received. `);
      //console.log(e.data);
      var callback = currentHandler();
      callback(e.data);
      notifyFree();
    };

    this.ws.onclose = function (e) {
      if (e.wasClean) {
        console.log(
          `WebSocket connection closed cleanly, code=${e.code}, reason=` +
            `${e.reason}`
        );
      } else {
        // e.g. server process killed or network down
        // event.code is usually 1006 in this case
        console.log("WebSocket connection died");
      }
    };

    this.ws.onerror = function (e) {
      console.error("WebSocket error observed: ", e);
    };
  }

  send(data: string): void {
    if (this.pending) {
      setTimeout(() => this.send(data), 500);
    } else {
      this.pending = true;
      this.ws.send(data);
    }
  }

  heartBeat = () => {
    this.ws.send("pong");
    setTimeout(() => this.heartBeat(), 5000);
  };

  isClosed(): boolean {
    if (this.ws.readyState == WebSocket.CLOSED) {
      return true;
    } else {
      return false; // CONNECTING, OPEN, ...
    }
  }

  notifyFree = () => {
    this.pending = false;
  };

  currentHandler = () => {
    return this.handleMsg;
  };
}

class LinearBuffer<DataType> {
  buf!: DataType[];
  size!: number;

  length(): number {
    return 0;
  }

  capacity(): number {
    return 0;
  }

  clear() {}
}
export class DataPort {
  conn: WebSocketClient;
  // buffer: LinearBuffer<EdgeData>;

  constructor(url: string) {
    this.conn = new WebSocketClient(url);
    // this.buffer = new LinearBuffer<EdgeData>();
  }

  range(start: number, end: number, callback: (data: any) => any) {
    if (!this.conn.isClosed()) {
      this.conn.handleMsg = callback;
      this.conn.send(`range ${start} ${end}`);
    } else {
      console.error("DataPort cannot send `range`, connection not works.");
    }
  }

  init(callback: (data: any) => any) {
    if (!this.conn.isClosed()) {
      this.conn.handleMsg = callback;
      this.conn.send(`init`);
    } else {
      console.error("DataPort cannot send `nodes`, connection not works.");
    }
  }
}

export class Ticker {
  timeoutHandle: any;
  speed: number; // rate of elapse number per second, default 1
  elapse: number;
  tickFunc!: () => any;

  constructor(speed: number = 1) {
    this.speed = speed;
    this.elapse = 0;
  }

  auto() {
    this.elapse += 1;
    this.tickFunc();
    this.timeoutHandle = setTimeout(() => this.auto(), 1000 / this.speed);
  }

  manual() {
    this.elapse += 1;
    this.tickFunc();
  }

  pause() {
    clearTimeout(this.timeoutHandle);
  }
}

import { JSDocAllType } from "typescript";

class WebSocketClient {
  ws: WebSocket;

  constructor(url: string, MsgProcess: (data: Object) => any) {
    this.ws = new WebSocket(url);
    var s = this.ws;

    this.ws.onopen = function (e) {
      console.log("[WebSocket] Open: Connection established");
      console.log("[WebSocket] Message: Sending to server");
      // s.send("tick 0");
    };

    this.ws.onmessage = function (event) {
      console.log(
        `[WebSocket] Message: Data received from server: ${event.data}`
      );
      MsgProcess(JSON.parse(event.data));
    };

    this.ws.onclose = function (event) {
      if (event.wasClean) {
        console.log(
          `[WebSocket] Close: Connection closed cleanly, code=${event.code} reason=${event.reason}`
        );
      } else {
        // e.g. server process killed or network down
        // event.code is usually 1006 in this case
        console.log("[WebSocket] Close: Connection died");
      }
    };

    this.ws.onerror = function (error) {
      console.error(`[WebSocket] Error: ${error.message}`);
    };
  }

  send(data: string): void {
    this.ws.send(data);
  }

  isConnected(): boolean {
    return this.ws.readyState == WebSocket.OPEN;
  }
}

export class NetworkTopologySource {
  conn: WebSocketClient;

  constructor(url: string, render: (data: Object) => any) {
    this.conn = new WebSocketClient(url, render);
  }

  range(start: number, end: number): void {
    if (this.conn.isConnected()) {
      this.conn.send("range " + start + " " + end);
    } else {
      console.error("cannot get range, connection is closed.");
    }
  }
}

var timerHandle: any;

function ticker(speed: number = 1, func: () => void): void {
  timerHandle = setTimeout(function () {
    func();
    ticker(speed, func);
  }, 1000 / speed);
}

class TimeRange {
  protected fromTime: number;
  protected toTime: number;

  constructor() {
    this.fromTime = 0;
    this.toTime = 0;
  }
  moveFromPoint(time: number) {
    this.fromTime = time;
  }
  moveToPoint(time: number) {
    this.toTime = time;
  }
  from(): number {
    return this.fromTime;
  }
  to(): number {
    return this.toTime;
  }
  going() {
    this.toTime = this.toTime + 1;
  }
  backing() {
    if (this.toTime == this.fromTime) {
      console.error("toTime should be greater than fromTime!")
    }
    this.toTime = this.toTime - 1;
  }
}

export class VisualizationTickController {
  range: TimeRange;
  source: NetworkTopologySource;
  ticking: boolean;

  constructor(src: NetworkTopologySource) {
    this.source = src;
    this.range = new TimeRange();
    this.ticking = false;
  }

  tick(speed: number = 1): void {
    var s = this.source;
    var r = this.range;
    ticker(speed, function () {
      s.range(r.from(), r.to());
      r.going();
    });
  }

  changeRange(from: number, to: number): void {
    this.range.moveFromPoint(from);
    this.range.moveToPoint(to);
  }

  flip(): void {
    if (this.ticking == false) {
      this.ticking = true;
      this.tick(1);
    } else {
      this.ticking = false;
      clearTimeout(timerHandle);
    }
  }

  timeNext(): void {
    this.range.going();
    this.source.range(this.range.from(), this.range.to());
  }

  timePrevious(): void {
    this.range.backing();
    this.source.range(this.range.from(), this.range.to());
  }
}

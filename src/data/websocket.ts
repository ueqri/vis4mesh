export class WebSocketClient {
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
      console.log("WebSocket received");
      // console.log(e.data);
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
      console.error(`WebSocket error observed: ${e}`);
    };
  }

  send(data: string, callback: (data: any) => any): void {
    if (this.pending) {
      // using atomic variables may be better
      setTimeout(() => this.send(data, callback), 500);
    } else {
      this.pending = true;
      this.handleMsg = callback;
      this.ws.send(data);
    }
  }

  heartBeat = () => {
    this.ws.send("pong"); // no response would come from server
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

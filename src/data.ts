import { Grid } from "./layout/grid";
import { DataNormalize } from "./data/normalize";

export interface NodeData {
  id: string;
  name: string;
  xid: number;
  yid: number;
}

export interface EdgeData {
  source: string;
  target: string;
  value: Object;
  details: string;
  dynamicWeight?: number;
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
      console.error("WebSocket error observed: ", e);
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
      this.conn.send(`range ${start} ${end}`, callback);
    } else {
      console.error("DataPort cannot send `range`, connection not works.");
    }
  }

  init(callback: (data: any) => any) {
    if (!this.conn.isClosed()) {
      this.conn.send(`init`, callback);
    } else {
      console.error("DataPort cannot send `nodes`, connection not works.");
    }
  }
}

export class Ticker {
  timeoutHandle: any;
  protected speed: number; // rate of ticking per second, default 1
  protected step: number; // step for time increase per tick, used in `next`
  elapse: number; // not useful at present
  tickFunc!: () => any;

  constructor(speed: number = 1) {
    this.speed = speed;
    this.step = 1;
    this.elapse = 0;
  }

  updateSpeed(s: number) {
    this.speed = s;
    this.elapse = 0;
  }

  updateStep(s: number) {
    this.step = s;
  }

  next(now: number): number {
    return Number(now + this.step);
  }

  auto() {
    this.elapse = this.elapse + 1;
    this.tickFunc();
    this.timeoutHandle = setTimeout(() => this.auto(), 1000 / this.speed);
  }

  manual() {
    this.elapse = this.elapse + 1;
    this.tickFunc();
  }

  // `still` doesn't change the time iterator, just call `tickFunc` once, and
  // `still` and `auto` are not allowed to call concurrently
  still() {
    var temp = this.step;
    this.step = 0;
    this.tickFunc();
    this.step = temp;
  }

  pause() {
    clearTimeout(this.timeoutHandle);
  }
}

export class RangeRecorder {
  startTime: number;
  endTime: number;

  constructor() {
    this.startTime = 0;
    this.endTime = 0;
  }

  update(start: number, end: number): this {
    this.startTime = start;
    this.endTime = end;
    return this;
  }

  copy(src: RangeRecorder): this {
    this.startTime = src.startTime;
    this.endTime = src.endTime;
    return this;
  }
}

export enum Mode {
  SliceTick, // tick slice, i.e. both `startTime` and `endTime` are ticking
  RangeTick, // tick `timeTo` from input box, i.e `timeFrom` is static
  RangeSlider, // set static range from range slider
}

export class StateController {
  protected mode: Mode;
  protected speed: number;
  protected step: number;
  protected isTick: boolean;
  protected isAction: boolean;
  protected startTime: number;
  protected endTime: number;
  protected ticker: Ticker;
  // state change: 1) time change 2) action or stop
  // mode/speed change is not included in state change
  protected statChangeCallbacks: Array<(from: number, to: number) => any>;

  protected port: DataPort;
  protected bindInstance: Grid;

  protected msgTypeMap: Map<string, boolean>;
  protected msgTypes?: string[];

  constructor(updateFrom: DataPort, bindTo: Grid) {
    this.mode = Mode.SliceTick;
    this.speed = 1; // 1 time tick per second, by default
    this.step = 1; // 1 slice per tick, by default
    this.isTick = this.isAction = false;
    this.startTime = this.endTime = 0;

    this.ticker = new Ticker();
    this.ticker.updateSpeed(this.speed);
    this.ticker.updateStep(this.step);

    this.statChangeCallbacks = new Array<(from: number, to: number) => any>();

    this.port = updateFrom;
    this.bindInstance = bindTo;

    this.msgTypeMap = new Map<string, boolean>();
  }

  action() {
    this.isAction = true;
    if (this.mode === Mode.SliceTick) {
      this.ticker.tickFunc = () => {
        this.port.range(this.startTime, this.endTime, (d) => {
          var edges: EdgeData[] = JSON.parse(d);
          edges.forEach((e) => {
            e.dynamicWeight = this.computeDynamicWeight(e.value);
          });
          DataNormalize(edges);
          this.bindInstance.edgeData(edges);
        });
        this.bindInstance.refresh();
        this.callbacks();
        this.startTime = this.endTime;
        this.endTime = this.ticker.next(this.endTime);
      };
      this.setTick();
    } else if (this.mode === Mode.RangeTick) {
      this.ticker.tickFunc = () => {
        this.port.range(this.startTime, this.endTime, (d) => {
          // TODO: concat these processes as middleware
          var edges: EdgeData[] = JSON.parse(d);
          edges.forEach((e) => {
            e.dynamicWeight = this.computeDynamicWeight(e.value);
          });
          DataNormalize(edges);
          this.bindInstance.edgeData(edges);
        });
        this.bindInstance.refresh();
        this.callbacks();
        this.endTime = this.ticker.next(this.endTime);
      };
      this.setTick();
    } else if (this.mode === Mode.RangeSlider) {
      // static display, no ticking
      this.port.range(this.startTime, this.endTime, (d) => {
        var edges: EdgeData[] = JSON.parse(d);
        edges.forEach((e) => {
          e.dynamicWeight = this.computeDynamicWeight(e.value);
        });
        DataNormalize(edges);
        this.bindInstance.edgeData(edges);
      });
      this.bindInstance.refresh();
      this.callbacks();
    }
    if (!this.isTick) {
      // ticking is somehow async, while static display is sync function
      this.isAction = false;
    }
  }

  stop() {
    if (!this.isAction) {
      return;
    }
    if (this.isTick) {
      this.setPause();
      this.isAction = false;
    } else {
      console.error("internal error in state controller");
    }
    this.callbacks();
  }

  addStatChangeCallback(callback: (from: number, to: number) => any): this {
    this.statChangeCallbacks.push(callback);
    return this;
  }

  updateMode(m: Mode): this {
    if (this.isAction) {
      console.error(
        "state controller is still running, please stop it before updating mode"
      );
    } else {
      this.mode = m;
    }
    return this;
  }

  updateSpeed(speed: number): this {
    this.setPause();
    this.speed = speed;
    this.ticker.updateSpeed(this.speed);
    this.callbacks();
    return this;
  }

  updateStep(step: number): this {
    this.setPause();
    this.step = step;
    this.ticker.updateStep(this.step);
    this.callbacks();
    return this;
  }

  updateTimeRange(range: RangeRecorder): this {
    this.setPause();
    this.startTime = range.startTime;
    this.endTime = range.endTime;
    this.callbacks();
    return this;
  }

  timeRange(): RangeRecorder {
    return new RangeRecorder().update(this.startTime, this.endTime);
  }

  initAllMsgTypes(msgTypes: string[]): this {
    this.msgTypeMap.clear();
    this.msgTypes = msgTypes; // TODO: remove this temporary variable
    msgTypes.forEach((v) => {
      this.msgTypeMap.set(v, true);
    });
    return this;
  }

  focusOnMsgType(msgType: string): this {
    this.msgTypeMap.set(msgType, true);
    return this;
  }

  hideMsgType(msgType: string): this {
    this.msgTypeMap.set(msgType, false);
    return this;
  }

  // getMsgTypes(): string[] {
  //   if (this.msgTypes === undefined) {
  //     console.error("MsgTypes is undefined in StateController");
  //   }
  //   return this.msgTypes!;
  // }

  protected setPause(): this {
    this.ticker.pause();
    this.isTick = false;
    // `statChangeCallbacks` would be called inside `tickFunc`
    return this;
  }

  protected setTick(): this {
    this.isTick = true;
    this.ticker.auto();
    // `statChangeCallbacks` would be called inside `tickFunc`
    return this;
  }

  protected callbacks() {
    this.statChangeCallbacks.forEach((func) =>
      func(this.startTime, this.endTime)
    );
  }

  // TODO: abstract data processing middleware
  protected computeDynamicWeight(valuesWithMsgType: Object): number {
    let weight: number = 0;
    Object.keys(valuesWithMsgType).forEach((v) => {
      let val = this.msgTypeMap.get(v);
      if (val === undefined) {
        console.error(
          `undefined message types ${v} found in computeDynamicWeight`
        );
      }
      if (val === true) {
        weight += Number(valuesWithMsgType[v]);
      }
    });
    return weight;
  }
}

// TODO: separate this source into files in data directory

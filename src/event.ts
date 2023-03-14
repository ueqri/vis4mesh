interface EventResponseStages {
  start: Array<any>;
  step: Array<any>;
  end: Array<any>;
}

function NewEventResponseStages(): EventResponseStages {
  return {
    start: new Array<any>(),
    step: new Array<any>(),
    end: new Array<any>(),
  };
}

const VERBOSE_MODE = false;

class Event {
  protected eventMap: { [ev: string]: EventResponseStages };
  constructor() {
    this.eventMap = {};
  }

  AddStartListener(ev: string, listener: any) {
    if (this.eventMap[ev] === undefined) {
      this.eventMap[ev] = NewEventResponseStages();
    }
    this.eventMap[ev].start.push(listener);
    if (VERBOSE_MODE) console.log("ev start", ev);
  }

  AddStepListener(ev: string, listener: any) {
    if (this.eventMap[ev] === undefined) {
      this.eventMap[ev] = NewEventResponseStages();
    }
    this.eventMap[ev].step.push(listener);
    if (VERBOSE_MODE) console.log("ev step", ev);
  }

  AddEndListener(ev: string, listener: any) {
    if (this.eventMap[ev] === undefined) {
      this.eventMap[ev] = NewEventResponseStages();
    }
    this.eventMap[ev].end.push(listener);
    if (VERBOSE_MODE) console.log("ev end", ev);
  }

  FireEvent(ev: string, excitation: any) {
    if (this.eventMap[ev] === undefined) {
      console.warn(`Event ${ev} is empty, then nothing would happen`);
    } else {
      const resp = this.eventMap[ev];
      resp.start.forEach((callback) => {
        callback(excitation);
      });
      resp.step.forEach((callback) => {
        callback(excitation);
      });
      resp.end.forEach((callback) => {
        callback(excitation);
      });
      if (VERBOSE_MODE) console.log("ev fired", ev);
    }
  }

  ClearEvent(ev: string) {
    if (this.eventMap[ev] === undefined) {
      console.warn(`Event ${ev} is empty, then nothing would happen`);
    } else {
      this.eventMap[ev] = NewEventResponseStages();
    }
  }
}

export default new Event();

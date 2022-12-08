class DaisenUrl {
  baseurl: string;
  url: string;

  constructor(baseurl: string = "http://localhost:3001/") {
    this.baseurl = baseurl;
    this.url = baseurl;
  }

  dashboard() {
    this.url = this.baseurl + "dashboard?";
    return this;
  }

  component() {
    this.url = this.baseurl + "component?";
    return this;
  }

  with_timerange(range: string[] | undefined) {
    if (range !== undefined) {
      this.url += `starttime=${range[0]}&endtime=${range[1]}`;
    }
    return this;
  }

  with_ep(coord: number[] | undefined) {
    if (coord !== undefined) {
      // deal with leading 0 
      const start = coord[0].toString().padStart(2, '0');
      const end = coord[1].toString().padStart(2, '0');
      this.url += `name=GPU1.Tile_%5B${start}%5D%5B${end}%5D.CU&`;
    }
    return this;
  }

  raw_url() {
    return this.url;
  }
}

class DaisenSelector {
  ep_x?: number;
  ep_y?: number;
  time_start?: number;
  time_end?: number;

  register_timerange([start, end]: [number, number]) {
    this.time_start = start;
    this.time_end = end; 
  }

  unset_timerange() {
    this.time_start = undefined;
    this.time_end = undefined;
  }

  register_ep([x, y]: [number, number]) {
    this.ep_x = x;
    this.ep_y = y;
  }

  unset_ep() {
    this.ep_x = undefined;
    this.ep_y = undefined;
  }

  get_timerange() {
    if (this.time_start === undefined || this.time_end === undefined) {
      return undefined;
    }
    const range = [(this.time_start * 1e-6).toFixed(6), (this.time_end * 1e-6).toFixed(6)];
    console.log(range);
    return range;
  }

  get_ep() {
    if (this.ep_x === undefined || this.ep_y === undefined) {
      return undefined;
    }
    return [this.ep_x, this.ep_y];
  }
}

const selector = new DaisenSelector();
export default selector;

export function DaisenLaunch(div: any) {
  const url = new DaisenUrl();
  const ep = selector.get_ep();
  const time_range = selector.get_timerange();
  console.log(time_range);

  if(ep === undefined && time_range === undefined) {

  } else if (ep === undefined) {
    url.dashboard().with_timerange(time_range);
  } else {
    url.component().with_ep(ep).with_timerange(time_range);
  }
  console.log("request " + url.raw_url());
  
  div
    .append("iframe")
    .attr("id", "daisen-iframe")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("src", url.raw_url());
}

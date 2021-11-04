# Vis4Mesh Visualization Tool

Vis4Mesh tool is designed especially for Network-on-Chip(NoC) traffic research in [Akita project](https://gitlab.com/akita), also able to use in other network visualization tasks.

## Motivation

1. **Network-on-Chip visualization**

   It would support the network of mesh, tree network, general connected graph, e.t.c)

2. **Dynamic traffic player**

   - display the traffic statistics of any time
   - show the hotspots and its movement
   - smoothly change the time range to see traffic of certain interval

3. **Tracing visualization tool for Akita project**

   servers as a supplementary of [Daisen](https://osf.io/73ry8/)(a tool for visualizing GPU execution in Akita), to support network traffic visualization

## Design

### **Principles**

- Frontend only do rendering work, backend feeds the frontend with full graph details.
- All graph data is fetched by _Time Range_ in backend, which generally support `range` as the unified data fetch instruction.
- Assume the tracing time interval was discretized into many slices(we call time slice then). Thus avoiding float number storage and processing.

### **Web Fronted**

It was composed in TypeScript inside a loose-coupling framework for extensibility. It draws SVG by [D3.js](https://d3js.org/) for better performance than canvas, only servers as the SVG renders with console panel for state config and track.

The web view can be divided into two parts:

1. **Graph View**

   - display colored traffic statistics of the network
   - full support for zoom and drag
   - hover mouse to see details tooltip for each component

2. **Sidebar** (Console panel)

   - **Legend**: select the edge with certain type or heavy level
   - **Shape Config**: set the size of shape (e.g. node size, edge width, scale ratio) in SVG
   - **General**: set the player speed, step of time slice, player mode and manually config the start/end time. (WIP: a range slider with two handles for mouse drag.)

We propose tree _Player Mode_ here:

1. **Slice Tick**

   Both **start time** and **end time** are ticking, e.g. `start=1,end=2` for now and `start=2,end=3` for next ticking.

2. **Range Tick**

   Only **end time** is ticking, i.e., **start time** is static after allocation. For example, `start=1,end=3` for now and `start=1,end=4` for next ticking. Using this mode, we could see the traffics within any interval to gain better granularity.

3. **Range Slider**

   Not a ticking mode. Move the **start time** and **end time** from range slider component, and see the real time feedback from graph view. The arrow keys are well-supported in this mode, compared to _Range Tick_ mode.

### **Server Backend**

Any server supported the WebSocket and data fetch instructions(e.g. `range`, `init`, `pong`) is fine as backend for Vis4Mesh.

In this project, we implemented an example backend in Golang to fit the [Akita Redis tracer in mesh networking](https://gitlab.com/akita/util/-/issues/19).

The example backend contains 3 parts, locating in `server.go`, `graph.go` and `redis.go` respectively:

1. **HTTP Handlers**: process the WebSocket and parse the instructions to call internal `Inst<name>` function.

2. **Graph Build**: store the graph(node/edge details) and dump the JSON format description of graph that could be accepted by frontend.

3. **Redis DB Query**: implement the DB query function for results of the mesh tracing.

## Setup Guide

Given the convenience of WebSocket, our frontend is extremely loose-coupling and light. Our latest release is built by GitHub Actions and public in this site: https://ueqri.github.io/vis4mesh-release/.

If you want to run locally, just choose one mode to set up both frontend and backend.

### Detached Mode

We recommend using detached mode, i.e., build & run the web frontend and server backend separately. And only use this mode especially for online site.

In this mode, we use npm and NodeJS in the host to build TypeScript program, and trigger docker to maintain server backend and Redis DB. (PS: frontend build is **not need** when using online site)

#### Prerequisites

- **frontend**: npm(v8.0+), NodeJS(v16.0+)
- **backend**: docker(v20.0+), docker-compose(v2.0+)

```bash
git clone git@github.com:ueqri/vis4mesh.git
cd vis4mesh
# if you use online site, skip the `npm` commands
npm install
npm run dev # run parcel with HTTP server in localhost:1234
docker-compose up # add `-d` to run in background
```

To close the container, use <kbd>Ctrl</kbd> + <kbd>C</kbd> to stop in interactive mode, then `docker-compose down`.

### One-key Mode

Use one-key docker-compose file to build all.

```bash
git clone git@github.com:ueqri/vis4mesh.git
cd vis4mesh
docker-compose -f example/one-key.yml up # add `-d` to run in background
```

Like the previous, `docker-compose -f example/one-key.yml down` to close.

### After Setup

If it's all set, just open your favorable browser to view http://localhost:1234/ and see the visualization.

We have provided a demo DB generated by FIR(length:100000) in 8\*8 Wafer-scale GPU v0.1. And all the backend config would be well done by docker-compose.

## Forthcoming

There is still some minor bugs in our tool, including but not limited to SVG invisible weirdly(probably caused by the web pack, since it runs smoothly in dev mode).

As for follow-up work, we'd implemented these features:

- [ ] Fix the display bugs and replace current _iframe_ scheme with better one.
- [ ] Implement better legend to support the selection of different traffic types, with more rational color scheme.
- [ ] Add range slider with two handles, using the awesome [noUiSlider](https://refreshless.com/nouislider/) to enable range dragging.
- [ ] Build the detailed documents about the design and protocols
- [ ] Implement more layout to support general network dynamic visualization.

## Reference

[Tutorial on the Akita Simulator Framework and MGPUSim](https://syifan.github.io/akita_hpca2020_tutorial.html)

[GitLab of Akita Simulator Framework](https://gitlab.com/akita)

[D3.js - Data-Driven Documents](https://d3js.org/)

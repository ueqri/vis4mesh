# Design of Vis4Mesh

## **Principles**

- Frontend only do rendering work, backend feeds the frontend with full graph details.
- All graph data is fetched by _Time Range_ in backend, which generally support `range` as the unified data fetch instruction.
- Assume the tracing time interval was discretized into many slices(we call time slice then). Thus avoiding float number storage and processing.

## **Web Fronted**

It was composed in TypeScript inside a loose-coupling framework for extensibility. It draws SVG by [D3.js](https://d3js.org/) for better performance than canvas, only servers as the SVG renders with console panel for state config and track.

The web view can be divided into five parts:

1. **Graph View**

   - display colored traffic statistics of the mesh network
   - fully support for zoom and drag
   - hover mouse to see tooltip for each component
   - click component to show details in the right side canvas

2. **Navbar**

   - click player button for dynamic visualization
   - use drop-down menu to configure WebSocket connection and show its status
   - provide open button for setting accordion panel in the right

3. **Timebar**

   - display the stacked bar chart as temporal statistics
   - fully support for timebar resizing
   - switch timebar mode between the `Data or Command` and `Message Type Group` to see the temporal overview from different perspectives
   - checkboxes of filter to see specific colored bars
   - use brush in any time to select a range from **start time** and **end time**, and see the real time feedback from graph view (note: custom brush would trigger player to pause)
   - synchronize the current visualized time/range of player to timebar

4. **Side Canvas**

   - show the overview metrics and chart when nothing is clicked
   - show the details of a certain component when something is clicked
   - fully support for side canvas resizing

5. **Setting panel**

   - **Player**: set the rate of ticks per second, rate of time slices per tick, and the player mode.

     We propose two _Player Mode_ here: (1) **Slice Tick**: Both **start** and **end** are ticking, e.g. `start=1,end=2` for now and `start=2,end=3` for next ticking. (2) **Range Tick**: Only **end** is ticking, i.e., **start** is static after allocation. For example, `start=1,end=3` for now and `start=1,end=4` for next ticking. Using this mode, we could see the traffics within any interval to gain better granularity.

   - **Filter**: set the behavior and mode of two main FilterBar: for edge traffic, and for time bar message types
   - **Layout**: set the size of shape (e.g. node size, node distance) in grid layout

## **Server Backend**

Any server supported the WebSocket and data fetch instructions(e.g. `range`, `init`, `flat`) is valid as backend for Vis4Mesh.

In this project, we implemented an example backend in Golang to fit the [Akita Redis tracer in mesh networking](https://gitlab.com/akita/util/-/issues/19), especially for the project of [Akita Akkalat](https://github.com/ueqri/akkalat).

The example backend support three mode currently:

- `redis` use Redis DB to query data for frontend request
- `file` use preprocessed and dumped archive to response
- `dump` preprocess the data in Redis and dump an archive with NO WebSocket service equipped

We only introduce the `redis` mode here.

It bases on 3 package, locating in `reader`, `graph`, and `response`:

1. **Redis DB Reader**: implement the DB query function for results of the mesh tracing in simulator.

2. **Graph Build**: store the graph(node/edge details) and dump the JSON format description of graph that could be accepted by frontend(currently we add serialization middleware).

3. **HTTP Handlers**: process the WebSocket and parse the instructions to call internal `Inst<name>` function.

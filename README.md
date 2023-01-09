# Vis4Mesh

Vis4Mesh is a visualization tool for designing mesh Network-on-Chips (NoC) and assisting with computer architecture research.

**Notice: This project is still under development, some features are not solid and the documents may be out-dated. We plan to release v0.3 packages and documents in 2023 spring. If you are interested to use it for your research now, please feel free to contact [Hang Yan](mailto:iyanhang@gmail.com).**

<details open><summary>Snapshot of Vis4Mesh v0.2.3 Release</summary><img alt="vis4mesh-v2" width="95%" src="https://github.com/ueqri/vis4mesh/blob/main/doc/v0.2.3.png?raw=true"></details>

<details><summary>Snapshot of Vis4Mesh v0.3.0 Preview (in progress)</summary><img width="95%" alt="vis4mesh-v3" src="https://user-images.githubusercontent.com/56567688/211254564-425e8394-7480-4afc-b22a-09e1085cbed1.png"></details>

## Features

1. **Animated playback of Network-on-Chip traffic**

   Vis4Mesh could playback the NoC traffic and statistics of *any time* and *any region* with the metrics traced from simulation; in this way, researchers can analyze the hotspots and their movement with the tool. Also, it supports brushing a *time range* (in the bottom bar chart) to focus on a specific execution stage, or zooming into a certain *region* to study the network partially.

2. **Temporal and spatial overview to summarize execution behavior**

   As a temporal overview, Vis4Mesh provides a *birdview* and a *transaction vs. time graph* for the whole network. As a spatial overview, it displays the *topology* of the network in various colors based on the achieved bandwidth (or congestion level). With two types of overview, researchers can summarize both the network and execution behavior of a GPU program.

3. **Sheer scalability to visualize millions of devices**

   Existing network visualization tools do not consider the scale of millions of nodes and links. While Vis4Mesh supports *large-scale mesh systems* (e.g., [Cerebras Wafer Scale Engine](https://cerebras.net/blog/cerebras-wafer-scale-engine-why-we-need-big-chips-for-deep-learning/) w/ 400,000 cores connected to NoC) based on a hierarchical packing/unpacking approach for intelligible zooming and acceptable rendering performance.

4. **Collaboration with other simulators and visualization tools**

   Currently, Vis4Mesh can map the *NoC traffic* to the *execution behaviors of GPU programs* with [Daisen](https://osf.io/73ry8/) (a tool for visualizing component-level GPU execution) integrated, which makes it helpful for researchers to figure out which *instruction, request, or hardware component* causes the *hotspots* in the network. Moreover, Vis4Mesh supports NoC tracers for the gem5 or GPGPUSim frameworks, which will be public with our next release.

## Motivation

Network-on-Chip (NoC) is a popular and widely used communication technology in computer architecture design (especially Systems-on-Chip). But there are some drawbacks associated with it such as long communication latencies and message blocking between two remotely located nodes.

To prototype an efficient NoC, a designer must have insights into network behaviors during execution. Instead of simply looking at the metric numbers such as achieved bandwidth on each link, we believe that a visualization tool would be more intuitive and helpful for designers to analyze the performance issues of NoC systems.

After reviewing the literature and existing tools, we found no systematic solution that is directly applicable to visualizing the NoC (especially the mesh NoC) and provides rich insights and high scalability. Thus we propose Vis4Mesh with four key features as mentioned above.

## Design

Briefly, the tool consists of two parts: **Web frontend** and **Server backend**. Frontend only do rendering work, backend feeds the frontend with preprocessed metrics via our generalized data protocol.

For details, please refer to [doc/design.md](doc/design.md).

## Quickstart

Note: This tutorial is for v0.2.3 release only. As for coming v0.3 release, a more user-friendly installation method and it documents is in progress.

### Detached Mode

To use the **frontend**, you can directly access https://ueqri.github.io/vis4mesh-release/. The page is built by GitHub Actions on the latest release.

To use the **backend**, you can either use our example server for Akkalat in `src`, or your customized server with port 8080 listened for WebSockets and communication protocol supported. The backend is more complex to run in detached mode, please see [doc/backend.md](doc/design.md) for more details.

### Container Mode

Two docker-compose configurations are provided in [docker-compose.yml](https://github.com/ueqri/vis4mesh/blob/main/docker-compose.yml) and [example/one-key.yml](https://github.com/ueqri/vis4mesh/blob/main/example/one-key.yml). Based on these environments, there are two options to choose respectively.

#### Step 1: Setup server and database in Docker

_Backend server_ and _Redis DB_ are packed into Docker as [docker-compose.yml](https://github.com/ueqri/vis4mesh/blob/main/docker-compose.yml), which make it convenient to build and maintain the backend. Here we also introduce how to build frontend in the host, if you choose aforementioned online site, just skip the frontend build.

**Prerequisites**

- **frontend**: npm(v8.0+), NodeJS(v16.0+)
- **backend**: docker(v20.0+), docker-compose(v2.0+)

```bash
git clone git@github.com:ueqri/vis4mesh.git
cd vis4mesh
# if you use online site, skip the two `npm` commands
npm install
npm start # run webpack with HTTP server in localhost:1234
docker-compose up # add `-d` to run in background
```

#### Step 2: Setup all components in Docker

Use one-key docker-compose file to set up both **frontend** and **backend** in Docker.

```bash
git clone git@github.com:ueqri/vis4mesh.git
cd vis4mesh
docker-compose -f example/one-key.yml up # add `-d` to run in background
```

#### Step 3: After Setup

If it's all set, just open your favorable browser to view http://localhost:1234/ and see the visualization. We have provided a demo DB generated by FIR(length:100000) in 8x8 Wafer-scale GPU [akkalat v3](https://github.com/ueqri/akkalat/tree/v3). And all the backend config would be well done by docker-compose.

<details><summary>Previous example on FIR benchmark with Vis4Mesh v0.2.3</summary><img alt="vis4mesh-v2-demo" src="https://github.com/ueqri/vis4mesh/blob/main/doc/v0.2.3.png?raw=true"></details>

## Follow-up

As for follow-up work, we'd implemented these features:

- [x] Fine-tune the zoom interaction for large-scale visualization
- [x] Add minimap for mesh as another type of spatial overview
- [x] Add configuration in front to change the metric data source
- [x] Trace more status data of switch and channels in [Akkalat (Wafer-Scale GPU Simulator)](https://github.com/ueqri/akkalat) and show in side canvas
- [ ] Add plugin store to better organize gem5 tracer, GPGPUSim tracer, and Daisen co-visualization
- [ ] Migrate to [Electron](https://www.electronjs.org/) platform for one-key installation in desktop
- [ ] Build the detailed documents about the design and protocols

## Reference

[MGPUSim: Enabling Multi-GPU Performance Modeling and Optimization (ISCA'19)](https://gitlab.com/akita/mgpusim)

[Tutorial on the Akita Simulator Framework and MGPUSim (HPCA'20)](https://syifan.github.io/akita_hpca2020_tutorial.html)

[Akkalat: Wafer-Scale GPU Simulation Infrastructure (GPGPU'22)](https://github.com/ueqri/akkalat)

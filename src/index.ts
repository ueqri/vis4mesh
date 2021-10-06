import { Grid } from "./layout/grid";

import {NodeData, EdgeData} from "data"

interface Data {
  nodes: NodeData[];
  edges: EdgeData[];
}

import data from '../server/random.json'

var d: Data = data

var g = new Grid(1000,1000);
g.nodeData(d.nodes)
g.edgeData(d.edges)
console.log(g.mapNodeLocation("2"))
g.render()
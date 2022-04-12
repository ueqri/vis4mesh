package main

import (
	"flag"
	"log"
	"net/http"

	"github.com/ueqri/vis4mesh/server/graph"
	"github.com/ueqri/vis4mesh/server/response"
)

var addr = flag.String("addr", ":8080", "websocket service address without SSL")
var path = flag.String("path", "nil", "path of the dumped metrics")

func main() {
	// log.SetFlags(0)
	flag.Parse()
	if *path == "nil" {
		panic("No metrics path is provided, try the option `-path [path]`")
	}
	rsp := response.MakeWebSocketResponse(graph.MakeGraph(*path))
	http.HandleFunc("/", rsp.Handle)
	log.Fatal(http.ListenAndServe(*addr, nil))
}

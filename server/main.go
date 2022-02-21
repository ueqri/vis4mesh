package main

import (
	"flag"
	"log"
	"net/http"
	"runtime"

	"github.com/ueqri/vis4mesh/server/archive"
	"github.com/ueqri/vis4mesh/server/graph"
	"github.com/ueqri/vis4mesh/server/reader"
	"github.com/ueqri/vis4mesh/server/response"
)

var mode = flag.String("mode", "redis", "mode of backend, (redis: use Redis "+
	"database to query data for frontend request), (file: use preprocessed and "+
	"dumped archive to response), (dump: preprocess the data in Redis and dump "+
	"an archive to the path of `-archive [path]` option, and NO websocket "+
	"service would start)")

var addr = flag.String("addr", ":8080", "websocket service address without SSL")
var width = flag.Int("width", 8, "width of the mesh")
var height = flag.Int("height", 8, "height of the mesh")
var timeSlice = flag.Float64("slice", 0.0000010,
	"exact time per slice, and must be the same value as tracer config",
)
var endElapse = flag.Int("elapse", -1, "the end of the time slice to trace, "+
	"default is the maximum time slice in the database")

var archivePath = flag.String("archive", "nil", "path of the dumped archive")

var numThreads = flag.Int("thread", runtime.NumCPU(), "number of threads to "+
	"preprocess data, e.g. mesh flat")

func main() {
	// log.SetFlags(0)
	flag.Parse()
	switch *mode {
	case "redis":
		{
			rd := new(reader.RedisTracerReader)
			rd.Init()
			el := GetTracingElapseFromReader(rd)
			rsp := response.MakeWebSocketResponse(
				graph.MakeGraph(
					uint16(*width), uint16(*height), *timeSlice, el, rd, *numThreads,
				),
			)
			http.HandleFunc("/", rsp.Handle)
			log.Fatal(http.ListenAndServe(*addr, nil))
		}
	case "file":
		{
			if *archivePath == "nil" {
				panic("No archive path is provided, try the option `-archive [path]`")
			}
			if *endElapse != -1 {
				panic("End elapse cannot be customized in `file` mode so far, it is " +
					"determined by the dumped archive")
			}
			rsp := response.MakeWebSocketResponse(
				archive.LoadArchive(*archivePath),
			)
			http.HandleFunc("/", rsp.Handle)
			log.Fatal(http.ListenAndServe(*addr, nil))
		}
	case "dump":
		{
			if *archivePath == "nil" {
				panic("No archive path is provided, try the option `-archive [path]`")
			}
			rd := new(reader.RedisTracerReader)
			rd.Init()
			el := GetTracingElapseFromReader(rd)
			archive.PreprocessAndDumpGraph(*archivePath, graph.MakeGraph(
				uint16(*width), uint16(*height), *timeSlice, el, rd, *numThreads,
			),
			)
		}
	}
}

func GetTracingElapseFromReader(rd reader.Reader) uint {
	var elapse uint
	if *endElapse >= 0 {
		elapse = uint(*endElapse)
		log.Println("Limited number of time slice: ", elapse)
	} else {
		elapse = rd.GetMaxTimeSlice()
		log.Println("Total number of time slice: ", elapse)
	}
	elapse += 1 // append a padding bar in the end
	return elapse
}

package main

import (
	"flag"
	"log"
	"net/http"
)

var mesh MeshInfo
var flat FlatInfo
var redisReader RedisTracerReader

var addr = flag.String("addr", ":8080", "http service address")
var width = flag.Int("weight", 8, "width of the mesh")
var height = flag.Int("height", 8, "height of the mesh")
var timeSlice = flag.Float64("slice", 0.0000010,
	"exact time per slice, and must be the same value as tracer config",
)

var elapse int64

func main() {
	// log.SetFlags(0)
	flag.Parse()
	redisReader.Init()
	elapse = redisReader.GetMaxTimeSlice()
	log.Println("Total number of time slice: ", elapse)
	elapse += 1 // append an empty bar in the end
	mesh.Init(*width, *height, *timeSlice, elapse)

	http.HandleFunc("/echo", echo)
	http.HandleFunc("/", handle)
	log.Fatal(http.ListenAndServe(*addr, nil))
}

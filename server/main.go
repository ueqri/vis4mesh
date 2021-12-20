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
var elapse int64

func main() {
	// log.SetFlags(0)
	flag.Parse()
	redisReader.Init()
	elapse = redisReader.GetMaxTimeSlice()
	log.Println("Total number of time slice: ", elapse)
	elapse += 1 // append an empty bar in the end
	mesh.Init(8, 8, 0.0000010, elapse)

	http.HandleFunc("/echo", echo)
	http.HandleFunc("/", handle)
	log.Fatal(http.ListenAndServe(*addr, nil))
}

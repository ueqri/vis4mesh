package main

import (
	"flag"
	"log"
	"net/http"
)

var mesh MeshInfo
var redisReader RedisTracerReader

var addr = flag.String("addr", ":8080", "http service address")

func main() {
	log.SetFlags(0)
	flag.Parse()
	mesh.Init(8, 8, 0.0000010, 56)
	redisReader.Init()

	http.HandleFunc("/echo", echo)
	http.HandleFunc("/", handle)
	log.Fatal(http.ListenAndServe(*addr, nil))
}

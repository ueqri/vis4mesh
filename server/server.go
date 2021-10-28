package main

import (
	"flag"
	"log"
	"net/http"
	"strings"

	"github.com/gorilla/websocket"
)

var mesh MeshInfo
var redisReader RedisTracerReader

var addr = flag.String("addr", "localhost:8080", "http service address")

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func echo(w http.ResponseWriter, r *http.Request) {
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade:", err)
		return
	}
	defer c.Close()
	for {
		mt, message, err := c.ReadMessage()
		if err != nil {
			log.Println("read:", err)
			break
		}
		log.Printf("recv: %s", message)
		err = c.WriteMessage(mt, message)
		if err != nil {
			log.Println("write:", err)
			break
		}
	}
}

func handle(w http.ResponseWriter, r *http.Request) {
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade:", err)
		return
	}
	defer c.Close()
	for {
		mt, message, err := c.ReadMessage()
		if err != nil {
			log.Println("read:", err)
			break
		}
		log.Printf("recv: %s", message)
		msg := strings.Split(string(message[:]), " ")

		var resp []byte

		switch msg[0] {
		case "pong":
			continue // heartbeat package
		case "range":
			from := ParseInt64Decimal(msg[1])
			to := ParseInt64Decimal(msg[2])
			resp = mesh.InstRange(from, to)
		case "init":
			resp = mesh.InstInitiate()
		default:
			panic("Unrecognized instructions for vis4mesh server.")
		}

		if err := c.WriteMessage(mt, resp); err != nil {
			log.Println("write:", err)
			break
		}
	}
}

func main() {
	mesh.InitMesh()
	redisReader.Init()

	flag.Parse()
	log.SetFlags(0)
	http.HandleFunc("/echo", echo)
	http.HandleFunc("/", handle)
	log.Fatal(http.ListenAndServe(*addr, nil))
}

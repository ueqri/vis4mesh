package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gorilla/websocket"
)

var mesh MeshInfo

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
			var from, to int64
			if from, err = strconv.ParseInt(msg[1], 10, 64); err != nil {
				panic(err)
			}
			if to, err = strconv.ParseInt(msg[2], 10, 64); err != nil {
				panic(err)
			}
			resp = mesh.RandomEdges()
			// WriteStringToFile(JSONPrettyPrint([]byte(resp)), "random.json")
			fmt.Printf("%d,%d\n", from, to)
			//resp = instRange(from, to)
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
	// connectDB()
	// mesh.InitMesh()
	// WriteStringToFile(JSONPrettyPrint([]byte(mesh.InstNodes())), "random.json")
	// queryEachChannel("GPU1.GPU1_SW_0_2_0_Port[0-4]-GPU1_SW_0_3_0_Port[0-4]", 0.000003000, 0.000014500)
	// return
	mesh.InitMesh()
	flag.Parse()
	log.SetFlags(0)
	http.HandleFunc("/echo", echo)
	http.HandleFunc("/", handle)
	log.Fatal(http.ListenAndServe(*addr, nil))
}

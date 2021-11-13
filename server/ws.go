package main

import (
	"log"
	"net/http"
	"strings"

	"github.com/gorilla/websocket"
)

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
			continue // won't response heartbeat package
		case "range":
			from := ParseInt64Decimal(msg[1])
			to := ParseInt64Decimal(msg[2])
			resp = mesh.InstRange(from, to)
		case "init":
			resp = mesh.InstInitiate()
		case "rand":
			resp = mesh.InstRandom()
		default:
			panic("Unrecognized instructions for vis4mesh server")
		}

		if err := c.WriteMessage(mt, resp); err != nil {
			log.Println("write:", err)
			break
		}
	}
}

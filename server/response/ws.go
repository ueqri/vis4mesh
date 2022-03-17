package response

import (
	"log"
	"net/http"
	"strings"

	"github.com/gorilla/websocket"
	util "github.com/ueqri/vis4mesh/server/util"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func Echo(w http.ResponseWriter, r *http.Request) {
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("[echo]upgrade:", err)
		return
	}
	defer c.Close()
	for {
		mt, message, err := c.ReadMessage()
		if err != nil {
			log.Println("[echo]read:", err)
			break
		}
		log.Printf("[echo]recv: %s", message)
		err = c.WriteMessage(mt, message)
		if err != nil {
			log.Println("[echo]write:", err)
			break
		}
	}
}

func (r *WebSocketResponse) Handle(w http.ResponseWriter, req *http.Request) {
	c, err := upgrader.Upgrade(w, req, nil)
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

		var respBody []byte

		switch msg[0] {
		case "pong":
			continue // skip heartbeat package
		case "range":
			from := util.ParseUintDecimal(msg[1])
			to := util.ParseUintDecimal(msg[2])
			respBody = r.InstRangeReturnZippedEdges(from, to)
		case "flat":
			frameSize := util.ParseUintDecimal(msg[1])
			respBody = r.InstFlat(frameSize)
		case "init":
			respBody = r.InstInitiate(msg[1])
		default:
			panic("Unrecognized [ " + msg[0] + " ] instructions for Vis4Mesh server")
		}

		if err := c.WriteMessage(mt, respBody); err != nil {
			log.Println("write:", err)
			break
		}
	}
}

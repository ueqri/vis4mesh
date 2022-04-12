module github.com/ueqri/vis4mesh/server

go 1.16

require (
	github.com/gorilla/websocket v1.4.2
	gitlab.com/akita/noc/v3 v3.0.0-alpha.3
)

// Ensure the noc/v3 contains latest commit of package noctracing
replace gitlab.com/akita/noc/v3 => ../../noc

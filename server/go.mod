module server

go 1.16

require (
	github.com/go-redis/redis/v8 v8.11.4
	github.com/go-sql-driver/mysql v1.6.0
	github.com/gorilla/websocket v1.4.2
	gitlab.com/akita/util/v2 v2.0.1
)

replace gitlab.com/akita/util/v2 => ../../util

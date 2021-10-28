package main

import (
	"context"
	"fmt"
	"os"
	"strconv"

	"github.com/go-redis/redis/v8"
)

type RedisTracerReader struct {
	password    string
	ipAddress   string
	port        int
	dbNameInInt int // need convert to int for redis.
	ctx         context.Context
	rdb         *redis.Client
}

func (t *RedisTracerReader) Init() {
	t.getCredentials()
	t.connect()
}

func (t *RedisTracerReader) getCredentials() {
	t.password = os.Getenv("AKITA_TRACE_PASSWORD")
	t.ipAddress = os.Getenv("AKITA_TRACE_IP")
	if t.ipAddress == "" {
		t.ipAddress = "127.0.0.1"
	}

	portString := os.Getenv("AKITA_TRACE_PORT")
	if portString == "" {
		portString = "6379"
	}
	port, err := strconv.Atoi(portString)
	if err != nil {
		panic(err)
	}
	t.port = port

	dbNameString := os.Getenv("AKITA_TRACE_REDIS_DB")
	if dbNameString == "" {
		dbNameString = "0"
	}
	dbNameInInt, err := strconv.Atoi(dbNameString)
	if err != nil {
		panic(err)
	}
	t.dbNameInInt = dbNameInInt
}

func (t *RedisTracerReader) connect() {
	t.rdb = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%d", t.ipAddress, t.port),
		Password: t.password,
		DB:       t.dbNameInInt, // set 0 then use default DB
	})
	t.ctx = context.Background()
}

func (t *RedisTracerReader) Query(location string, fromSlice, toSlice int64) int64 {
	var count, value int64
	for time := fromSlice; time < toSlice; time++ {
		key := fmt.Sprintf("%d@%s", time, location)

		valueInString, err := t.rdb.Get(t.ctx, key).Result()
		if err == redis.Nil {
			valueInString = "0"
		} else if err != nil {
			panic(err)
		}

		value, err = strconv.ParseInt(valueInString, 10, 64)
		if err != nil {
			panic(err)
		}

		count += value
	}

	return count
}

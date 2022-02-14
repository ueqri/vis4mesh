package reader

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/ueqri/vis4mesh/server/stateless"
	"gitlab.com/akita/util/v2/tracing"
)

var recordEncoder *tracing.NetworkTracingRecordEncoder
var queriedMsgTypes []string
var numQueriedMsgTypes int

type RedisTracerReader struct {
	password    string
	ipAddress   string
	port        int
	dbNameInInt int // need convert to int for redis.
	ctx         context.Context
	rdb         *redis.Client
}

func (t *RedisTracerReader) Init() {
	queriedMsgTypes = stateless.GetQueriedMsgTypesList()
	numQueriedMsgTypes = len(queriedMsgTypes)

	t.getCredentials()
	t.connect()
	recordEncoder = tracing.NewNetworkTracingRecordEncoder(queriedMsgTypes).
		OnlyOneGPU().Only2DMesh()
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
		// MinIdleConns: 5,
		DialTimeout: 30 * time.Second,
		ReadTimeout: 30 * time.Second,
	})
	t.ctx = context.Background()
}

func (t *RedisTracerReader) queryKey(key string) uint64 {
	valueInString, err := t.rdb.Get(t.ctx, key).Result()
	if err == redis.Nil {
		valueInString = "0"
	} else if err != nil {
		panic(err)
	}
	value, err := strconv.ParseUint(valueInString, 10, 64)
	if err != nil {
		panic(err)
	}
	return value
}

// query the traffic of a certain channels during [time, time + 1)
func (t *RedisTracerReader) Query(
	fromTile, toTile [3]int, time uint,
) []uint64 {
	count := make([]uint64, numQueriedMsgTypes)

	// TODO: not sure whether the Redis query sequence would effect performance
	for i, msgType := range queriedMsgTypes {
		count[i] = t.queryKey(
			recordEncoder.Marshal(int64(time), 1, fromTile, toTile, msgType),
		)
	}

	return count
}

func (t *RedisTracerReader) getKeySliceFromRegex(pattern string) []string {
	result, err := t.rdb.Do(t.ctx, "keys", pattern).StringSlice()
	if err != nil {
		panic(err)
	}
	return result
}

func (t *RedisTracerReader) GetMaxTimeSlice() uint {
	// Assume `0@*` is always existed, i.e., number of time slice must be >= 1
	// Use exponential backoff method
	var iter uint = 1
	for {
		if len(t.getKeySliceFromRegex(fmt.Sprintf("%d@*", iter))) == 0 {
			break
		} else {
			iter *= 2
		}
	}

	// Binary Search in range [ iter/2+1, iter )
	l, r := iter/2+1, iter-1
	for l < r {
		mid := (l + r) / 2
		// l ≤ mid < r
		if len(t.getKeySliceFromRegex(fmt.Sprintf("%d@*", mid))) == 0 {
			r = mid // preserves f(r) == false
		} else {
			l = mid + 1 // preserves f(l-1) == true
		}
	}
	// l == r, f(l-1) == true, and f(r) = f(l) == false  =>  answer is l.
	return l
}

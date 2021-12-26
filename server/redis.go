package main

import (
	"context"
	"fmt"
	"os"
	"strconv"

	"github.com/go-redis/redis/v8"
	"gitlab.com/akita/util/v2/tracing"
)

var queriedMsgTypes = []string{
	"*cache.FlushReq",
	"*cache.FlushRsp",
	"*mem.DataReadyRsp",
	"*mem.ReadReq",
	"*mem.WriteDoneRsp",
	"*mem.WriteReq",
	"*protocol.FlushReq",
	"*protocol.LaunchKernelReq",
	"*protocol.MapWGReq",
	// "*protocol.MemCopyD2HReq",
	// "*protocol.MemCopyH2DReq",
	"*protocol.WGCompletionMsg",
	"*vm.TranslationReq",
	"*vm.TranslationRsp",
}

var msgTypesGroupMap = map[string]string{
	"*cache.FlushReq":           "Others",
	"*cache.FlushRsp":           "Others",
	"*mem.DataReadyRsp":         "Read",
	"*mem.ReadReq":              "Read",
	"*mem.WriteDoneRsp":         "Write",
	"*mem.WriteReq":             "Write",
	"*protocol.FlushReq":        "Others",
	"*protocol.LaunchKernelReq": "Others",
	"*protocol.MapWGReq":        "Others",
	"*protocol.WGCompletionMsg": "Others",
	"*vm.TranslationReq":        "Translation",
	"*vm.TranslationRsp":        "Translation",
}

var msgDataOrCommandMap = map[string]string{
	"*cache.FlushReq":           "C",
	"*cache.FlushRsp":           "C",
	"*mem.DataReadyRsp":         "D",
	"*mem.ReadReq":              "C",
	"*mem.WriteDoneRsp":         "C",
	"*mem.WriteReq":             "D",
	"*protocol.FlushReq":        "C",
	"*protocol.LaunchKernelReq": "C",
	"*protocol.MapWGReq":        "C",
	"*protocol.WGCompletionMsg": "C",
	"*vm.TranslationReq":        "C",
	"*vm.TranslationRsp":        "D",
}

var recordEncoder *tracing.NetworkTracingRecordEncoder

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
	})
	t.ctx = context.Background()
}

func (t *RedisTracerReader) queryKey(key string) int64 {
	valueInString, err := t.rdb.Get(t.ctx, key).Result()
	if err == redis.Nil {
		valueInString = "0"
	} else if err != nil {
		panic(err)
	}
	value, err := strconv.ParseInt(valueInString, 10, 64)
	if err != nil {
		panic(err)
	}
	return value
}

func (t *RedisTracerReader) Query(
	fromTile [3]int, toTile [3]int,
	fromSlice, toSlice int64,
) map[string]int64 {
	count := make(map[string]int64)

	for _, msgType := range queriedMsgTypes {
		count[msgType] = 0
		for time := fromSlice; time < toSlice; time++ {
			count[msgType] += t.queryKey(
				recordEncoder.Marshal(time, 1, fromTile, toTile, msgType),
			)
		}
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

func (t *RedisTracerReader) GetMaxTimeSlice() int64 {
	// Assume `0@*` is always existed, i.e., number of time slice must be >= 1
	// Use exponential backoff method
	var iter int64 = 1
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

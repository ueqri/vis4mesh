package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"os"
	"strconv"
)

//
// Function for universal use
//

func ParseInt64Decimal(str string) int64 {
	result, err := strconv.ParseInt(str, 10, 64)
	if err != nil {
		panic(err)
	}
	return result
}

func JSONPrettyPrint(in []byte) string {
	var out bytes.Buffer
	err := json.Indent(&out, []byte(in), "", "\t")
	if err != nil {
		panic(err)
	}
	return out.String()
}

func WriteStringToFile(data, file string) {
	f, err := os.Create(file)
	if err != nil {
		log.Fatal(err)
	}

	writer := bufio.NewWriter(f)
	defer f.Close()

	fmt.Fprintln(writer, data)
	writer.Flush()
}

func StringInt64MapValueAdd(
	dst map[string]int64,
	src map[string]int64,
) map[string]int64 {
	for k, v := range src {
		if _, ok := dst[k]; !ok {
			panic("Source map has a unique key not existing in destination map")
		}
		dst[k] += v
	}
	return dst
}

//
// Functions only used in vis4mesh backend
//

// required: queriedMsgTypes
func randomValueMap() map[string]int64 {
	val := make(map[string]int64)
	for _, msgType := range queriedMsgTypes {
		val[msgType] = (int64)(rand.Intn(10))
	}
	return val
}

package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strconv"
)

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

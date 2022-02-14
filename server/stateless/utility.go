package stateless

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strconv"
)

//
// Function for universal use
//

func ParseUintDecimal(str string) uint {
	result, err := strconv.ParseUint(str, 10, 64)
	if err != nil {
		panic(err)
	}
	return uint(result)
}

func ParseUint16Decimal(str string) uint16 {
	result, err := strconv.ParseUint(str, 10, 16)
	if err != nil {
		panic(err)
	}
	return uint16(result)
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

func StringUint64MapValueAdd(
	dst map[string]uint64,
	src map[string]uint64,
) map[string]uint64 {
	for k, v := range src {
		if _, ok := dst[k]; !ok {
			// panic("Source map has a unique key not existing in destination map")
			dst[k] = 0
		}
		dst[k] += v
	}
	return dst
}

func Uint64SliceValueAdd(
	dst []uint64,
	src []uint64,
) []uint64 {
	if dst == nil {
		return src
	} else if src == nil {
		panic("Source uint64 slice is nil, value-add operation halted")
	} else {
		for i, val := range src {
			dst[i] += val
		}
		return dst
	}
}

func JSONToBytes(v interface{}) []byte {
	output, err := json.Marshal(v)
	if err != nil {
		panic(err)
	}
	return output
}

package util

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io/fs"
	"io/ioutil"
	"log"
	"os"
	"os/user"
	"path/filepath"
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

func JSONToBytes(v interface{}) []byte {
	output, err := json.Marshal(v)
	if err != nil {
		panic(err)
	}
	return output
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

// File system

func FindFiles(root, extension string) []string {
	var a []string
	filepath.WalkDir(root, func(s string, d fs.DirEntry, e error) error {
		if e != nil {
			return e
		}
		if filepath.Ext(d.Name()) == extension {
			a = append(a, s)
		}
		return nil
	})
	return a
}

func ExpandTilde(path string) string {
	if len(path) == 0 || path[0] != '~' {
		return path
	}

	usr, err := user.Current()
	if err != nil {
		panic(err)
	}
	return filepath.Join(usr.HomeDir, path[1:])
}

func CheckDirectoryExist(dir string) bool {
	fileInfo, err := os.Stat(dir)
	if err != nil {
		panic(err)
	}
	return fileInfo.IsDir()
}

func CheckFileExist(file string) bool {
	_, err := os.Stat(file)
	return !os.IsNotExist(err)
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

func ReadStringFromFile(file string) string {
	content, err := ioutil.ReadFile(file)
	if err != nil {
		panic(err)
	}
	return string(content)
}

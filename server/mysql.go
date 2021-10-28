package main

import (
	"database/sql"
	"fmt"
	"os"
	"strconv"

	_ "github.com/go-sql-driver/mysql"
)

var (
	username  string
	password  string
	ipAddress string
	port      int
	dbName    string
	db        *sql.DB
)

func connectDB() {
	getCredentials()

	fmt.Printf("Open trace in db %s\n", dbName)

	var err error
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s",
		username, password, ipAddress, port, dbName)
	if db, err = sql.Open("mysql", dsn); err != nil {
		panic(err)
	}
}

func closeDB() {
	db.Close()
}

func getCredentials() {
	var err error

	username = os.Getenv("AKITA_TRACE_USERNAME")
	if username == "" {
		panic(`trace username is not set, use environment variable AKITA_TRACE_USERNAME to set it.`)
	}

	password = os.Getenv("AKITA_TRACE_PASSWORD")
	ipAddress = os.Getenv("AKITA_TRACE_IP")
	if ipAddress == "" {
		ipAddress = "127.0.0.1"
	}

	portString := os.Getenv("AKITA_TRACE_PORT")
	if portString == "" {
		portString = "3306"
	}
	port, err = strconv.Atoi(portString)
	if err != nil {
		panic(err)
	}

	dbName = os.Getenv("AKITA_TRACE_DB")
	if dbName == "" {
		panic(`trace db is not set, use environment variable AKITA_TRACE_DB to set it.`)
	}
}

func queryEachChannel(location string, from, to float64) (num int64) {
	fmt.Printf("%.9f, %.9f => ", from, to)

	what := "flit_through_channel"
	SQL :=
		"select count(*) from trace where what='%s' and location regexp '%s' and" +
			"( (start_time > %.9f and end_time < %.9f) or " +
			"(start_time > %.9f and start_time < %.9f) or " +
			"(end_time > %.9f and end_time < %.9f) or " +
			"(start_time < %.9f and end_time > %.9f) )"

	err := db.QueryRow(
		fmt.Sprintf(SQL, what, location, from, to, from, to, from, to, from, to),
	).Scan(&num)
	if err != nil {
		panic(err)
	}
	fmt.Println(num)
	return
}

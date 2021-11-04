#!/bin/sh
cd /vis4mesh/server/ && go build
echo "Server build successfully"
./server
tail -f /dev/null
#!/bin/sh
cd /vis4mesh/server/ && go build
echo "Server build successfully"
./server -width 8 -height 8
tail -f /dev/null
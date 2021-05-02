#!/usr/bin/env bash
function stop_server() {
  echo -n "Stopping server with PID $MAIN_PID.. "
  kill "$MAIN_PID"
  echo "done."
}
trap stop_server EXIT

node server/app.js &
MAIN_PID=$!

npx webpack serve

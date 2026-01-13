#!/bin/sh
set -e

SCRIPT_DIR=$(dirname "$0")
cd "$SCRIPT_DIR"

./node-v22.12.0-linux-x64/bin/node ./node_modules/vite/bin/vite.js --host 0.0.0.0 --port 5173

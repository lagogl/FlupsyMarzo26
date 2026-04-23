#!/bin/bash
NODE_BIN=$(find /nix/store -maxdepth 4 -name "node" -path "*/nodejs*/bin/node" 2>/dev/null | head -1)
if [ -z "$NODE_BIN" ]; then
  NODE_BIN=$(which node 2>/dev/null)
fi
if [ -z "$NODE_BIN" ]; then
  echo "ERROR: node not found" >&2
  exit 1
fi
echo "Using node: $NODE_BIN"
NODE_ENV=production exec "$NODE_BIN" dist/index.js

#!/usr/bin/env bash
set -euo pipefail

WORKDIR="$HOME/Desktop/hyperledgerassignment"
TEST_NETWORK_DIR="$WORKDIR/fabric-samples/test-network"

if [ ! -d "$TEST_NETWORK_DIR" ]; then
  echo "Fabric test network not found at: $TEST_NETWORK_DIR"
  exit 1
fi

cd "$TEST_NETWORK_DIR"
./network.sh down

echo "Network stopped."

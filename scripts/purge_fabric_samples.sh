#!/usr/bin/env bash
set -euo pipefail

WORKDIR="$HOME/Desktop/hyperledgerassignment"
FABRIC_DIR="$WORKDIR/fabric-samples"

if [ ! -d "$FABRIC_DIR/.git" ]; then
  echo "fabric-samples not found at: $FABRIC_DIR"
  exit 1
fi

echo "Pruning fabric-samples to only keep: bin, config, test-network, .git"
find "$FABRIC_DIR" -maxdepth 1 -mindepth 1 \
  -not -name bin \
  -not -name config \
  -not -name test-network \
  -not -name .git \
  -exec rm -rf {} +

echo "Done."

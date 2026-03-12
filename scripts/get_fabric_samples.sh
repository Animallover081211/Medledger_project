#!/usr/bin/env bash
set -euo pipefail

WORKDIR="$HOME/Desktop/hyperledgerassignment"
FABRIC_DIR="$WORKDIR/fabric-samples"

if ! command -v git >/dev/null 2>&1; then
  echo "git not found. Please install git first."
  exit 1
fi

mkdir -p "$WORKDIR"

if [ -d "$FABRIC_DIR/.git" ]; then
  echo "fabric-samples already exists at: $FABRIC_DIR"
  exit 0
fi

if [ -d "$FABRIC_DIR" ]; then
  echo "Directory exists but is not a git repo: $FABRIC_DIR"
  echo "Please remove or rename it before cloning."
  exit 1
fi

echo "Cloning fabric-samples into $FABRIC_DIR"
git clone https://github.com/hyperledger/fabric-samples.git "$FABRIC_DIR"

echo "Done."

#!/usr/bin/env bash
set -euo pipefail

WORKDIR="$HOME/Desktop/hyperledgerassignment"
FABRIC_DIR="$WORKDIR/fabric-samples"
BOOTSTRAP_SCRIPT="$FABRIC_DIR/scripts/bootstrap.sh"

if ! command -v git >/dev/null 2>&1; then
  echo "git not found. Please install git first."
  exit 1
fi

if [ ! -d "$FABRIC_DIR" ]; then
  echo "fabric-samples not found. Running scripts/get_fabric_samples.sh"
  "$WORKDIR/scripts/get_fabric_samples.sh"
fi

if [ ! -f "$BOOTSTRAP_SCRIPT" ]; then
  echo "bootstrap.sh not found at: $BOOTSTRAP_SCRIPT"
  echo "Please check your fabric-samples checkout."
  exit 1
fi

echo "Running Fabric bootstrap (downloads binaries and Docker images)..."
cd "$FABRIC_DIR"
"$BOOTSTRAP_SCRIPT"

echo "Fabric bootstrap complete."

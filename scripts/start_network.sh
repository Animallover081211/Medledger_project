#!/usr/bin/env bash
set -euo pipefail

WORKDIR="$HOME/Desktop/hyperledgerassignment"
FABRIC_DIR="$WORKDIR/fabric-samples"
TEST_NETWORK_DIR="$FABRIC_DIR/test-network"
CHAINCODE_DIR="$WORKDIR/medledger-chain-go"
CHANNEL_NAME="medledger"
CHAINCODE_NAME="medledger"
CHANNEL_BLOCK="$TEST_NETWORK_DIR/channel-artifacts/${CHANNEL_NAME}.block"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found. Please install Docker Desktop first."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running. Please start Docker Desktop."
  exit 1
fi

if [ ! -d "$TEST_NETWORK_DIR" ]; then
  echo "Fabric test network not found at: $TEST_NETWORK_DIR"
  echo "Run scripts/get_fabric_samples.sh and scripts/setup_fabric.sh first."
  exit 1
fi

if [ ! -d "$CHAINCODE_DIR" ]; then
  echo "Chaincode not found at: $CHAINCODE_DIR"
  exit 1
fi

cd "$TEST_NETWORK_DIR"

if [ -f "$CHANNEL_BLOCK" ]; then
  echo "Channel block found. Bringing up Fabric test network without re-creating channel: $CHANNEL_NAME"
  ./network.sh up
else
  echo "Bringing up Fabric test network and creating channel: $CHANNEL_NAME"
  ./network.sh up createChannel -c "$CHANNEL_NAME"
fi

echo "Deploying chaincode: $CHAINCODE_NAME"
./network.sh deployCC \
  -ccn "$CHAINCODE_NAME" \
  -ccp "$CHAINCODE_DIR" \
  -ccl go \
  -ccep "AND('Org1MSP.peer', 'Org2MSP.peer')" \
  -c "$CHANNEL_NAME"

echo "Network ready."

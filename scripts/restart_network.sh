#!/usr/bin/env bash
set -euo pipefail

WORKDIR="$HOME/Desktop/hyperledgerassignment"
FABRIC_DIR="$WORKDIR/fabric-samples"
TEST_NETWORK_DIR="$FABRIC_DIR/test-network"
CHAINCODE_DIR="$WORKDIR/medledger-chain-go"
CHANNEL_NAME="medledger"
CHAINCODE_NAME="medledger"

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

./network.sh down
./network.sh up createChannel -c "$CHANNEL_NAME"
./network.sh deployCC -ccn "$CHAINCODE_NAME" -ccp "$CHAINCODE_DIR" -ccl go -ccep "AND('HospitalMSP.peer', 'GpClinicMSP.peer')" -c "$CHANNEL_NAME"

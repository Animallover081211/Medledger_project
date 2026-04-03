#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_NETWORK_DIR="$ROOT_DIR/fabric-samples/test-network"
FABRIC_BIN_DIR="$ROOT_DIR/fabric-samples/bin"
FABRIC_CFG_DIR="$ROOT_DIR/fabric-samples/config"

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

cd "$TEST_NETWORK_DIR"
export PATH="$FABRIC_BIN_DIR:$PATH"
export FABRIC_CFG_PATH="$FABRIC_CFG_DIR"
export $(./setOrgEnv.sh Hospital | xargs)

if ! command -v peer >/dev/null 2>&1; then
  echo "Fabric peer binary not found. Run scripts/setup_fabric.sh to download binaries."
  exit 1
fi

if [ ! -d "$TEST_NETWORK_DIR/organizations" ]; then
  echo "Fabric network is not up. Run scripts/start_network.sh first."
  exit 1
fi

TEST_SUFFIX="$(date +%s%N)_$$_${RANDOM}"
PATIENT_ID="p${TEST_SUFFIX}"
DOCTOR_ID="d${TEST_SUFFIX}"

invoke() {
  peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
    --tls --cafile "$TEST_NETWORK_DIR/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem" \
    --peerAddresses localhost:7051 \
    --tlsRootCertFiles "$TEST_NETWORK_DIR/organizations/peerOrganizations/hospital.example.com/tlsca/tlsca.hospital.example.com-cert.pem" \
    --peerAddresses localhost:9051 \
    --tlsRootCertFiles "$TEST_NETWORK_DIR/organizations/peerOrganizations/gpclinic.example.com/tlsca/tlsca.gpclinic.example.com-cert.pem" \
    --waitForEvent --waitForEventTimeout 30s \
    -C medledger -n medledger -c "$1"
}

query() {
  peer chaincode query -C medledger -n medledger -c "$1"
}

echo "Using patient: $PATIENT_ID"
echo "Using doctor:  $DOCTOR_ID"

invoke "{\"function\":\"RegisterPatient\",\"Args\":[\"${PATIENT_ID}\",\"Alice\"]}"
invoke "{\"function\":\"RegisterDoctor\",\"Args\":[\"${DOCTOR_ID}\",\"Dr Bob\",\"Cardiology\"]}"
invoke "{\"function\":\"GrantConsent\",\"Args\":[\"${PATIENT_ID}\",\"${DOCTOR_ID}\"]}"
invoke "{\"function\":\"RequestAccess\",\"Args\":[\"${PATIENT_ID}\",\"${DOCTOR_ID}\"]}"
invoke "{\"function\":\"EmergencyAccess\",\"Args\":[\"${PATIENT_ID}\",\"${DOCTOR_ID}\",\"ER_OVERRIDE\"]}"
query  "{\"function\":\"GetAuditLog\",\"Args\":[\"${PATIENT_ID}\"]}"

#!/usr/bin/env bash
set -euo pipefail

WORKDIR="$HOME/Desktop/hyperledgerassignment"
APP_DIR="$WORKDIR/medlegder-frontend"
ENV_FILE="$APP_DIR/.env"
export ENV_FILE
ORG_DIR="$WORKDIR/fabric-samples/test-network/organizations"
FABRIC_ORG="${FABRIC_ORG:-hospital}"

case "${FABRIC_ORG,,}" in
  hospital)
    FABRIC_MSP_ID="HospitalMSP"
    FABRIC_PEER_ENDPOINT="localhost:7051"
    FABRIC_DOMAIN="hospital.example.com"
    ;;
  gpclinic)
    FABRIC_MSP_ID="GpClinicMSP"
    FABRIC_PEER_ENDPOINT="localhost:9051"
    FABRIC_DOMAIN="gpclinic.example.com"
    ;;
  pharmacy)
    FABRIC_MSP_ID="PharmacyMSP"
    FABRIC_PEER_ENDPOINT="localhost:11051"
    FABRIC_DOMAIN="pharmacy.example.com"
    ;;
  regulator)
    FABRIC_MSP_ID="RegulatorMSP"
    FABRIC_PEER_ENDPOINT="localhost:13051"
    FABRIC_DOMAIN="regulator.example.com"
    ;;
  *)
    echo "Unknown FABRIC_ORG: ${FABRIC_ORG}"
    echo "Use hospital, gpclinic, pharmacy, or regulator."
    exit 1
    ;;
esac
export FABRIC_MSP_ID FABRIC_PEER_ENDPOINT FABRIC_DOMAIN

if [ ! -d "$ORG_DIR" ]; then
  echo "Fabric organizations not found at: $ORG_DIR"
  echo "Start the network first (./scripts/start_network.sh)."
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 not found. Please install Python 3 to update the .env file."
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo ".env not found. Copying from .env.example"
  cp "$APP_DIR/.env.example" "$ENV_FILE"
fi

CERT_PATH="$ORG_DIR/peerOrganizations/$FABRIC_DOMAIN/users/Admin@$FABRIC_DOMAIN/msp/signcerts/Admin@$FABRIC_DOMAIN-cert.pem"
KEY_PATH="$ORG_DIR/peerOrganizations/$FABRIC_DOMAIN/users/Admin@$FABRIC_DOMAIN/msp/keystore/priv_sk"
TLS_CERT_PATH="$ORG_DIR/peerOrganizations/$FABRIC_DOMAIN/tlsca/tlsca.$FABRIC_DOMAIN-cert.pem"

if [ -z "$CERT_PATH" ] || [ ! -f "$CERT_PATH" ]; then
  echo "Admin cert not found. Start the network first."
  exit 1
fi

if [ -z "$KEY_PATH" ] || [ ! -f "$KEY_PATH" ]; then
  echo "Admin private key not found. Start the network first."
  exit 1
fi

if [ ! -f "$TLS_CERT_PATH" ]; then
  echo "TLS cert not found at: $TLS_CERT_PATH"
  exit 1
fi

export FABRIC_TLS_CERT_PATH="$TLS_CERT_PATH"
export FABRIC_USER_CERT_PATH="$CERT_PATH"
export FABRIC_USER_KEY_PATH="$KEY_PATH"
export FABRIC_CHANNEL="medledger"
export FABRIC_CHAINCODE="medledger"
export FABRIC_ENDORSING_ORGS="HospitalMSP,GpClinicMSP"

python3 - <<'PY'
import os
import re

env_file = os.environ["ENV_FILE"]
pairs = {
    "FABRIC_MSP_ID": os.environ["FABRIC_MSP_ID"],
    "FABRIC_PEER_ENDPOINT": os.environ["FABRIC_PEER_ENDPOINT"],
    "FABRIC_TLS_CERT_PATH": os.environ["FABRIC_TLS_CERT_PATH"],
    "FABRIC_USER_CERT_PATH": os.environ["FABRIC_USER_CERT_PATH"],
    "FABRIC_USER_KEY_PATH": os.environ["FABRIC_USER_KEY_PATH"],
    "FABRIC_CHANNEL": os.environ["FABRIC_CHANNEL"],
    "FABRIC_CHAINCODE": os.environ["FABRIC_CHAINCODE"],
    "FABRIC_ENDORSING_ORGS": os.environ["FABRIC_ENDORSING_ORGS"],
}

lines = []
if os.path.exists(env_file):
    with open(env_file, "r", encoding="utf-8") as f:
        lines = f.read().splitlines()

new_lines = []
seen = set()
for line in lines:
    m = re.match(r"^([A-Z0-9_]+)=", line)
    if m and m.group(1) in pairs:
        key = m.group(1)
        new_lines.append(f"{key}={pairs[key]}")
        seen.add(key)
    else:
        new_lines.append(line)

for key, value in pairs.items():
    if key not in seen:
        new_lines.append(f"{key}={value}")

with open(env_file, "w", encoding="utf-8") as f:
    f.write("\n".join(new_lines).rstrip() + "\n")
PY

echo "Fabric env updated in: $ENV_FILE"

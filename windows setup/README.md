# Windows Setup (Manual Steps)

This guide mirrors the repo scripts but uses manual Windows CMD steps. Do **not** run the `scripts/*.sh` files on Windows CMD.

Replace `<you>` with your actual Windows username in every path (CMD and Git Bash).
For example, if your username is `Alice`, use `C:\Users\Alice\Desktop\...` and `/c/Users/Alice/Desktop/...`.

These instructions assume the repo is located at:

`C:\Users\<you>\Desktop\hyperledgerassignment`

If your path is different, adjust all paths below.

## Prerequisites

Install these on Windows 10/11:

- Git for Windows
- Docker Desktop (Linux containers)
- Node.js (LTS)
- Bun
- Go
- Python 3

Verify in CMD:

```bat
node --version
npm --version
bun --version
go version
python --version
git --version
docker --version
```

## 1) Clone fabric-samples

From CMD in the repo root:

```bat
git clone https://github.com/hyperledger/fabric-samples.git "C:\Users\<you>\Desktop\hyperledgerassignment\fabric-samples"
```

If the folder already exists, delete or rename it before cloning.

## 2) Download Fabric binaries + Docker images

The official `bootstrap.sh` script inside `fabric-samples` chooses the Fabric versions. We’ll read those versions and download manually.

1) Open the file to read the version variables:

```bat
type "C:\Users\<you>\Desktop\hyperledgerassignment\fabric-samples\scripts\bootstrap.sh" | findstr /I "FABRIC_VERSION CA_VERSION"
```

You should see something like:

```
FABRIC_VERSION=2.5.x
CA_VERSION=1.5.x
```

2) Set the versions in CMD (replace with the values you saw):

```bat
set FABRIC_VERSION=2.5.x
set CA_VERSION=1.5.x
```

3) Download and extract the Fabric binaries for Windows:

```bat
cd /d C:\Users\<you>\Desktop\hyperledgerassignment\fabric-samples
curl -L -o fabric-binaries.zip https://github.com/hyperledger/fabric/releases/download/v%FABRIC_VERSION%/hyperledger-fabric-windows-amd64-%FABRIC_VERSION%.zip
mkdir bin
powershell -Command "Expand-Archive -Force fabric-binaries.zip bin"
```

4) Pull the required Docker images:

```bat
docker pull hyperledger/fabric-peer:%FABRIC_VERSION%
docker pull hyperledger/fabric-orderer:%FABRIC_VERSION%
docker pull hyperledger/fabric-ccenv:%FABRIC_VERSION%
docker pull hyperledger/fabric-tools:%FABRIC_VERSION%
docker pull hyperledger/fabric-baseos:%FABRIC_VERSION%
docker pull hyperledger/fabric-ca:%CA_VERSION%
```

## 3) Start the Fabric test network and deploy chaincode

The Fabric test network uses bash scripts. On Windows CMD, you can invoke Git Bash explicitly.

1) Make sure Docker Desktop is running.

2) From CMD, run the network using Git Bash:

```bat
"C:\Program Files\Git\bin\bash.exe" -lc "cd /c/Users/<you>/Desktop/hyperledgerassignment/fabric-samples/test-network && ./network.sh up -ca"
"C:\Program Files\Git\bin\bash.exe" -lc "cd /c/Users/<you>/Desktop/hyperledgerassignment/fabric-samples/test-network && ./network.sh createChannel -c medledger"
"C:\Program Files\Git\bin\bash.exe" -lc "cd /c/Users/<you>/Desktop/hyperledgerassignment/fabric-samples/test-network && ./network.sh deployCC -ccn medledger -ccp /c/Users/<you>/Desktop/hyperledgerassignment/medledger-chain-go -ccl go -c medledger -ccep \"OR('Org1MSP.peer')\""
```

If the channel already exists, you can skip the `createChannel` line.

## 4) Configure the frontend Fabric environment

1) Copy the env template:

```bat
copy "C:\Users\<you>\Desktop\hyperledgerassignment\medlegder-frontend\.env.example" "C:\Users\<you>\Desktop\hyperledgerassignment\medlegder-frontend\.env"
```

2) Find the Org1 Admin cert and key paths:

```bat
dir /s /b "C:\Users\<you>\Desktop\hyperledgerassignment\fabric-samples\test-network\organizations" | findstr /I "Admin@org1.example.com\\signcerts"
dir /s /b "C:\Users\<you>\Desktop\hyperledgerassignment\fabric-samples\test-network\organizations" | findstr /I "Admin@org1.example.com\\keystore"
```

From those results:

- `FABRIC_USER_CERT_PATH` should point to the `.pem` inside `signcerts`.
- `FABRIC_USER_KEY_PATH` should point to the single file inside `keystore`.
- `FABRIC_TLS_CERT_PATH` is:

```
C:\Users\<you>\Desktop\hyperledgerassignment\fabric-samples\test-network\organizations\peerOrganizations\org1.example.com\tlsca\tlsca.org1.example.com-cert.pem
```

3) Edit `medlegder-frontend\.env` and set the values (example):

```
FABRIC_MSP_ID=Org1MSP
FABRIC_PEER_ENDPOINT=localhost:7051
FABRIC_TLS_CERT_PATH=C:\Users\<you>\Desktop\hyperledgerassignment\fabric-samples\test-network\organizations\peerOrganizations\org1.example.com\tlsca\tlsca.org1.example.com-cert.pem
FABRIC_USER_CERT_PATH=C:\Users\<you>\Desktop\hyperledgerassignment\fabric-samples\test-network\organizations\peerOrganizations\org1.example.com\users\Admin@org1.example.com\msp\signcerts\cert.pem
FABRIC_USER_KEY_PATH=C:\Users\<you>\Desktop\hyperledgerassignment\fabric-samples\test-network\organizations\peerOrganizations\org1.example.com\users\Admin@org1.example.com\msp\keystore\<private_key_filename>
FABRIC_CHANNEL=medledger
FABRIC_CHAINCODE=medledger
FABRIC_ENDORSING_ORGS=Org1MSP
```

## 5) Create the local database

From CMD:

```bat
cd /d C:\Users\<you>\Desktop\hyperledgerassignment\medlegder-frontend
bun install
bunx drizzle-kit generate
bunx drizzle-kit push
```

If `.env` does not exist, create it and add:

```
DATABASE_URL=file:./local.db
DATABASE_AUTH_TOKEN=
```

## 6) Run the web app

```bat
cd /d C:\Users\<you>\Desktop\hyperledgerassignment\medlegder-frontend
bun dev
```

Open `http://localhost:3000`.

## 7) Stop or reset the network

Stop the network:

```bat
"C:\Program Files\Git\bin\bash.exe" -lc "cd /c/Users/<you>/Desktop/hyperledgerassignment/fabric-samples/test-network && ./network.sh down"
```

Full reset (down, up, create channel, deploy chaincode):

```bat
"C:\Program Files\Git\bin\bash.exe" -lc "cd /c/Users/<you>/Desktop/hyperledgerassignment/fabric-samples/test-network && ./network.sh down"
"C:\Program Files\Git\bin\bash.exe" -lc "cd /c/Users/<you>/Desktop/hyperledgerassignment/fabric-samples/test-network && ./network.sh up -ca"
"C:\Program Files\Git\bin\bash.exe" -lc "cd /c/Users/<you>/Desktop/hyperledgerassignment/fabric-samples/test-network && ./network.sh createChannel -c medledger"
"C:\Program Files\Git\bin\bash.exe" -lc "cd /c/Users/<you>/Desktop/hyperledgerassignment/fabric-samples/test-network && ./network.sh deployCC -ccn medledger -ccp /c/Users/<you>/Desktop/hyperledgerassignment/medledger-chain-go -ccl go -c medledger -ccep \"OR('Org1MSP.peer')\""
```

## 8) Optional: Chaincode CLI sanity test

This test uses the Fabric peer binary and Org1 environment from the test network.

```bat
"C:\Program Files\Git\bin\bash.exe" -lc "cd /c/Users/<you>/Desktop/hyperledgerassignment/fabric-samples/test-network && export PATH=/c/Users/<you>/Desktop/hyperledgerassignment/fabric-samples/bin:$PATH && export FABRIC_CFG_PATH=/c/Users/<you>/Desktop/hyperledgerassignment/fabric-samples/config && export $(./setOrgEnv.sh Org1 | xargs) && peer version"
```

If `peer version` works, you can run the test script from Git Bash:

```bat
"C:\Program Files\Git\bin\bash.exe" -lc "cd /c/Users/<you>/Desktop/hyperledgerassignment && ./scripts/chaincode_cli_tests.sh"
```

## Notes

- These steps intentionally avoid running the repo’s `.sh` scripts directly in CMD.
- You can still use Git Bash to run Fabric’s `network.sh` scripts, since they are required by Fabric’s test network.
- If Docker is set to Windows containers, switch to Linux containers in Docker Desktop.

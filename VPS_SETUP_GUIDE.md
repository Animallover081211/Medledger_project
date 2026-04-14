# VPS Setup Guide

This project can be run on a VPS for testing, but it is still the same local Fabric test-network flow.

## What this setup is

- Next.js frontend runs on the VPS.
- Fabric test network runs in Docker on the VPS.
- The Go code in `medledger-chain-go/` is chaincode, not a standalone backend server.
- Postgres runs on the VPS.

## What you need

- Ubuntu VPS with sudo access.

## Connect to VPS

```bash
ssh -p 22022 root@209.74.86.8
```
- Docker Engine and Docker Compose plugin.
- Git.
- Go.
- Bun.
- Node.js.
- Python 3.
- PostgreSQL.

## 1) Create a working directory

Use the same path expected by the scripts if possible:

```bash
mkdir -p ~/Desktop
cd ~/Desktop
git clone <your-repo-url> hyperledgerassignment
cd hyperledgerassignment
```

If you clone somewhere else, update the `WORKDIR=` lines in the scripts under `scripts/`.

## 2) Install system packages

On Ubuntu:

```bash
sudo apt update
sudo apt install -y git curl unzip ca-certificates gnupg lsb-release python3 python3-pip postgresql postgresql-contrib
```

## 3) Install Docker

Install Docker Engine and the Compose plugin, then verify:

```bash
docker --version
docker compose version
```

Make sure your user can run Docker without sudo:

```bash
sudo usermod -aG docker $USER
```

Log out and back in after that.

## 4) Install Go

Install a recent Go release and verify:

```bash
go version
```

## 5) Install Bun

```bash
curl -fsSL https://bun.sh/install | bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
bun --version
```

Add the Bun PATH export to `~/.zshrc` or `~/.bashrc` if needed.

## 6) Install Node.js

Install Node.js 20 or newer and verify:

```bash
node --version
npm --version
```

## 7) Get Fabric samples

From the repo root:

```bash
chmod +x ./scripts/*.sh
./scripts/get_fabric_samples.sh
```

This downloads `fabric-samples/` into the repo folder.

## 8) Bootstrap Fabric binaries and images

```bash
./scripts/setup_fabric.sh
```

This downloads the Fabric binaries and Docker images used by the test network.

## 9) Start the Fabric network

```bash
./scripts/start_network.sh
```

This will:

- Start the Fabric test network.
- Create the `medledger` channel.
- Deploy the `medledger` Go chaincode.

## 10) Configure the frontend Fabric env

Pick the org you want the frontend to use first:

```bash
FABRIC_ORG=hospital ./scripts/configure_fabric_env.sh
```

Other valid values are:

- `gpclinic`
- `pharmacy`
- `regulator`

This writes `medlegder-frontend/.env` with Fabric paths from the running network.

## 11) Set up Postgres

Create the database and user if needed:

```bash
sudo -u postgres psql
```

Inside `psql`:

```sql
CREATE DATABASE medledger;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE medledger TO postgres;
```

Then exit `psql`.

If you use different credentials, update `medlegder-frontend/.env` so `DATABASE_URL` matches.

## 12) Run database migrations

```bash
./scripts/run_db_migrations.sh
```

## 13) Start the frontend

```bash
cd medlegder-frontend
bun install
bun run dev
```

For a production-style run:

```bash
bun run build
bun run start
```

## 14) Verify it works

- Open the app on the VPS port `3000`.
- Confirm the API routes can reach Fabric.
- Run `./scripts/chaincode_cli_tests.sh` if you want a chaincode sanity check.

## Common problems

- If scripts fail because of paths, update the hardcoded `WORKDIR="$HOME/Desktop/hyperledgerassignment"` values.
- If Fabric env setup fails, make sure the network is already running.
- If the app cannot reach Fabric, check `FABRIC_PEER_ENDPOINT` and the cert paths in `.env`.
- If Postgres login fails, fix `DATABASE_URL`.

## Important note

This is suitable for a project demo or test environment, not a production Fabric deployment.

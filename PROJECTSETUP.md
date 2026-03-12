# MedLedger (Hyperledger Assignment)

## Required local path

These scripts assume the repo is cloned into:

`~/Desktop/hyperledgerassignment`

If you clone into a different location, the scripts will fail unless you edit the hardcoded paths.

## Quick setup (macOS)

All scripts live in `~/Desktop/hyperledgerassignment/scripts`. Run them from the repo root like this:

```bash
./scripts/get_fabric_samples.sh
```

If you see “permission denied” on macOS, run once:

```bash
chmod +x ./scripts/*.sh
```

Install local requirements first (Node, Bun, Go):

```bash
cat INSTALL_REQUIREMENTS.md
```

## 1) Fabric samples + binaries

1. `./scripts/get_fabric_samples.sh` (clones `fabric-samples` locally; not committed to Git)
2. `./scripts/setup_fabric.sh` (downloads Fabric binaries + Docker images)

## 2) Network + chaincode

1. `./scripts/start_network.sh` (starts network, creates channel, deploys chaincode)
2. `./scripts/chaincode_cli_tests.sh` (sanity check chaincode endorsements)

## 3) Web app

1. `cd medlegder-frontend && bun install`
2. `./scripts/configure_fabric_env.sh` (auto-configs Fabric paths in `.env`)
3. `./scripts/run_db_migrations.sh` (creates the local DB)
4. `cd medlegder-frontend && bun dev` (start the app at `http://localhost:3000`)

## If you need a clean reset

```bash
./scripts/restart_network.sh
```

This tears down the network and recreates the channel and chaincode from scratch.

## Notes

- `fabric-samples/` is intentionally not tracked in Git; each user downloads it locally.
- Fabric certs/keys are generated per machine, so `.env` must be created locally.

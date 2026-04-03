# Hospital API Test Errors

## Fabric Network Issue

All peer containers (hospital, gpclinic, pharmacy, regulator) are **Exited (1)**.

### Error
```
FABRIC_CFG_PATH /etc/hyperledger/peercfg does not exist
```

### Root Cause
The multi-org setup broke the peer container configuration. The `compose-test-net.yaml` is missing the proper volume mounts for `/etc/hyperledger/peercfg` that the Fabric peer image expects.

### Files Needing Fix
- `fabric-samples/test-network/compose/compose-test-net.yaml` - peer containers need proper `FABRIC_CFG_PATH` volume mounts

### Status
**NOT FIXED** - requires Docker Compose configuration work. User requested to stop after one try.

# MedLedger Multi-Organisation Network Architecture

## Current State

The Fabric test-network currently has only **2 peer organizations** (Org1, Org2) and uses the default `mychannel`.

## Target Architecture

We will redesign the network to represent **4 healthcare organisations** plus an **Orderer organization**:

| Organisation | MSP ID | Role | Peer Node |
|-------------|--------|------|-----------|
| **Orderer** | OrdererMSP | Transaction ordering | orderer.example.com |
| **Hospital** | HospitalMSP | Secondary care, specialists | peer0.hospital.example.com |
| **GP Clinic** |GpClinicMSP | Primary care, general practitioners | peer0.gpclinic.example.com |
| **Pharmacy** | PharmacyMSP | Dispensing medications | peer0.pharmacy.example.com |
| **Regulator** | RegulatorMSP | Auditing, compliance oversight | peer0.regulator.example.com |

## Channel Configuration

**Channel Name**: `medledger`

**Channel Participants**:
- Hospital (owns patient records for secondary care)
- GP Clinic (owns patient records for primary care)
- Pharmacy (needs read access to prescriptions)
- Regulator (read-only access for audit purposes)

## Chaincode Endorsement Policy

The medledger chaincode will require endorsements from **Hospital AND GP Clinic** (the two clinical care providers) to ensure medical records are approved by care providers.

```
OR('HospitalMSP.member', 'GpClinicMSP.member')
```

## Network Topology

```
                                    ┌─────────────────┐
                                    │  Regulator      │
                                    │  (Auditor)      │
                                    │  peer0.regulator│
                                    └────────┬────────┘
                                             │
                                             │ Read-only
                                             │ access
┌──────────────┐    ┌──────────────┐         │
│   Hospital   │◄──►│   GP Clinic  │◄────────┤
│  peer0.hos-  │◄──►│  peer0.gpcli-│         │
│  pital       │    │  nic         │         │
└──────┬───────┘    └──────┬───────┘         │
       │                   │                  │
       │    ┌──────────────┴──────┐           │
       │    │    Orderer Org     │           │
       └───►│  orderer[1-3].exam-│◄──────────┘
            │  ple.com (Raft)    │
            └────────────────────┘

       ┌──────────────┐
       │   Pharmacy   │
       │ peer0.pharma-│
       │ cy           │
       └──────────────┘
       (Medication verification)
```

## Implementation Tasks

### Phase 1: Network Configuration

- [ ] Update `configtx/configtx.yaml` with 4 new organisation definitions
- [ ] Create `organizations/cryptogen/crypto-config-*.yaml` for each new org
- [ ] Update `compose/compose-test-net.yaml` with new peer containers
- [ ] Update `compose/compose-ca.yaml` with new CA containers

### Phase 2: Channel Configuration

- [ ] Update channel profile in `configtx.yaml` to include all 4 orgs
- [ ] Update `scripts/createChannel.sh` to create `medledger` channel
- [ ] Add join channel commands for all peers

### Phase 3: Chaincode Configuration

- [ ] Update `scripts/deployCC.sh` to install on all 4 orgs
- [ ] Set endorsement policy requiring Hospital AND GpClinic signatures
- [ ] Update `scripts/ccutils.sh` for multi-org invokes

### Phase 4: Environment & Scripts

- [ ] Update `scripts/envVar.sh` with new org environment variables
- [ ] Update `network.config` with medledger channel name
- [ ] Test network bring-up with all 4 organisations

## File Modifications Summary

| File | Action |
|------|--------|
| `configtx/configtx.yaml` | Add Hospital, GpClinic, Pharmacy, Regulator orgs |
| `organizations/cryptogen/crypto-config-hospital.yaml` | Create |
| `organizations/cryptogen/crypto-config-gpclinic.yaml` | Create |
| `organizations/cryptogen/crypto-config-pharmacy.yaml` | Create |
| `organizations/cryptogen/crypto-config-regulator.yaml` | Create |
| `compose/compose-test-net.yaml` | Add new peer services |
| `compose/compose-ca.yaml` | Add new CA services |
| `scripts/createChannel.sh` | Add orgs to channel |
| `scripts/deployCC.sh` | Install on all orgs |
| `scripts/envVar.sh` | Add org env vars |
| `scripts/ccutils.sh` | Update for 4 orgs |

## Docker Container Layout

After implementation, the following containers will run:

```
medledger-orderer1
medledger-orderer2
medledger-orderer3
medledger-peer0.hospital
medledger-peer0.gpclinic
medledger-peer0.pharmacy
medledger-peer0.regulator
medledger-ca-hospital
medledger-ca-gpclinic
medledger-ca-pharmacy
medledger-ca-regulator
```

## Next Steps

1. Run `addOrg3/` template scripts as reference
2. Generate crypto material for all 4 organisations
3. Bring up network with all Docker containers
4. Create `medledger` channel with all 4 orgs
5. Deploy medledger chaincode with proper endorsement policy
6. Test cross-organisation transactions

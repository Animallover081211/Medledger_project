# Fabric and Chaincode Methodology

## Purpose

The blockchain layer in MedLedger was designed to provide trust, traceability, and access control without storing unnecessary application data on-chain.

The Fabric network is responsible for:

- identity registration
- consent management
- access requests
- emergency access logging
- immutable audit trails

The chaincode was kept intentionally small so the smart-contract logic stays readable and easy to verify.

## Why Fabric Was Used

Hyperledger Fabric fits this project because healthcare workflows need:

- permissioned participation
- role-based access
- transaction history
- auditable state changes
- predictable identity control

Unlike a public blockchain, Fabric lets the system separate healthcare organisations and manage them with controlled memberships.

## Chaincode Design Approach

The chaincode was written around core healthcare entities:

- `Patient`
- `Doctor`
- `ConsentRecord`
- `AuditLog`

The methodology was to keep the ledger focused on:

- who exists
- who can access what
- when consent changes
- what action was taken

This reduces complexity and avoids storing large medical payloads on-chain.

## Smart Contract Flow

### 1. Register identity

Patients and doctors are registered on the ledger with:

- ID
- name
- role-specific metadata

### 2. Manage consent

Patients can grant or revoke consent for a doctor.

This is stored as a consent record on the ledger and also written into the audit trail.

### 3. Request access

Doctors request access before viewing or creating records.

The chaincode checks whether the patient has granted consent and returns allowed or denied.

### 4. Emergency access

Emergency access is recorded separately so the event is visible in audit history.

This supports clinical urgency while preserving accountability.

### 5. Read audit logs

The ledger can return patient-level audit history so actions remain traceable over time.

## Data Rules

The blockchain layer follows these rules:

- store trust-related state on-chain
- keep medical payloads off-chain in PostgreSQL
- never store passwords on-chain
- keep audit records immutable
- reject duplicate identities

## Organisation Model

The project is moving toward a four-organisation healthcare network:

- Hospital
- GP Clinic
- Pharmacy
- Regulator

The methodology behind this model is:

- hospitals and clinics represent care providers
- pharmacy handles prescription verification
- regulator provides oversight
- each organisation can be extended without changing the core trust model

## Endorsement Strategy

The original Fabric sample network used the default test-network layout, but the project direction is a healthcare-specific multi-organisation structure.

The endorsement strategy is meant to ensure that:

- clinical actions are checked by authorised healthcare identities
- access decisions are not controlled by a single untrusted party
- the network reflects real healthcare separation of duties

## Off-Chain and On-Chain Separation

The chaincode does not store:

- user passwords
- large medical notes
- frontend session data
- display-only user profiles

Instead, it stores only the trust-critical information needed to prove identity, consent, and access history.

This split improves:

- performance
- privacy
- maintainability
- presentation clarity

## Presentation Summary

If you need a short explanation for your video, use this:

> Fabric is used as the trust layer in MedLedger. The chaincode registers identities, records consent, checks access, and writes audit logs. It does not store passwords or full medical payloads. That data is kept in PostgreSQL, while the ledger preserves the verifiable history of healthcare actions.

## Key Result

The chaincode layer provides the backbone of integrity for the system:

- patient identity
- doctor identity
- consent enforcement
- emergency accountability
- immutable audit logging

This makes the rest of the application trustworthy without overloading the blockchain with unnecessary data.


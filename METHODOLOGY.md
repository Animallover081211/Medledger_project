# MedLedger Methodology

## Overview

MedLedger was built using an incremental, role-based development methodology. The goal was to combine blockchain trust, off-chain storage, and a modern web interface into one healthcare workflow that is easy to present and easy to test.

The project was developed around three main ideas:

1. **Identity and consent on blockchain**
2. **Medical records and app data in PostgreSQL**
3. **Role-specific dashboards in Next.js**

## Development Approach

The work followed a layered implementation strategy:

- **Layer 1: Network and identity**
  - Define healthcare organisations and roles
  - Register users with unique identities
  - Control access through blockchain-backed identity checks

- **Layer 2: Application data**
  - Store login credentials and app-side metadata in PostgreSQL
  - Keep passwords hashed
  - Keep sensitive blockchain actions separate from app storage

- **Layer 3: Frontend workflow**
  - Build separate dashboards for patients, doctors, hospital staff, pharmacy, and regulator
  - Add dropdown-based user selection where manual input was error-prone
  - Improve mobile layout and usability

- **Layer 4: Verification and testing**
  - Run lint checks after each major UI and API change
  - Test role-based redirects, record creation, consent flow, and pharmacy actions
  - Fix issues incrementally instead of changing everything at once

## System Design Methodology

The system uses a **hybrid architecture**:

- **Hyperledger Fabric** handles:
  - user identity registration
  - consent management
  - audit logging
  - access decisions

- **PostgreSQL** handles:
  - app login credentials
  - generated user account records
  - medical record storage
  - pharmacy history and verification tracking

- **Next.js** handles:
  - user registration and login
  - role-specific dashboards
  - API routes between the browser and backend services

This separation keeps secrets out of the ledger and keeps the blockchain focused on integrity and trust.

## Role-Based Workflow

### Patient

- Registers and logs in with a generated ID and password
- Grants or revokes access to their records
- Views consent and audit activity

### Doctor

- Logs in as doctor or hospital staff
- Requests patient access
- Views registered patients through dropdown lists
- Creates medical records and prescription entries

### Pharmacy

- Verifies prescriptions before dispensing
- Tracks verified and dispensed prescription history
- Uses a combined history view for better traceability

### Regulator

- Reviews all registered users
- Searches users by name, ID, or role
- Checks audit and compliance records

## Prescription Methodology

The prescription flow follows a controlled sequence:

1. Pharmacy verifies a prescription first.
2. The verified prescription appears in the doctor prescription selector.
3. The doctor creates a prescription-type record for the patient.
4. The record stores the verified prescription reference in the payload.

This ensures that doctors are referencing a verified prescription source instead of typing arbitrary medication data manually.

## Testing Methodology

Testing was done by checking the app in small steps after each change:

- verify role redirects
- verify registration and login
- verify dropdown population
- verify copy buttons and dashboard state
- verify pharmacy history and regulator directory
- run lint checks to catch UI and TypeScript issues early

This helped isolate problems quickly, especially around authentication state and dashboard loading.

## Presentation Summary

If you are describing the project in a presentation, the short methodology summary is:

> MedLedger was built using a layered healthcare architecture. Blockchain is used for identity, consent, and audit, PostgreSQL is used for application storage and records, and Next.js provides the user dashboards. The system was developed incrementally by role, then verified through testing and UI refinement.

## Key Outcome

The final result is a multi-role healthcare platform with:

- blockchain-backed trust
- secure app login
- role-specific dashboards
- searchable regulator oversight
- pharmacy verification history
- prescription-aware doctor workflows


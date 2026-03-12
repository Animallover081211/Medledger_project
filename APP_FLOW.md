# MedLedger - How It Works

## Technology Stack

- **Blockchain**: Hyperledger Fabric - stores identities, consent records, and audit logs
- **Backend**: Next.js API routes - communicates between web app and Fabric network
- **Database**: SQLite (local) - stores medical records off-chain
- **Frontend**: Next.js with React - web interface for patients and doctors
- **Authentication**: Header-based (x-user-id, x-user-role) with localStorage

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐     ┌───────────────┐
│  Frontend   │────▶│  Next.js    │────▶│ Hyperledger     │────▶│  Blockchain   │
│  (React)    │     │  API        │     │  Fabric         │     │  (Ledger)    │
└─────────────┘     └─────────────┘     └─────────────────┘     └───────────────┘
                          │
                          ▼
                    ┌───────────┐
                    │ SQLite DB │
                    │ (Records) │
                    └───────────┘
```

## How Data Flows

1. User registers → identity stored on Fabric blockchain
2. Patient grants consent → consent record stored on Fabric
3. Doctor requests access → Fabric checks consent, returns approval/denial
4. Record created → stored in SQLite, access controlled by Fabric
5. Every action → logged to Fabric audit trail (immutable)

## User Flow

1. **Register** → Choose role (patient/doctor), enter ID and name
2. **Login** → Automatic via localStorage (no password needed)
3. **Patient** → Grant/revoke consent, view audit logs
4. **Doctor** → Request access, emergency access, create/view records

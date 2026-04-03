# MedLedger - How It Works

## Technology Stack

- **Blockchain**: Hyperledger Fabric - stores identities, consent records, and audit logs
- **Backend**: Next.js API routes - communicates between web app and Fabric network
- **Database**: PostgreSQL - stores medical records off-chain
- **Frontend**: Next.js with React - web interface for patients and doctors
- **Authentication**: JWT-based with Bearer tokens (HS256, 7-day expiration)

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐     ┌───────────────┐
│  Frontend   │────▶│  Next.js    │────▶│ Hyperledger     │────▶│  Blockchain   │
│  (React)    │     │  API        │     │  Fabric         │     │  (Ledger)    │
└─────────────┘     └─────────────┘     └─────────────────┘     └───────────────┘
                          │
                          ▼
                    ┌───────────┐
                    │ PostgreSQL│
                    │ (Records) │
                    └───────────┘
```

## How Data Flows

1. User registers → identity stored on Fabric blockchain, JWT issued
2. User logs in → JWT issued after on-chain identity verification
3. Patient grants consent → consent record stored on Fabric
4. Doctor requests access → Fabric checks consent, returns approval/denial
5. Record created → stored in PostgreSQL, access controlled by Fabric
6. Every action → logged to Fabric audit trail (immutable)

## User Flow

1. **Register** → Choose role (patient/doctor), enter ID and name → JWT issued
2. **Login** → Enter ID → JWT issued after identity verification
3. **Patient** → Grant/revoke consent, view audit logs
4. **Doctor** → Request access, emergency access, create/view records

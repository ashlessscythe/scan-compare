# Scan Compare / Label Verification

This repository contains two applications:

| Directory | Description |
|-----------|-------------|
| [`legacy/anvil/`](legacy/anvil/) | Original Anvil.works Python app (reference only) |
| [`label-verification/`](label-verification/) | New Next.js fullstack rebuild |

## Label Verification (Next.js)

Tesla Scan Verification — warehouse pallet label scanning app rebuilt with:

- **Next.js 15** + TypeScript
- **PostgreSQL** + Prisma
- **Auth.js** (email/password)
- **shadcn/ui**
- Enterprise shipment locking (one operator per in-progress shipment)
- Admin panel for users, PIN, and email settings

See [`label-verification/README.md`](label-verification/README.md) for setup instructions.

## Git Workflow

- **`dev`** — active development branch for the Next.js app
- **`public`** — production release (merge from `dev` when ready)

## Legacy Anvil App

The original app lived at the repo root and is preserved under `legacy/anvil/` for reference. It was deployed at `https://wry-accurate-sample.anvil.app/`.

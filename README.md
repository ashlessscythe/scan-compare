# Scan Compare / Label Verification

This repository contains two applications:

| Directory | Description |
|-----------|-------------|
| [`legacy/anvil/`](legacy/anvil/) | Original Anvil.works Python app (reference only) |
| [`label-verification/`](label-verification/) | New Next.js fullstack rebuild |

## Label Verification (Next.js)

**Scan Compare** — warehouse pallet label scanning and verification for operators on phone or desktop. Built with:

- **Next.js 16** + React 19 + TypeScript
- **PostgreSQL** + Prisma
- **Auth.js** (email/password)
- **shadcn/ui**

Highlights:

- Multi-site tenancy with least-privilege RBAC (`PENDING` → `OPERATOR` → `SITE_ADMIN` / `SUPERADMIN`)
- Mobile-first scan UI designed for controlled warehouse floors
- Authenticated access only — pending approval before operators can scan
- Docker / standalone deploy (Koyeb-ready), or customer-managed Postgres

See [`label-verification/README.md`](label-verification/README.md) for setup, features, and security notes for IT.

## Git Workflow

- **`dev`** — active development branch for the Next.js app
- **`public`** — production release (merge from `dev` when ready)

## Legacy Anvil App

The original app lived at the repo root and is preserved under `legacy/anvil/` for reference. It was deployed at `https://wry-accurate-sample.anvil.app/`.

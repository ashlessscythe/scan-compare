# Tesla Scan Verification

Next.js fullstack label verification app for Tesla/Aptiv warehouse pallet scanning.

## Prerequisites

- Node.js 20+
- PostgreSQL (Neon recommended, or local via Docker)

## Quick Start (Local)

### 1. Start PostgreSQL (optional — if not using Neon)

```bash
docker compose up -d
```

### 2. Configure environment

```bash
cp .env.example .env
```

For local Docker Postgres, uncomment the local `DATABASE_URL` / `DIRECT_URL` lines in `.env`:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/label_verification
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/label_verification
AUTH_SECRET=$(openssl rand -base64 32)
AUTH_URL=http://localhost:3000
```

For **Neon**, use the pooled URL for `DATABASE_URL` and direct URL for `DIRECT_URL`.

### 3. Install & migrate

```bash
npm install
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Seed Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `Admin123!` |
| Operator | `operator@example.com` | `Operator123!` |

Default admin override PIN: **3333** (configurable in Admin → Settings)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run test` | Run unit tests (barcode validation) |
| `npx prisma studio` | Open database GUI |
| `npx prisma db seed` | Re-seed database |

## Deployment (Vercel / Koyeb / Render)

1. Merge `dev` → `public` when ready
2. Connect repo to hosting platform, set root directory to `label-verification`
3. Set environment variables from `.env.example`:
   - `AUTH_SECRET`, `AUTH_URL`
   - `DATABASE_URL` (Neon pooled)
   - `DIRECT_URL` (Neon direct — for migrations)
   - `RESEND_API_KEY`
4. **Koyeb:** set build method to **Dockerfile** (auto-detected). No custom build/run command needed.
5. **Vercel / buildpack hosts:** build command: `prisma generate && prisma migrate deploy && next build`

### Local Docker

```bash
docker build -t label-verification .
docker run --env-file .env -p 3000:3000 label-verification
```

## Features

- **Scan workflow**: Small QR (original + portal) → 4 large QR labels (A–D)
- **Duplicate detection** with admin PIN override
- **Shipment locking**: Only one operator per in-progress shipment
- **PDF report** download and email
- **Admin panel**: User management, PIN, email CC list, force-release locks

## Project Structure

```
src/
├── app/
│   ├── api/          # REST API routes
│   ├── admin/        # Admin panel
│   ├── login/        # Login page
│   └── scan/         # Main scanning UI
├── components/       # UI components
├── hooks/            # React hooks (lock heartbeat)
└── lib/              # Business logic (barcode, locks, PDF, email)
prisma/
├── schema.prisma
└── seed.ts
```

# Tesla Scan Verification (Scan Compare)

Scan Compare is a Next.js fullstack label verification app for warehouse pallet scanning. Operators check shipment labels on phone or desktop before freight leaves the dock — designed for controlled warehouse environments with authenticated, least-privilege access.

## Mobile-first

The UI is built for handheld use on the floor, not a shrunk desktop layout:

- Responsive layout with touch-sized controls and sticky header / sandwich nav on small screens
- Site switcher and theme controls reachable from the mobile chrome
- `ResponsiveTable` for admin lists that stay usable on narrow viewports
- Themes: Light, Dark, Corporate, Neon, Cyberpunk

| Landing | Scan | Admin |
|:-------:|:----:|:-----:|
| ![Mobile landing](docs/screenshots/mobile-landing.png) | ![Mobile scan](docs/screenshots/mobile-scan.png) | ![Mobile admin](docs/screenshots/mobile-admin.png) |

## What’s included

- **Scan workflow**: Small QR (original + portal) → 4 large QR labels (A–D); session start / cancel
- **Duplicate detection** with admin PIN override
- **Shipment locking**: one operator per in-progress shipment; operators cannot reopen completed shipments; admin reset with confirmation
- **Shipments**: read-only detail view; PDF report download and optional email
- **Multi-site tenancy**: roles `PENDING` / `OPERATOR` / `SITE_ADMIN` / `SUPERADMIN`; site switcher; Sites admin CRUD
- **Corporate landing** and themed UI for operators and admins
- **Docker / standalone** deploy (Koyeb-ready Dockerfile)

## Security & IT confidence

Built for environments where IT needs clear ownership of auth, roles, and data location — without overclaiming compliance badges the app does not provide.

- **Auth**: Auth.js email/password sessions. Passwords and the admin override PIN are hashed with bcrypt (cost 12).
- **Access control**: Role-based access with `PENDING` approval before a user can operate or administer. Operators and site admins are site-scoped; superadmins can work across sites.
- **Admin controls**: Disable users, reset credentials, manage settings (PIN, email CC), and force-release shipment locks.
- **Containers**: Docker image runs as non-root (`nextjs`); `NEXT_TELEMETRY_DISABLED=1` in the image. The app does not embed third-party product analytics SDKs.
- **Data you control**: Point `DATABASE_URL` / `DIRECT_URL` at customer-managed Postgres (e.g. Docker Compose) or a managed provider with TLS (`sslmode=require` as in `.env.example`). Resend is optional and only used when email is configured.
- **CI**: lint, typecheck, and unit tests run on `dev`.

Not claimed: SSO/MFA, SOC 2 / HIPAA certifications, encryption-at-rest beyond what your database provider supplies, or air-gapped operation under default Neon/SaaS hosting.

## Prerequisites

- Node.js 20+
- PostgreSQL (Neon recommended, or local via Docker / system install)

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
| `npm run test` | Run unit tests |
| `npm run ci` | Lint + typecheck + tests |
| `npx prisma studio` | Open database GUI |
| `npx prisma db seed` | Re-seed database |

## Deployment (Vercel / Koyeb / Render)

1. Merge `dev` → `public` when ready
2. Connect repo to hosting platform, set root directory to `label-verification`
3. Set environment variables from `.env.example`:
   - `AUTH_SECRET`, `AUTH_URL`
   - `DATABASE_URL` (Neon pooled)
   - `DIRECT_URL` (Neon direct — for migrations)
   - `RESEND_API_KEY` (optional, for email)
4. **Koyeb:** set build method to **Dockerfile** (auto-detected). No custom build/run command needed.
5. **Vercel / buildpack hosts:** build command: `prisma generate && prisma migrate deploy && next build`

### Local Docker

```bash
docker build -t label-verification .
docker run --env-file .env -p 3000:3000 label-verification
```

## Project Structure

```
src/
├── app/
│   ├── api/          # REST API routes (auth, scans, shipments, sites, admin)
│   ├── admin/        # Admin panel
│   ├── login/        # Login
│   ├── register/     # Self-registration → PENDING
│   ├── pending/      # Awaiting approval
│   ├── scan/         # Main scanning UI
│   └── shipments/    # Shipment detail (read-only)
├── components/       # UI (landing, scan, responsive table, themes)
├── hooks/            # React hooks (lock heartbeat)
└── lib/              # Business logic (barcode, roles, locks, PDF, email)
prisma/
├── schema.prisma
├── migrations/
└── seed.ts
docs/
└── screenshots/      # Mobile viewport captures for docs
```

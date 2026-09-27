# MerrageHall 💍

A full-stack **marriage hall booking SaaS** — venues get a booking website with menus, per-plate
packages, add-ons, payments and calendars; couples discover and book venues with transparent pricing.
Built with **Next.js 15 (App Router)**, **Drizzle ORM** and **PostgreSQL (Supabase)**.

## Roles

| Role | What they can do |
|---|---|
| **SaaS Owner** (`SUPER_ADMIN`) | Platform KPIs (MRR, GMV, commission), approve/suspend venues, manage plans & subscriptions, full payment ledger, platform settings |
| **Hall Owner** (`HALL_OWNER`) | Venue dashboard: bookings CRUD, calendar, menu items & per-plate packages, add-ons, staff accounts, venue profile, subdomain + custom domain, subscription & invoices |
| **Hall Staff** (`HALL_STAFF`) | Day-to-day operations: bookings, calendar, menu & add-ons |
| **Booking Client** (`CUSTOMER`) | Browse venues, live price estimates, request bookings, track & cancel, pay advances |

## Demo accounts (seeded)

| Role | Email | Password |
|---|---|---|
| SaaS Owner | `admin@merragehall.com` | `Admin@123` |
| Hall Owner | `vikram@rajwada.in` | `Owner@123` |
| Hall Staff | `arjun@rajwada.in` | `Staff@123` |
| Booking Client | `priya.k@gmail.com` | `Client@123` |

Other venue owners (`meera@emeraldlawns.in`, `anil@shagunpalace.in`, `lakshmi@kalyanimahal.in`,
`farhan@amaragardens.in`, `zoya@noorbanquets.in`) all use `Owner@123`.

## Feature map

- **SaaS management** — plans (CRUD), subscriptions, monthly invoices, commission ledger, platform settings
- **Bookings** — full CRUD, slot-wise availability (Lunch / Dinner / Full Day), advances & balances,
  payment records, status flow (Pending → Confirmed → Completed / Cancelled), printable invoices
- **Extra assets (add-ons)** — categorized catalog (décor, lighting, sound, stage, furniture,
  photography, vehicle, entertainment) with quantities per booking
- **Food / starters / items / per-plate** — dish-level menu with courses & diet types, bundled into
  per-plate packages (Silver/Golden/Shahi…), live catering math everywhere
- **Custom & sub domains** — free `slug.merragehall.app` subdomain for every venue (middleware-driven),
  custom domain connect + DNS verify on Growth/Premium plans
- **Auth** — email/password with bcrypt hashing, DB-backed sessions (httpOnly cookies), role-based
  dashboards & guards (middleware + server-side checks)
- **Polished UI** — light theme (royal blue + champagne gold + soft white), empty states, loading skeletons, optimistic
  updates, toasts, responsive layout with mobile drawer navigation

## Tech stack

- **Next.js 15** (App Router, Server Components, Server Actions) + **React 19** + TypeScript
- **Drizzle ORM** + **PostgreSQL** — the schema, seed and queries are written for **Supabase Postgres**
- **Tailwind CSS v4** with a custom royal-blue/champagne design system
- **bcryptjs**, custom session auth, lucide-react icons, fontsource fonts (self-hosted)

## Run locally (zero-config preview)

```bash
npm install
npm run dev
```

The dev orchestrator boots an **embedded PostgreSQL 18** (same SQL dialect & wire protocol as
Supabase) on `127.0.0.1:54329`, pushes the Drizzle schema, seeds demo data when empty, then starts
Next.js on <http://localhost:3000>. No Docker or setup needed.

Other scripts:

```bash
npm run db:studio   # Drizzle Studio — browse the data
npm run db:push     # sync schema to DATABASE_URL
npm run db:seed     # seed demo data (skips if already seeded; FORCE_SEED=1 to wipe & reseed)
```

## Use Supabase as the backend (production)

See **[SUPABASE.md](SUPABASE.md)** for the full guide. Short version:

```bash
export DATABASE_URL="postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:6543/postgres"
npm run db:push && npm run db:seed
```

## Deploy with Docker (Coolify, self-hosted, any PaaS)

The repo ships a multi-stage `Dockerfile` that builds the Next.js
**standalone** server into a ~150 MB Alpine image. The container is stateless —
it needs only a reachable PostgreSQL (Supabase recommended):

```bash
docker build -t merragehall .
docker run -p 3000:3000 -e DATABASE_URL="postgresql://…" merragehall
```

**Coolify:** set one environment variable and deploy:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Supabase pooler URI (port `6543`) — the only credential the app needs |

That's it — **the container creates the schema and seeds the demo data automatically on its first boot** (it detects an empty database and runs `supabase/master-setup.sql`). Opt out with `SKIP_DB_SETUP=1`. Notes:

- The bootstrap also reads a `.env` file mounted next to `server.js`, if you prefer that over environment variables (real env vars always win).
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are **not needed** — they're for the Supabase SDK, and this app talks to Postgres directly.
- If Coolify serves the app over **plain HTTP** (e.g. on `localhost`), also set `ALLOW_INSECURE_COOKIES=true` — otherwise the browser drops the login cookie (it is marked `Secure` in production by default).
- Connection problems print a human-readable diagnosis in the container logs, and `/api/health` shows the DB status from the browser.

**Full stack locally with Docker** (app + PostgreSQL, no Supabase needed):

```bash
docker compose up -d --build                     # build image, start app + db
docker compose --profile setup run --rm setup    # one-time: schema + demo seed
open http://localhost:3000
```

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | **yes** | — | Postgres/Supabase connection string (pooler recommended) |
| `NEXT_PUBLIC_ROOT_DOMAIN` | no | `merragehall.app` | Your app's public domain — set it to whatever host the site is served from (e.g. `marriagehall.digitalcomrade.in`); otherwise the multi-tenant middleware treats that host as a *venue's* custom domain. Read at **runtime** — no rebuild needed. Venue subdomains become `slug.<this-domain>` |
| `ALLOW_INSECURE_COOKIES` | no | `false` | `true` only for plain-HTTP deployments |

Optional env vars:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres/Supabase connection string |
| `NEXT_PUBLIC_ROOT_DOMAIN` | Root domain for venue subdomains (default `merragehall.app`) |

## Multi-tenancy routing

- `merragehall.app/halls/<slug>` — canonical venue page
- `<slug>.merragehall.app` — middleware rewrites to the same page (real subdomain support)
- `bookings.yourvenue.com` — custom domains are rewritten to a resolver that maps the host to a venue
- In the sandbox preview, path-based `/halls/<slug>` is always available

## Project structure

```
app/            # routes — (site) public marketing/marketplace, /dashboard role-based, /login, /register
components/     # ui/ primitives, layout/ shells, public/ venue pages, dashboard/ managers
lib/            # db.ts (drizzle), schema.ts, auth.ts, queries.ts, actions/ (server actions), pricing.ts
prisma → lib/   # schema lives in lib/schema.ts (Drizzle)
scripts/        # dev.mjs (embedded Postgres + next dev), seed.ts
supabase/       # config.toml for supabase CLI workflows
```

## Seeded demo world

6 venues across India (Rajwada Grand Palace Jaipur, The Emerald Lawns Hyderabad, Shagun Palace
Lucknow, Kalyani Mahal Chennai, Amara Gardens Bengaluru, Noor Banquets Pune) — with owners, staff,
20-dish menus, 3–4 packages each, 6–8 add-ons each, 30 bookings spread over ±6 months (completed,
confirmed, pending & cancelled), payments, subscription invoices and platform commission entries.

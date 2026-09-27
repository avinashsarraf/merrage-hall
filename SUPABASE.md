# Running MerrageHall on Supabase

The entire data layer is **Drizzle ORM over standard PostgreSQL** — exactly what
Supabase runs. No Supabase-specific SDK is required: you point the app at your
project's Postgres connection string and everything works.

## 1 · Create the project

1. Go to [supabase.com](https://supabase.com) → **New project** (free tier is fine).
2. Choose a region close to your users and set a strong database password.
3. Wait for provisioning (~2 min).

## 2 · Get the connection string

In the Supabase dashboard: **Project Settings → Database → Connection string → URI**.

Two options:

| Connection | Port | Use it for |
|---|---|---|
| **Transaction pooler** (recommended) | `6543` | Serverless / containers — many short-lived connections |
| Direct connection | `5432` | Long-running servers, migrations via Studio |

Both look like:

```
postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```

The app's driver is configured with `prepare: false` (simple query protocol),
which is required for the pgBouncer pooler — so the pooler string is safe
everywhere.

## 3 · Create the schema + seed demo data

### Option A — SQL Editor, no Node required (easiest)

A single self-contained file with the schema **and** all demo data:

1. Open **supabase/master-setup.sql** from this repo (86 KB).
2. In the Supabase dashboard: **SQL Editor → New query**.
3. Paste the entire file → **Run**.

Done — tables, enums, indexes, 6 venues, 16 users, 30 bookings, payments and
subscriptions are created. The file is safe to re-run (existing objects are
skipped, data is re-seeded).

> Regenerate the file any time after changing the schema or seed:
> `npx drizzle-kit generate && node scripts/export-sql.mjs`

### Option B — from a checkout with Node 20+

```bash
npm install

export DATABASE_URL="postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:6543/postgres"

npm run db:push     # creates all tables, enums, indexes & FKs
npm run db:seed     # demo venues, users, bookings (skips if data exists)
```

> `db:seed` is idempotent — it only seeds when the database is empty.
> Set `FORCE_SEED=1` to wipe and reseed (⚠️ deletes all data).

You now have 6 demo venues, 19 users and 30 bookings in Supabase.
Verify in **Supabase Studio → Table Editor → halls**.

## 4 · Run the app against Supabase

### Docker (Coolify / any host)

```bash
docker build -t merragehall .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:6543/postgres" \
  merragehall
```

In **Coolify**: set `DATABASE_URL` in the application's *Environment Variables*,
then deploy. If the site is served over plain HTTP (e.g. `http://localhost:…`),
also set `ALLOW_INSECURE_COOKIES=true` or login cookies will be dropped by the
browser.

### Any Node 20+ host

```bash
npm ci
npm run build
DATABASE_URL="…" npm start     # next start
```

## 5 · Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | **yes** | — | Supabase Postgres connection string (pooler recommended) |
| `NEXT_PUBLIC_ROOT_DOMAIN` | no | `merragehall.app` | **Set this to your app's public domain** (e.g. `marriagehall.example.com`). Read at runtime — no rebuild needed. Venue subdomains become `slug.<domain>`; any other host is treated as a venue's custom domain |
| `ALLOW_INSECURE_COOKIES` | no | `false` | Set `true` only when serving over plain HTTP without TLS |

## 6 · Demo accounts (created by the seed)

| Role | Email | Password |
|---|---|---|
| SaaS Owner | `admin@merragehall.com` | `Admin@123` |
| Hall Owner | `vikram@rajwada.in` | `Owner@123` |
| Hall Staff | `arjun@rajwada.in` | `Staff@123` |
| Booking Client | `priya.k@gmail.com` | `Client@123` |

**Change these before going live** (or seed a fresh DB and register real users).

## 7 · Schema management

- The schema lives in [`lib/schema.ts`](lib/schema.ts) (Drizzle).
- Apply changes: edit `lib/schema.ts` → `npm run db:push`.
- Generate SQL migrations for review (`supabase/config.toml` is included for
  `supabase link` workflows):

  ```bash
  npx drizzle-kit generate   # writes ./drizzle/*.sql
  ```

- Browse data: `npm run db:studio` (connects to the same `DATABASE_URL`) or use
  Supabase Studio.

## 8 · Notes & limits

- **Row Level Security** is not used — the app enforces authorization in
  server actions / server components. If you expose the Supabase REST API
  publicly, add RLS policies; the app itself never uses the anon key.
- Supabase pauses free-tier projects after ~1 week of inactivity; the first
  request afterwards may take a few seconds while it resumes.
- `platform_settings`, `plans` and all demo rows are ordinary rows — editable
  from the admin dashboard.

/**
 * scripts/export-sql.mjs
 *
 * Builds supabase/master-setup.sql — a single, self-contained SQL file that
 * recreates the entire MerrageHall database (schema + demo data) on any
 * PostgreSQL 14+ instance, including a fresh Supabase project via the
 * SQL Editor.
 *
 * Usage:  node scripts/export-sql.mjs        (requires the local dev DB
 *         from `npm run dev` to be running and seeded)
 *
 * The file is safe to re-run: schema statements are idempotent and data
 * statements start with TRUNCATE … CASCADE.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import postgres from "postgres";

const CONNECTION =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54329/merrage";

const sql = postgres(CONNECTION, { prepare: false });

/* ── 1) schema DDL (from the newest drizzle migration) ─────────────────── */
const drizzleDir = "drizzle";
const migrationFiles = readdirSync(drizzleDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();
if (migrationFiles.length === 0) throw new Error("run `npx drizzle-kit generate` first");

let schema = migrationFiles
  .map((f) => readFileSync(`${drizzleDir}/${f}`, "utf8"))
  .join("\n")
  .replace(/--> statement-breakpoint/g, "");

// make idempotent for re-runs
schema = schema
  .replace(/^CREATE TABLE (?! IF NOT EXISTS)/gm, "CREATE TABLE IF NOT EXISTS ")
  .replace(/^CREATE INDEX (?! IF NOT EXISTS)/gm, "CREATE INDEX IF NOT EXISTS ");

// enums → DO blocks that tolerate existing types
schema = schema.replace(/^CREATE TYPE ((?:"[^"]+"\.)?"[^"]+") AS ENUM(\([^;]+\));/gm, (_m, name, vals) => {
  return `DO $$ BEGIN\n  CREATE TYPE ${name} AS ENUM${vals};\nEXCEPTION WHEN duplicate_object THEN NULL;\nEND $$;`;
});

// FK constraints → DO blocks that tolerate existing constraints
schema = schema.replace(
  /^ALTER TABLE ("[^"]+") ADD CONSTRAINT ("[^"]+")( FOREIGN KEY[^;]+);/gm,
  (_m, table, constraint, rest) =>
    `DO $$ BEGIN\n  ALTER TABLE ${table} ADD CONSTRAINT ${constraint}${rest};\nEXCEPTION WHEN duplicate_object THEN NULL;\nEND $$;`,
);

/* ── 2) data export ─────────────────────────────────────────────────────── */
const TABLES = [
  "plans",
  "users", // hall_id emitted as NULL here, restored below (circular FK with halls)
  "halls",
  "subscriptions",
  "addons",
  "menu_items",
  "menu_packages",
  "bookings",
  "payments",
  "platform_settings",
];

const lit = (v) => (v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);

async function dumpTable(table) {
  const cols = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = ${table}
    order by ordinal_position`;
  const names = cols.map((c) => c.column_name);
  // cast every column to text so values round-trip as SQL string literals;
  // PostgreSQL coerces untyped literals back to the column types on INSERT.
  const selectList = names.map((n) => `"${n}"::text as "${n}"`).join(", ");
  const rows = await sql.unsafe(`select ${selectList} from "${table}"`);
  if (rows.length === 0) return `-- (no rows in ${table})`;

  // users.hall_id ↔ halls.owner_id is a circular FK — insert users with
  // hall_id NULL and restore the staff assignments via UPDATE at the end.
  const nullColumns = table === "users" ? ["hall_id"] : [];

  const lines = [`INSERT INTO "${table}" (${names.map((n) => `"${n}"`).join(", ")}) VALUES`];
  const batches = [];
  for (let i = 0; i < rows.length; i += 50) {
    batches.push(
      rows
        .slice(i, i + 50)
        .map((r) => `  (${names.map((n) => (nullColumns.includes(n) ? "NULL" : lit(r[n]))).join(", ")})`)
        .join(",\n"),
    );
  }
  lines.push(batches.join(",\n") + ";");
  return lines.join("\n");
}

const sections = [];
for (const t of TABLES) {
  process.stdout.write(`  ${t}… `);
  sections.push(`-- ── ${t} ─────────────────────────────────────────────\n${await dumpTable(t)}`);
  process.stdout.write("ok\n");
}

// restore staff ↔ hall assignments (users.hall_id ↔ halls.owner_id circular FK)
const staff = await sql`select id, hall_id from users where hall_id is not null`;
const updates = staff.map((s) => `UPDATE "users" SET hall_id = ${lit(s.hall_id)} WHERE id = ${lit(s.id)};`).join("\n");

/* ── 3) assemble ────────────────────────────────────────────────────────── */
const counts = {};
for (const t of TABLES) counts[t] = (await sql.unsafe(`select count(*)::int as n from "${t}"`))[0].n;

const header = `-- ═══════════════════════════════════════════════════════════════════════════
-- MerrageHall — master setup (schema + demo data)
--
-- Recreates the complete MerrageHall database on any PostgreSQL 14+
-- instance. Designed for a FRESH Supabase project:
--
--   Supabase Dashboard → SQL Editor → New query → paste this file → Run
--
-- Safe to re-run: existing objects are kept (IF NOT EXISTS) and data
-- sections start with TRUNCATE … CASCADE.
--
-- Demo logins:
--   admin@merragehall.com / Admin@123        (SaaS owner)
--   vikram@rajwada.in    / Owner@123         (hall owner)
--   arjun@rajwada.in     / Staff@123         (hall staff)
--   priya.k@gmail.com    / Client@123        (booking client)
--
-- Generated ${new Date().toISOString()} · ${TABLES.map((t) => `${t}: ${counts[t]}`).join(", ")}
-- ═══════════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════ PART 1: SCHEMA
${schema}

-- ═════════════════════════════════════════════════════════════ PART 2: DATA
TRUNCATE "payments", "bookings", "menu_packages", "menu_items", "addons",
         "subscriptions", "sessions", "halls", "users", "plans",
         "platform_settings" RESTART IDENTITY CASCADE;

${sections.join("\n\n")}

-- restore staff → hall assignments (circular FK with halls.owner_id)
${updates || "-- (no staff assignments)"}

COMMIT;

-- ══════════════════════════════════════════════════════════ VERIFICATION
-- row counts after import (should match the numbers in the header):
--   select 'plans' t, count(*) from plans union all
--   select 'users', count(*) from users union all
--   select 'halls', count(*) from halls union all
--   select 'bookings', count(*) from bookings union all
--   select 'payments', count(*) from payments;
`;

writeFileSync("supabase/master-setup.sql", header);
console.log(`\n✓ wrote supabase/master-setup.sql (${(header.length / 1024).toFixed(1)} KB)`);
await sql.end();

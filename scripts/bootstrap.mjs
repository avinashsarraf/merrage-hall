/**
 * Production bootstrap — the single entry point of the Docker image.
 *
 *   1. Loads ./.env if present (real environment variables always win)
 *   2. Connects to DATABASE_URL and, on an empty database, creates the
 *      full schema + demo data automatically (supabase/master-setup.sql)
 *   3. On any failure, prints exactly WHAT is wrong and HOW to fix it
 *      (no cryptic stacks)
 *   4. Starts the Next.js standalone server
 *
 * Opt out of step 2 with SKIP_DB_SETUP=1.
 *
 * The only credential the app needs is DATABASE_URL — the Postgres
 * connection string from Supabase → Project Settings → Database →
 * Connection string (Transaction pooler recommended):
 *
 *   DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres"
 *
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are for
 * the Supabase SDK, which this app does not use — they are not needed.
 */
import { existsSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";

/* ── 1) .env support ─────────────────────────────────────────────────────── */
export function loadEnvFile(path = ".env") {
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = value; // real env wins
  }
}
loadEnvFile();

const log = (s = "") => console.log(s);

function describeTarget(url) {
  try {
    const u = new URL(url);
    return `${u.hostname}:${u.port || "5432"}${u.pathname}`;
  } catch {
    return "(could not parse DATABASE_URL)";
  }
}

function diagnose(e) {
  const msg = String(e?.message ?? e);
  if (/timeout|ETIMEDOUT|Connection timed out/i.test(msg)) {
    return [
      "The database address is not reachable.",
      "",
      "→ If this is Supabase: use the TRANSACTION POOLER connection string",
      "  (host like aws-0-<region>.pooler.supabase.com, port 6543) — NOT the",
      "  direct connection (db.<ref>.supabase.co, port 5432), which is",
      "  IPv6-only and unreachable from most Docker hosts.",
      "",
      "  Supabase Dashboard → Project Settings → Database → Connection string",
      "  → select the 'Transaction pooler' tab → copy the URI.",
    ].join("\n");
  }
  if (/password authentication failed/i.test(msg)) {
    return [
      "The database rejected the password.",
      "",
      "→ Check the password, and if it contains special characters",
      "  (@ # ? / space …) they must be URL-encoded inside the connection",
      "  string: @ → %40, # → %23, ? → %3F, / → %2F.",
    ].join("\n");
  }
  if (/ENOTFOUND|getaddrinfo/i.test(msg)) {
    return [
      "The database hostname could not be resolved.",
      "",
      "→ Copy the connection string exactly from Supabase — check for typos",
      "  in the region part of the host (e.g. aws-0-ap-south-1).",
    ].join("\n");
  }
  if (/ECONNREFUSED/i.test(msg)) {
    return [
      "The port refused the connection.",
      "",
      "→ Check the port: 6543 for Supabase's transaction pooler,",
      "  5432 for direct connections.",
    ].join("\n");
  }
  if (/database .* does not exist/i.test(msg)) {
    return [
      "The database named in the connection string does not exist.",
      "",
      "→ For Supabase it should end with /postgres.",
    ].join("\n");
  }
  return msg;
}

async function setupDatabase() {
  const { default: postgres } = await import("postgres");
  const url = process.env.DATABASE_URL;
  // TLS for remote hosts (Supabase requires it), plain for local ones
  let ssl;
  try {
    const u = new URL(url);
    if (!u.searchParams.has("sslmode") && !u.searchParams.has("ssl")) {
      const h = u.hostname;
      const local =
        ["localhost", "127.0.0.1", "::1", "host.docker.internal"].includes(h) ||
        /^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h);
      ssl = local ? undefined : true;
    }
  } catch {
    /* fall through without ssl */
  }

  const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 10, idle_timeout: 5, ssl });
  try {
    const rows = await sql`select to_regclass('public.halls') is not null as exists`;
    if (rows[0]?.exists) {
      log("✓ Database ready (schema found)");
    } else {
      log("→ Empty database detected — creating schema + demo data…");
      const candidates = ["master-setup.sql", "supabase/master-setup.sql"];
      const file = candidates.find((c) => existsSync(c));
      if (!file) throw new Error("master-setup.sql not found in the image");
      await sql.unsafe(readFileSync(file, "utf8"));
      log("✓ Database created: schema + demo data seeded");
      log("  (3 plans · 6 venues · 16 users · 30 bookings — admin@merragehall.com / Admin@123)");
    }
  } finally {
    try {
      await sql.end({ timeout: 3 });
    } catch {}
  }
}

async function main() {
  log();
  log("  MerrageHall — starting");

  if (!process.env.DATABASE_URL) {
    log("  ⚠ DATABASE_URL is not set — database pages will error until it is.");
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      log();
      log("  You set NEXT_PUBLIC_SUPABASE_URL — that is the Supabase SDK URL,");
      log("  which this app does not use. What it needs is the DATABASE");
      log("  connection string:");
      log();
      log("    Supabase → Project Settings → Database → Connection string →");
      log("    Transaction pooler → copy URI, put it in DATABASE_URL");
    }
  } else if (process.env.SKIP_DB_SETUP === "1") {
    log("  (SKIP_DB_SETUP=1 — skipping database checks)");
  } else {
    log(`  Database: ${describeTarget(process.env.DATABASE_URL)}`);
    try {
      await setupDatabase();
    } catch (e) {
      log();
      log("  ✗ Could not prepare the database:");
      log("  ┌──────────────────────────────────────────────────────────────");
      diagnose(e)
        .split("\n")
        .forEach((l) => log(`  │ ${l}`));
      log("  └──────────────────────────────────────────────────────────────");
      log("  Starting the server anyway — visit /api/health for details,");
      log("  and check Coolify → Environment Variables → DATABASE_URL.");
    }
  }
  log();

  const child = spawn(process.execPath, ["server.js"], { stdio: "inherit", env: process.env });
  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Dev orchestrator — powers the live preview.
 *
 * Boots a local embedded PostgreSQL (a stand-in with the same wire protocol &
 * SQL dialect as Supabase Postgres), syncs the Prisma schema, seeds demo data
 * when the database is empty, then starts the Next.js dev server.
 *
 * For production / real usage: set DATABASE_URL to your Supabase connection
 * string (Project Settings → Database → Connection string) and run
 * `npx prisma db push && npm run db:seed` — no local Postgres involved.
 */
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { execSync, spawn } from "node:child_process";
import net from "node:net";
import EmbeddedPostgres from "embedded-postgres";

const PORT = Number(process.env.PG_PORT || 54329);
const DB_NAME = "merrage";
const DATA_DIR = ".pgdata";
const LOCAL_URL = `postgresql://postgres:postgres@127.0.0.1:${PORT}/${DB_NAME}`;

function canConnect(timeoutMs = 1500) {
  return new Promise((resolve) => {
    const s = net.connect({ port: PORT, host: "127.0.0.1" }, () => {
      s.destroy();
      resolve(true);
    });
    s.on("error", () => resolve(false));
    setTimeout(() => {
      s.destroy();
      resolve(false);
    }, timeoutMs);
  });
}

function run(cmd, env) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: "inherit", env });
}

async function bootPostgres() {
  mkdirSync(DATA_DIR, { recursive: true });
  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: "postgres",
    password: "postgres",
    port: PORT,
    persistent: true,
  });
  if (!existsSync(`${DATA_DIR}/PG_VERSION`)) await pg.initialise();
  await pg.start();
  try {
    await pg.createDatabase(DB_NAME);
  } catch {
    /* already exists */
  }
  globalThis.__pg = pg; // keep the server alive for the process lifetime
}

async function main() {
  if (await canConnect()) {
    console.log("> Local PostgreSQL already running — reusing.");
  } else {
    console.log("> Starting local PostgreSQL (embedded, Supabase-compatible)…");
    await bootPostgres();
  }

  process.env.DATABASE_URL = process.env.DATABASE_URL || LOCAL_URL;

  if (!existsSync(".env")) {
    writeFileSync(
      ".env",
      `# Local preview database (embedded PostgreSQL — stand-in for Supabase)\n` +
        `# For production, replace with your Supabase connection string, e.g.\n` +
        `# DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres"\n` +
        `DATABASE_URL="${process.env.DATABASE_URL}"\n`
    );
  }

  try {
    run("npx drizzle-kit push --force", process.env);
  } catch {
    console.warn("! Schema sync failed — resetting local database and retrying…");
    rmSync(DATA_DIR, { recursive: true, force: true });
    await bootPostgres();
    run("npx drizzle-kit push --force", process.env);
  }

  run("node --experimental-strip-types scripts/seed.ts", process.env); // seeds only when empty

  console.log("> Starting Next.js dev server on http://0.0.0.0:3000 …");
  // spawn next dev — on Windows, `npx` is a .cmd and can't be spawned directly,
  // so invoke node with the concrete bin path instead.
  const nextBin = "./node_modules/next/dist/bin/next";
  const next =
    process.platform === "win32"
      ? spawn(process.execPath, [nextBin, "dev", "-H", "0.0.0.0", "-p", "3000"], {
          stdio: "inherit",
          env: process.env,
        })
      : spawn("npx", ["next", "dev", "-H", "0.0.0.0", "-p", "3000"], {
          stdio: "inherit",
          env: process.env,
        });
  next.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

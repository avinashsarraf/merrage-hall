import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * GET /api/health — human-friendly deployment diagnostic.
 *
 * Reports whether the app's DATABASE_URL is set, which host/port it points
 * at (never credentials), and whether the database responds. Safe to expose:
 * no secrets, no connection strings.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  const url = process.env.DATABASE_URL;

  // describe the target without ever exposing credentials
  let target: { set: boolean; host?: string; port?: string; database?: string } = { set: false };
  if (url) {
    try {
      const u = new URL(url);
      target = { set: true, host: u.hostname, port: u.port || "5432", database: u.pathname.replace("/", "") };
    } catch {
      target = { set: true, host: "(unparseable)" };
    }
  }

  try {
    await db.execute(sql`select 1`);
    let halls: number | null = null;
    try {
      const rows = (await db.execute(sql`select count(*)::int as n from halls`)) as unknown as { n: number }[];
      halls = rows[0]?.n ?? null;
    } catch {
      halls = null; // connected but schema missing?
    }
    return Response.json({
      ok: true,
      app: "MerrageHall",
      db: { connected: true, halls, target },
      hint: halls === null ? "Connected, but the `halls` table is missing — run supabase/master-setup.sql in the SQL Editor." : null,
      ms: Date.now() - startedAt,
    });
  } catch (e) {
    const err = e as Error & { code?: string };
    const message = String(err.message ?? err)
      .replace(/\/\/[^@/\s]+@/g, "//***@") // strip any embedded credentials
      .slice(0, 200);
    // targeted hint: the Supabase SDK URL was set instead of the DB string
    let hint: string | null = null;
    if (!url && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      hint =
        "NEXT_PUBLIC_SUPABASE_URL is set, but the app needs DATABASE_URL — the Postgres " +
        "connection string from Supabase → Project Settings → Database → Connection string " +
        "(Transaction pooler, port 6543).";
    } else if (/timeout|ETIMEDOUT/i.test(message)) {
      hint = "Database unreachable — if this is Supabase, use the Transaction pooler string (port 6543), not the direct connection (port 5432, IPv6-only).";
    } else if (/password authentication failed/i.test(message)) {
      hint = "Wrong password, or special characters in it need URL-encoding (@ → %40, # → %23).";
    }
    return Response.json({
      ok: false,
      app: "MerrageHall",
      db: { connected: false, target, code: err.code ?? null, message },
      hint,
      ms: Date.now() - startedAt,
    });
  }
}

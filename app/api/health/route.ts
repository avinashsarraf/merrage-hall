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
    return Response.json({
      ok: false,
      app: "MerrageHall",
      db: { connected: false, target, code: err.code ?? null, message },
      ms: Date.now() - startedAt,
    });
  }
}

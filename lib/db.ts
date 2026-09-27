import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.ts";

/**
 * DATABASE_URL points at Supabase Postgres in production
 * (Project Settings → Database → Connection string). Locally, scripts/dev.mjs
 * boots an embedded PostgreSQL stand-in on 127.0.0.1:54329.
 */
const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54329/merrage";

const g = globalThis as unknown as { __mhSql?: postgres.Sql };

const client =
  g.__mhSql ??
  postgres(connectionString, {
    // simple protocol — required for Supabase's pgBouncer transaction pooler
    prepare: false,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (!g.__mhSql) g.__mhSql = client;

export const db = drizzle(client, { schema });
export { schema };

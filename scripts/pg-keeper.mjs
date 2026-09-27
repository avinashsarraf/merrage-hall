/**
 * Boots only the embedded PostgreSQL cluster (no Next.js) and keeps it alive.
 * Used for testing production builds locally; `scripts/dev.mjs` is the
 * all-in-one version used during development.
 */
import net from "node:net";
import EmbeddedPostgres from "embedded-postgres";

const PORT = 54329;

function checkPort(host, port) {
  return new Promise((resolve) => {
    const s = net.connect({ host, port });
    s.once("connect", () => { s.destroy(); resolve(true); });
    s.once("error", () => resolve(false));
  });
}

// wait for any previous cluster to release the port
for (let i = 0; i < 30; i++) {
  if (!(await checkPort("127.0.0.1", PORT))) break;
  await new Promise((r) => setTimeout(r, 500));
}

const pg = new EmbeddedPostgres({
  databaseDir: ".pgdata",
  user: "postgres",
  password: "postgres",
  port: PORT,
  persistent: true,
});

try {
  await pg.createDatabase("merrage");
} catch {
  /* already exists */
}
await pg.start();
console.log(`▶ PostgreSQL keeper: cluster ready on 127.0.0.1:${PORT} (staying alive)`);

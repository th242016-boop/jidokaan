// Local disposable database. Exercise the same handlers used by the shop and admin.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const cwd = process.cwd();
const temp = await mkdtemp(resolve(tmpdir(), "jidokaan-catalog-privacy-"));
process.chdir(temp);
process.env.DATABASE_URL = "";
process.env.JIDOKAAN_LOCAL_ONLY = "1";
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => { throw new Error("Unexpected external request"); };
const server = await createServer({
  configFile: false, root, resolve: { alias: { "@": resolve(root, "src") } },
  server: { middlewareMode: true }, appType: "custom",
});
let db;
try {
  db = await server.ssrLoadModule("/src/lib/db.ts");
  assert.equal(db.dbSource, "pglite");
  const { readCatalog, writeBlacklist, writeCoupons } = await server.ssrLoadModule("/src/lib/catalog.server.ts");
  const { unlockAdmin } = await server.ssrLoadModule("/src/lib/admin-auth.server.ts");
  const get = (await server.ssrLoadModule("/src/routes/api/catalog.ts")).Route.options.server.handlers.GET;
  const request = (authorization) => get({
    request: new Request("https://shop.example.invalid/api/catalog", {
      headers: authorization ? { Authorization: authorization } : {},
    }),
  });
  await readCatalog();
  process.env.ADMIN_BOOTSTRAP_PIN = randomUUID();
  const token = await unlockAdmin(process.env.ADMIN_BOOTSTRAP_PIN);
  const catalogBefore = JSON.parse(JSON.stringify(await readCatalog()));
  const blacklist = [{ id: "sample", name: "Fixture", email: "fixture@example.invalid", reason: "fixture-only", createdAt: "2026-01-01" }];
  const coupons = [{ id: "sample", code: "fixture-only", enabled: true }];
  await writeBlacklist(token, blacklist);
  await writeCoupons(token, coupons);

  const response = await request();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control"), /no-store/i);
  const visible = await response.json();
  assert.equal("blacklist" in visible, false);
  assert.equal("coupons" in visible, false);
  assert.ok(!JSON.stringify(visible).includes("fixture-only"));
  for (const key of ["products", "categories", "company", "support", "shipping", "notice", "faqs", "seo", "pay", "hasPin"])
    assert.deepEqual(visible[key], catalogBefore[key], key);
  const admin = await request(`Bearer ${token}`);
  assert.equal(admin.status, 200);
  const full = await admin.json();
  assert.deepEqual(full.blacklist, blacklist);
  assert.deepEqual(full.coupons, coupons);
  console.log("PASS catalog preserves public product and checkout data, isolates private fields and restores saved admin lists");
} finally {
  await server.close();
  if (db) await (await db.getPglite())?.close();
  globalThis.fetch = originalFetch;
  process.chdir(cwd);
  await rm(temp, { recursive: true, force: true });
}

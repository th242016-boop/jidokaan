// Isolated authentication and asset checks. Never uses the production DB or session.
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const temp = await mkdtemp(resolve(tmpdir(), "jidokaan-special-test-"));
const oldCwd = process.cwd();
process.env.DATABASE_URL = "";
process.chdir(temp);
globalThis.fetch = async () => { throw new Error("OUTBOUND_NETWORK_BLOCKED"); };
const server = await createServer({ configFile: false, root,
  resolve: { alias: { "@": resolve(root, "src") } },
  server: { middlewareMode: true, hmr: false }, appType: "custom" });
let db;
let count = 0;
async function check(label, fn) { await fn(); count++; console.log(`PASS ${label}`); }
try {
  db = await server.ssrLoadModule("/src/lib/db.ts");
  const auth = await server.ssrLoadModule("/src/lib/admin-auth.server.ts");
  const api = await server.ssrLoadModule("/src/lib/simulator-special.server.ts");
  const special = await server.ssrLoadModule("/src/lib/simulator-special.ts");
  const sim = await server.ssrLoadModule("/src/lib/simulator-config.ts");
  const design = await server.ssrLoadModule("/src/lib/design-order.ts");
  const call = body => api.handleSpecialRequest(new Request("http://localhost/api/simulator-special", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  }));
  await check("anonymous, forged and malformed access never returns assets", async () => {
    for (const token of [undefined, "fake", "a".repeat(64)]) {
      const res = await call({ token, action: "assets", model: "high" });
      assert.equal(res.status, 401);
      assert.equal(res.headers.get("cache-control"), "no-store");
      assert.deepEqual(await res.json(), { error: "AUTH" });
    }
    assert.equal((await api.handleSpecialRequest(new Request("http://localhost/api/simulator-special"))).status, 401);
  });
  const token = await auth.createSession();
  await check("real session enables mode; no client flag grants access", async () => {
    assert.equal((await call({ token, action: "ping" })).status, 200);
    assert.equal((await call({ admin: true, action: "ping" })).status, 401);
    assert.equal((await call({ token, action: "assets", model: "../secret" })).status, 400);
  });
  await check("missing server key fails closed", async () => {
    const key = process.env.SIMULATOR_SPECIAL_ASSET_KEY;
    delete process.env.SIMULATOR_SPECIAL_ASSET_KEY;
    try { assert.equal((await call({ token, action: "assets", model: "high" })).status, 503); }
    finally { if (key) process.env.SIMULATOR_SPECIAL_ASSET_KEY = key; }
  });
  if (process.env.SIMULATOR_SPECIAL_ASSET_KEY) {
    await check("authenticated material payload has only supported model layers", async () => {
      for (const model of ["high", "mid"]) {
        const res = await call({ token, action: "assets", model });
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.deepEqual(Object.keys(body.layers), special.flowerPartsFor(model));
        for (const data of [body.swatch, ...Object.values(body.layers)]) {
          const png = Buffer.from(data.split(",")[1], "base64");
          assert.equal(png.subarray(1, 4).toString(), "PNG");
          assert.ok(!png.includes(Buffer.from("XML:com.adobe.xmp")));
        }
        if (process.env.SPECIAL_CLEAN_REFERENCE) {
          const source = await readFile(resolve(process.env.SPECIAL_CLEAN_REFERENCE, "jidokaan-flower-b.png"));
          assert.deepEqual(Buffer.from(body.layers.b.split(",")[1], "base64"), source);
        }
      }
    });
  }
  await check("floral drafts and ordinary order specifications stay separate", async () => {
    const normal = sim.defaultPartNames();
    const draft = { names: { ...normal }, flowers: {} };
    const floral = special.selectSpecial(draft, "b", "FLOWER A");
    assert.equal(floral.flowers.b, true);
    assert.deepEqual(normal, sim.defaultPartNames());
    assert.deepEqual(floral.names, normal);
    assert.deepEqual(special.specialOverrides(floral, { swatch: "swatch", layers: { b: "flower-b" } }), { b: "flower-b" });
    assert.deepEqual(special.specialOverrides(floral, null), {});
    const red = special.selectSpecial(floral, "b", "RED");
    assert.equal(red.flowers.b, false); assert.equal(red.names.b, "RED");
    assert.equal(design.completeDesign({ ...normal, b: "FLOWER A" }), null);
    assert.equal(design.completeDesign(red.names).b, "RED");
  });
  await check("logout immediately revokes asset access on the server", async () => {
    await auth.destroySession(token);
    assert.equal((await call({ token, action: "ping" })).status, 401);
    assert.equal((await call({ token, action: "assets", model: "high" })).status, 401);
  });
  await check("expired session cannot fetch materials", async () => {
    const expired = await auth.createSession();
    const sql = await db.getSql();
    await sql.query("update admin_sessions set expires_at = now() - interval '1 second'");
    assert.equal((await call({ token: expired, action: "assets", model: "high" })).status, 401);
  });
  console.log(`${count} special checks passed (temporary database only).`);
} finally {
  await server.close();
  const instance = await globalThis.__pgliteInstanceV2__;
  await instance?.close();
  process.chdir(oldCwd); await rm(temp, { recursive: true, force: true });
}

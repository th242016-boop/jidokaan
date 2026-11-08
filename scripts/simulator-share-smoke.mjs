// Isolated capability/session checks. No production DB, tokens, or images used.
import assert from "node:assert/strict";
import { createCipheriv, randomBytes } from "node:crypto";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const temp = await mkdtemp(resolve(tmpdir(), "jidokaan-share-test-"));
const oldCwd = process.cwd();
process.env.DATABASE_URL = "";
process.chdir(temp);
globalThis.fetch = async () => { throw new Error("OUTBOUND_NETWORK_BLOCKED"); };
const shareToken = randomBytes(32).toString("hex");
process.env.SIMULATOR_SPECIAL_SHARE_TOKEN = shareToken;
const assetKey = randomBytes(32);
const source = await readFile(resolve(root, "src/lib/simulator-special.server.ts"), "utf8");
for (const name of new Set(source.match(/SIMULATOR_[A-Z_0-9]+_KEY/g))) {
  process.env[name] = assetKey.toString("base64");
}
const nonce = randomBytes(12);
const cipher = createCipheriv("aes-256-gcm", assetKey, nonce);
const payload = Buffer.concat([cipher.update("isolated test material"), cipher.final()]);
const fixture = Buffer.concat([nonce, cipher.getAuthTag(), payload]).toString("base64");
const server = await createServer({
  configFile: false, root,
  resolve: { alias: { "@": resolve(root, "src") } },
  server: { middlewareMode: true, hmr: false }, appType: "custom",
  plugins: [{
    name: "isolated-encrypted-materials", enforce: "pre",
    load(id) {
      if (id.includes("/special-assets/") && id.endsWith(".enc?raw")) {
        return `export default ${JSON.stringify(fixture)};`;
      }
    },
  }],
});
let count = 0;
async function check(label, fn) { await fn(); count++; console.log(`PASS ${label}`); }
try {
  const auth = await server.ssrLoadModule("/src/lib/admin-auth.server.ts");
  const api = await server.ssrLoadModule("/src/lib/simulator-special.server.ts");
  const share = await server.ssrLoadModule("/src/lib/simulator-share.server.ts");
  const special = await server.ssrLoadModule("/src/lib/simulator-special.ts");
  const patterns = await server.ssrLoadModule("/src/lib/special-patterns.ts");
  const codec = await server.ssrLoadModule("/src/lib/pattern-asset-wire.ts");
  const orders = await server.ssrLoadModule("/src/lib/orders.server.ts");
  const members = await server.ssrLoadModule("/src/lib/members.server.ts");
  const catalog = await server.ssrLoadModule("/src/lib/catalog.server.ts");
  const call = body => api.handleSpecialRequest(new Request("https://jidokaan.com/api/simulator-special", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  }));
  await check("missing, malformed, and forged capabilities are denied", async () => {
    for (const value of [undefined, null, true, [], {}, "", "bad", "f".repeat(64), `${shareToken}0`, shareToken.toUpperCase()]) {
      assert.equal(share.isSimulatorShareToken(value), false);
      for (const action of ["ping", "assets", "share-link"]) {
        const res = await call({ action, model: "high", shareToken: value, audience: "admin", admin: true });
        assert.equal(res.status, 401);
        assert.equal(res.headers.get("cache-control"), "no-store");
        assert.deepEqual(await res.json(), { error: "AUTH" });
      }
    }
    assert.equal((await api.handleSpecialRequest(new Request("https://jidokaan.com/api/simulator-special"))).status, 401);
  });
  await check("valid link grants only shared simulator access", async () => {
    for (const audience of [undefined, "admin", "public", "shared"]) {
      const res = await call({ shareToken, audience, action: "ping" });
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), { ok: true, audience: "shared" });
    }
    assert.equal((await call({ shareToken, action: "share-link" })).status, 401);
    assert.equal((await call({ token: shareToken, action: "ping" })).status, 401);
    assert.equal((await call({ token: shareToken, action: "share-link" })).status, 401);
    await assert.rejects(auth.assertSession(shareToken), /AUTH/);
    assert.equal((await call({ shareToken, action: "assets", model: "../admin" })).status, 400);
    assert.equal((await call({ shareToken, action: "delete-order" })).status, 400);
  });
  await check("link key cannot read orders, customers, or enter catalog administration", async () => {
    await assert.rejects(orders.listOrders(shareToken), /AUTH/);
    await assert.rejects(members.listMembers(shareToken), /AUTH/);
    await assert.rejects(catalog.assertAdmin(shareToken), /AUTH/);
    await assert.rejects(auth.issueRecoveryCode(shareToken), /AUTH/);
  });
  const adminToken = await auth.createSession();
  await check("only verified admin can retrieve the fixed canonical URL", async () => {
    const res = await call({ token: adminToken, action: "share-link", host: "evil.example" });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("cache-control"), "no-store");
    const { url } = await res.json();
    assert.equal(url, `https://jidokaan.com/special#key=${shareToken}`);
    assert.equal(new URL(url).search, "");
    assert.deepEqual(await (await call({ token: adminToken, action: "ping" })).json(), { ok: true, audience: "admin" });
    assert.deepEqual(await (await call({ token: adminToken, audience: "public", action: "ping" })).json(), { ok: true, audience: "public" });
  });
  await check("shared high/mid payloads match the full studio catalog, without admin identity", async () => {
    for (const model of ["high", "mid"]) {
      const admin = await (await call({ token: adminToken, action: "assets", model })).json();
      const res = await call({ shareToken, action: "assets", model });
      assert.equal(res.status, 200);
      const shared = await res.json();
      assert.equal(shared.audience, "shared");
      assert.equal(shared.token, undefined);
      assert.equal(shared.shareToken, undefined);
      assert.equal(shared.url, undefined);
      assert.deepEqual({ ...shared, audience: "admin" }, admin);
      assert.deepEqual(Object.keys(shared.layers), special.flowerPartsFor(model));
      assert.deepEqual(Object.keys(shared.patterns).sort(), patterns.SPECIAL_PATTERNS.map(({ name }) => name).sort());
      assert.ok(shared.patterns["FLOWER D"], `${model}: the private tropical flower is available through the fixed share link`);
      const compact = await call({ shareToken, action: "assets", model, compact: true });
      assert.equal(compact.status, 200);
      const compactBody = await compact.json();
      assert.equal(compactBody.audience, "shared");
      assert.deepEqual(codec.expandPatternAssets(compactBody), shared.patterns, "shared compact delivery retains FLOWER D and every existing material");
      const ordinary = await (await call({ token: adminToken, action: "assets", audience: "public", model })).json();
      assert.equal(ordinary.patterns["FLOWER D"], undefined, "the private addition must not enter the public catalog");
    }
  });
  await check("missing or malformed server capability disables sharing but not admin", async () => {
    for (const value of [undefined, "short", "G".repeat(64)]) {
      if (value === undefined) delete process.env.SIMULATOR_SPECIAL_SHARE_TOKEN;
      else process.env.SIMULATOR_SPECIAL_SHARE_TOKEN = value;
      assert.equal(share.isSimulatorShareToken(shareToken), false);
      assert.equal(share.simulatorShareUrl(), null);
      assert.equal((await call({ shareToken, action: "ping" })).status, 401);
      assert.equal((await call({ token: adminToken, action: "share-link" })).status, 503);
      assert.equal((await call({ token: adminToken, action: "ping" })).status, 200);
    }
    process.env.SIMULATOR_SPECIAL_SHARE_TOKEN = shareToken;
  });
  await check("admin logout does not convert a link holder into an administrator", async () => {
    await auth.destroySession(adminToken);
    assert.equal((await call({ token: adminToken, action: "share-link" })).status, 401);
    assert.equal((await call({ shareToken, action: "ping" })).status, 200);
    await assert.rejects(auth.assertSession(shareToken), /AUTH/);
  });
  console.log(`${count} share checks passed (temporary database and synthetic materials only).`);
} finally {
  await server.close();
  const instance = await globalThis.__pgliteInstanceV2__;
  await instance?.close();
  process.chdir(oldCwd);
  await rm(temp, { recursive: true, force: true });
}

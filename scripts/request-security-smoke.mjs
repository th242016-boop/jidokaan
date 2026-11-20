// Local, disposable fixtures. No production database, Telegram or PayPal calls.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const temp = await mkdtemp(join(tmpdir(), "jidokaan-guard-"));
const startingDir = process.cwd();
Object.assign(process.env, {
  DATABASE_URL: "", JIDOKAAN_LOCAL_ONLY: "1", ADMIN_BOOTSTRAP_PIN: randomUUID(),
  RAILWAY_ENVIRONMENT_ID: "fixture", RAILWAY_ENVIRONMENT_NAME: "test", TELEGRAM_BOT_TOKEN: "",
  UPLOAD_DIR: join(temp, "uploads"),
});
process.chdir(temp);
const savedFetch = globalThis.fetch;
globalThis.fetch = async () => { throw new Error("unexpected network access"); };
const server = await createServer({ root, configFile: false, resolve: {
  alias: { "@": join(root, "src") },
}, server: { middlewareMode: true }, appType: "custom" });
let uploaded;
try {
  const guard = await server.ssrLoadModule("/src/lib/request-guard.server.ts");
  const peer = new Request("https://example.test", { headers: { "x-real-ip": "192.0.2.1" } });
  for (let i = 0; i < 15; i++) guard.limitRequests(peer, "createOrder");
  assert.throws(() => guard.limitRequests(peer, "createOrder"), (e) => guard.guardResponse(e)?.status === 429);
  guard.limitRequests(peer, "createPayment");
  const chunk = (s) => new TextEncoder().encode(s);
  const json = new Request("https://example.test", { method: "POST", duplex: "half",
    body: new ReadableStream({ start(c) { c.enqueue(chunk('{"a":')); c.enqueue(chunk('123}')); c.close(); } }),
  });
  await assert.rejects(guard.readBoundedJson(json, 7), (e) => guard.guardResponse(e)?.status === 413);
  console.log("PASS independent order and payment limits; chunked body limit");

  const auth = await server.ssrLoadModule("/src/lib/admin-auth.server.ts");
  const media = (await server.ssrLoadModule("/src/routes/api/media.ts")).Route.options.server.handlers;
  const sample = new FormData();
  sample.set("file", new Blob(["fixture"], { type: "image/png" }), "fixture.png");
  const anonymous = new Request("https://example.test", { method: "POST", body: sample });
  assert.equal((await media.POST({ request: anonymous })).status, 401);
  assert.equal(anonymous.bodyUsed, false);
  const token = await auth.unlockAdmin(process.env.ADMIN_BOOTSTRAP_PIN);
  const allowed = new Request("https://example.test", {
    method: "POST", headers: { Authorization: "Bearer " + token }, body: sample,
  });
  const response = await media.POST({ request: allowed });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.bytes, 7);
  uploaded = basename(data.url);
  assert.equal(await readFile(join(temp, "uploads", "upload", uploaded), "utf8"), "fixture");
  console.log("PASS unauthenticated upload body left unread; authorized upload preserved");
} finally {
  await server.close();
  if (globalThis.__pgliteInstanceV2__) await (await globalThis.__pgliteInstanceV2__).close();
  globalThis.fetch = savedFetch;
  process.chdir(startingDir);
  await rm(temp, { force: true, recursive: true });
  if (uploaded) await rm(join("/tmp/jidokaan-media/upload", uploaded), { force: true });
}

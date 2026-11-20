// A disposable database exercises first setup, second factor, recovery and invalidation.
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const previous = process.cwd();
const temp = await mkdtemp(resolve(tmpdir(), "jidokaan-auth-"));
process.chdir(temp);
process.env.DATABASE_URL = "";
delete process.env.ADMIN_BOOTSTRAP_PIN;
const server = await createServer({
  configFile: false,
  root,
  resolve: { alias: { "@": resolve(root, "src") } },
  server: { middlewareMode: true },
  appType: "custom",
});
let db;
try {
  db = await server.ssrLoadModule("/src/lib/db.ts");
  assert.equal(db.dbSource, "pglite");
  const auth = await server.ssrLoadModule("/src/lib/admin-auth.server.ts");
  const { matchTotp } = await server.ssrLoadModule("/src/lib/admin-totp.server.ts");
  const key = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
  assert.equal(matchTotp(key, "287082", 59000), 1); // RFC 6238 SHA-1 vector, truncated to six digits.
  const pin = randomUUID();
  await assert.rejects(auth.unlockAdmin(pin), /AUTH/);
  process.env.ADMIN_BOOTSTRAP_PIN = pin;
  const session = await auth.unlockAdmin(pin);
  const backup = await auth.issueRecoveryCode(session, pin);
  assert.ok(backup);
  const step = Math.floor(Date.now() / 30000);
  const codeAt = (step) => {
    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(BigInt(step));
    const mac = createHmac("sha1", "12345678901234567890").update(counter).digest();
    return String((mac.readUInt32BE(mac[mac.length - 1] & 15) & 0x7fffffff) % 1000000).padStart(
      6,
      "0",
    );
  };
  const otp = codeAt(step);
  const enabled = await auth.enableAdminTotp(session, pin, key, codeAt(step + 1));
  await assert.rejects(auth.assertSession(session), /AUTH/);
  assert.equal(await auth.adminTotpEnabled(enabled.token), true);
  await assert.rejects(auth.unlockAdmin(pin), /TOTP_REQUIRED/);
  const second = await auth.unlockAdmin(pin, otp);
  await assert.rejects(auth.unlockAdmin(pin, otp), /TOTP_USED/);
  const changed = await auth.changeAdminPin(second, pin, pin + "2");
  await assert.rejects(auth.assertSession(second), /AUTH/);
  await assert.rejects(auth.assertSession(enabled.token), /AUTH/);
  await auth.assertSession(changed);
  await assert.rejects(auth.unlockAdmin(pin + "2"), /TOTP_REQUIRED/);
  const recovered = await auth.resetWithRecovery(enabled.recoveryCode, pin + "3");
  await assert.rejects(auth.assertSession(changed), /AUTH/);
  await assert.rejects(auth.resetWithRecovery(enabled.recoveryCode, pin), /RECOVERY_NONE/);
  assert.equal(await auth.adminTotpEnabled(recovered), false);
  await auth.destroySession(recovered);
  await assert.rejects(auth.assertSession(recovered), /AUTH/);
  console.log(
    "PASS bootstrap, TOTP enrollment/login/replay, password rotation, one-time recovery, session revocation/logout",
  );
} finally {
  await server.close();
  if (db) await (await db.getPglite()).close();
  process.chdir(previous);
  await rm(temp, { recursive: true, force: true });
}

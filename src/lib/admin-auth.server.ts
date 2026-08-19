import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const SESSION_MS = 12 * 60 * 60 * 1000;

async function db() {
  const { getSql } = await import("./db");
  return getSql();
}

export async function hashSecret(value: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(value, salt, 32)) as Buffer;
  return `scrypt$${salt}$${buf.toString("hex")}`;
}

export async function verifySecret(value: string, stored: string) {
  if (!stored) return false;
  if (!stored.startsWith("scrypt$")) return stored === value;
  const parts = stored.split("$");
  const salt = parts[1];
  const hex = parts[2];
  if (!salt || !hex) return false;
  const buf = (await scryptAsync(value, salt, 32)) as Buffer;
  const expected = Buffer.from(hex, "hex");
  if (expected.length !== buf.length) return false;
  return timingSafeEqual(expected, buf);
}

export function isHashed(value: string) {
  return value.startsWith("scrypt$");
}

async function setting(key: string) {
  const sql = await db();
  const rows = await sql<{ value: string }>`
    select value from site_settings where key = ${key}
  `;
  return rows[0]?.value ?? "";
}

async function putSetting(key: string, value: string) {
  const sql = await db();
  await sql`
    insert into site_settings (key, value)
    values (${key}, ${value})
    on conflict (key) do update set value = excluded.value
  `;
}

export async function migratePlainPin() {
  const saved = await setting("admin_pin");
  if (saved && !isHashed(saved)) {
    await putSetting("admin_pin", await hashSecret(saved));
  }
  const reset = await setting("lock_reset_v2");
  if (!reset) {
    await putSetting("admin_fails", "0");
    await putSetting("admin_locked_until", "");
    await putSetting("lock_reset_v2", "1");
  }
}

export async function lockStatus() {
  const until = await setting("admin_locked_until");
  if (!until) return { locked: false, remainMin: 0 };
  const ms = new Date(until).getTime() - Date.now();
  if (ms <= 0) {
    await putSetting("admin_locked_until", "");
    await putSetting("admin_fails", "0");
    return { locked: false, remainMin: 0 };
  }
  return { locked: true, remainMin: Math.ceil(ms / 60000) };
}

async function recordFail() {
  const n = Number(await setting("admin_fails") || "0") + 1;
  await putSetting("admin_fails", String(n));
  if (n >= MAX_FAILS) {
    await putSetting("admin_locked_until", new Date(Date.now() + LOCK_MS).toISOString());
  }
  return n;
}

export async function createSession() {
  const token = randomBytes(32).toString("hex");
  const sql = await db();
  await sql.query(`
    create table if not exists admin_sessions (
      token_hash text primary key,
      expires_at timestamptz not null
    )
  `);
  await sql.query(
    "insert into admin_sessions (token_hash, expires_at) values ($1, $2)",
    [await hashSecret(token), new Date(Date.now() + SESSION_MS).toISOString()],
  );
  return token;
}

export async function assertSession(token: string) {
  if (!token || token.length < 20) throw new Error("AUTH");
  const sql = await db();
  await sql.query(`
    create table if not exists admin_sessions (
      token_hash text primary key,
      expires_at timestamptz not null
    )
  `);
  await sql.query("delete from admin_sessions where expires_at < now()");
  const rows = await sql.query<{ token_hash: string }>(
    "select token_hash from admin_sessions",
  );
  for (const row of rows) {
    if (await verifySecret(token, row.token_hash)) return;
  }
  throw new Error("AUTH");
}

export async function destroySession(token: string) {
  try {
    const sql = await db();
    const rows = await sql.query<{ token_hash: string }>(
      "select token_hash from admin_sessions",
    );
    for (const row of rows) {
      if (await verifySecret(token, row.token_hash)) {
        await sql`delete from admin_sessions where token_hash = ${row.token_hash}`;
      }
    }
  } catch {
    /* ignore */
  }
}

export async function unlockAdmin(pin: string, nextPin?: string) {
  const lock = await lockStatus();
  if (lock.locked) throw new Error(`LOCKED:${lock.remainMin}`);

  const saved = await setting("admin_pin");
  if (!saved) {
    const next = (nextPin ?? pin).trim();
    if (next.length < 8) throw new Error("PIN_SHORT");
    await putSetting("admin_pin", await hashSecret(next));
    await putSetting("admin_fails", "0");
    return createSession();
  }

  const ok = await verifySecret(pin, saved);
  if (!ok) {
    const fails = await recordFail();
    const left = MAX_FAILS - fails;
    if (left <= 0) throw new Error("LOCKED:15");
    throw new Error(`PIN_BAD:${left}`);
  }

  if (!isHashed(saved)) {
    await putSetting("admin_pin", await hashSecret(pin));
  }
  await putSetting("admin_fails", "0");
  await putSetting("admin_locked_until", "");
  return createSession();
}

export async function changeAdminPin(token: string, current: string, next: string) {
  await assertSession(token);
  const lock = await lockStatus();
  if (lock.locked) throw new Error(`LOCKED:${lock.remainMin}`);
  const saved = await setting("admin_pin");
  if (!saved) throw new Error("AUTH");
  const ok = await verifySecret(current, saved);
  if (!ok) {
    const fails = await recordFail();
    const left = MAX_FAILS - fails;
    if (left <= 0) throw new Error("LOCKED:15");
    throw new Error(`PIN_BAD:${left}`);
  }
  const trimmed = next.trim();
  if (trimmed.length < 8) throw new Error("PIN_SHORT");
  await putSetting("admin_pin", await hashSecret(trimmed));
  await putSetting("admin_fails", "0");
  await putSetting("admin_locked_until", "");
}

export const AUTH_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Cache-Control": "no-store",
};

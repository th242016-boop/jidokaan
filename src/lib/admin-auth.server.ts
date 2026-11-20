import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { matchTotp, openTotp, sealTotp } from "./admin-totp.server";

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

function totpEnvelope(stored: string) {
  return isHashed(stored) ? stored.split("$")[3] : undefined;
}

async function setting(key: string) {
  const sql = await db();
  const rows = await sql<{ value: string }>`
    select value from site_settings where key = ${key}
  `;
  return rows[0]?.value ?? "";
}

async function putSetting(key: string, value: string) {
  if (key === "admin_pin" && !value.trim()) return;
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
    const sql = await db();
    await sql`update site_settings set value=${await hashSecret(saved)} where key='admin_pin' and value=${saved}`;
  }
  const reset = await setting("lock_reset_v2");
  if (!reset) {
    await putSetting("admin_fails", "0");
    await putSetting("admin_locked_until", "");
    await putSetting("lock_reset_v2", "1");
  }
  // Never wipe admin_pin. Old one-time flags already ran on live.
  for (const key of ["login_reset_20260820", "login_open_v1", "login_keypad_v6"]) {
    if (!(await setting(key))) {
      await putSetting("admin_fails", "0");
      await putSetting("admin_locked_until", "");
      await putSetting(key, "1");
    }
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
  const sql = await db();
  const [failure] = await sql<{ value: string }>`
    insert into site_settings (key, value) values ('admin_fails','1')
    on conflict (key) do update set value = (site_settings.value::int + 1)::text returning value
  `;
  const n = Number(failure.value);
  if (n >= MAX_FAILS) {
    await putSetting("admin_locked_until", new Date(Date.now() + LOCK_MS).toISOString());
  }
  return n;
}

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function createSession(credential: string) {
  const token = randomBytes(32).toString("hex");
  const sql = await db();
  await sql`delete from admin_sessions where expires_at <= now()`;
  const rows = await sql`
    insert into admin_sessions (token_hash, expires_at, credential_tag)
    select ${digest(token)}, ${new Date(Date.now() + SESSION_MS).toISOString()}::timestamptz, md5(value)
    from site_settings where key='admin_pin' and value=${credential}
    returning token_hash
  `;
  if (!rows.length) throw new Error("AUTH");
  return token;
}

export async function assertSession(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error("AUTH");
  const sql = await db();
  const rows = await sql`
    select 1 from admin_sessions s join site_settings p on p.key='admin_pin'
    where s.token_hash=${digest(token)} and s.expires_at > now() and s.credential_tag=md5(p.value)
  `;
  if (!rows.length) throw new Error("AUTH");
}

export async function destroySession(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return;
  const sql = await db();
  await sql`delete from admin_sessions where token_hash=${digest(token)}`;
}

async function badLogin(): Promise<never> {
  const fails = await recordFail();
  if (fails >= MAX_FAILS) throw new Error("LOCKED:15");
  throw new Error(`PIN_BAD:${MAX_FAILS - fails}`);
}

async function consumeTotp(secret: string, otp: string) {
  const step = matchTotp(secret, otp);
  if (step === null) throw new Error("TOTP_BAD");
  const sql = await db();
  await sql`delete from admin_totp_uses where time_step < ${Math.floor(Date.now() / 30000) - 2}`;
  const used = await sql`
    insert into admin_totp_uses (credential_tag,time_step) values (${digest(secret)},${step})
    on conflict do nothing returning time_step
  `;
  if (!used.length) throw new Error("TOTP_USED");
}

export async function unlockAdmin(pin: string, otp = "") {
  const lock = await lockStatus();
  if (lock.locked) throw new Error(`LOCKED:${lock.remainMin}`);
  const sql = await db();
  let saved = await setting("admin_pin");
  if (!saved) {
    // The first password is supplied by the operator, never chosen by a visitor.
    const initial = process.env.ADMIN_BOOTSTRAP_PIN?.trim();
    if (
      !initial ||
      initial.length < 8 ||
      !timingSafeEqual(Buffer.from(digest(pin)), Buffer.from(digest(initial)))
    ) {
      throw new Error("AUTH");
    }
    const seeded = await hashSecret(initial);
    await sql`insert into site_settings (key,value) values ('admin_pin',${seeded})
      on conflict (key) do update set value=excluded.value where site_settings.value=''`;
    saved = await setting("admin_pin");
  }
  if (!(await verifySecret(pin, saved))) return badLogin();
  const factor = totpEnvelope(saved);
  if (factor) {
    if (!otp) throw new Error("TOTP_REQUIRED");
    try {
      await consumeTotp(await openTotp(factor, pin), otp);
    } catch (error) {
      if (error instanceof Error && error.message === "TOTP_BAD") return badLogin();
      throw error;
    }
  }
  if (!isHashed(saved)) {
    const upgraded = await hashSecret(pin);
    const updated =
      await sql`update site_settings set value=${upgraded} where key='admin_pin' and value=${saved} returning key`;
    if (!updated.length) throw new Error("AUTH");
    saved = upgraded;
  }
  await putSetting("admin_fails", "0");
  await putSetting("admin_locked_until", "");
  return createSession(saved);
}

async function rotateCredential(
  previous: string,
  next: string,
  recovery: string | null,
  consumeRecovery?: string,
) {
  const sql = await db();
  // Check the old credential under the row lock and update recovery in the same statement.
  const rows = await sql.query(
    `
    with changed as (
      update site_settings set value=$2 where key='admin_pin' and value=$1
      and ($4::text is null or exists(select 1 from site_settings where key='admin_recovery' and value=$4))
      returning key
    ), replacement as (
      insert into site_settings (key,value) select 'admin_recovery',$3::text from changed where $3::text is not null
      on conflict(key) do update set value=excluded.value
    ) select key from changed
  `,
    [previous, next, recovery, consumeRecovery ?? null],
  );
  if (!rows.length) throw new Error("AUTH");
  return createSession(next);
}

export async function adminTotpEnabled(token: string) {
  await assertSession(token);
  return Boolean(totpEnvelope(await setting("admin_pin")));
}

export async function enableAdminTotp(token: string, pin: string, secret: string, otp: string) {
  await assertSession(token);
  const saved = await setting("admin_pin");
  if (totpEnvelope(saved) || !(await verifySecret(pin, saved))) throw new Error("AUTH");
  await consumeTotp(secret, otp);
  const next = (await hashSecret(pin)) + "$" + (await sealTotp(secret, pin));
  const recoveryCode = generateRecoveryCode();
  const session = await rotateCredential(
    saved,
    next,
    await hashSecret(normalizeRecovery(recoveryCode)),
  );
  return { token: session, recoveryCode };
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
  const factor = totpEnvelope(saved);
  let nextCredential = await hashSecret(trimmed);
  if (factor) nextCredential += "$" + (await sealTotp(await openTotp(factor, current), trimmed));
  const session = await rotateCredential(saved, nextCredential, null);
  await putSetting("admin_fails", "0");
  await putSetting("admin_locked_until", "");
  return session;
}

const RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRecoveryCode() {
  const bytes = randomBytes(16);
  let out = "";
  for (let i = 0; i < 16; i++) {
    out += RECOVERY_ALPHABET[bytes[i]! % RECOVERY_ALPHABET.length];
    if (i % 4 === 3 && i < 15) out += "-";
  }
  return out;
}

function normalizeRecovery(code: string) {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function issueRecoveryCode(token: string, pin = "") {
  await assertSession(token);
  const saved = await setting("admin_pin");
  if (!(await verifySecret(pin, saved))) throw new Error("AUTH");
  const raw = generateRecoveryCode();
  const sql = await db();
  const rows = await sql`
    insert into site_settings (key, value)
    select 'admin_recovery', ${await hashSecret(normalizeRecovery(raw))} from site_settings
    where key='admin_pin' and value=${saved} for share
    on conflict(key) do update set value=excluded.value returning key
  `;
  if (!rows.length) throw new Error("AUTH");
  return raw;
}

export async function resetWithRecovery(code: string, nextPin: string) {
  const stored = await setting("admin_recovery");
  if (!stored) throw new Error("RECOVERY_NONE");
  const ok = await verifySecret(normalizeRecovery(code), stored);
  if (!ok) throw new Error("RECOVERY_BAD");
  const trimmed = nextPin.trim();
  if (trimmed.length < 8) throw new Error("PIN_SHORT");
  const saved = await setting("admin_pin");
  const session = await rotateCredential(saved, await hashSecret(trimmed), "", stored);
  await putSetting("admin_fails", "0");
  await putSetting("admin_locked_until", "");
  return session;
}

export const AUTH_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Cache-Control": "no-store",
};

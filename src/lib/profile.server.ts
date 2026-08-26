import { auth } from "./auth/server";

export async function ensureProfileTable() {
  const { getSql } = await import("./db");
  const sql = await getSql();
  await sql.query(`
    create table if not exists member_profiles (
      user_id text primary key,
      phone text not null default '',
      updated_at timestamptz not null default now()
    )
  `);
}

export function normalizePhone(raw: string) {
  const trimmed = raw.trim();
  const plus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) return "";
  return plus ? `+${digits}` : digits;
}

export async function getPhone(userId: string) {
  await ensureProfileTable();
  const { getSql } = await import("./db");
  const sql = await getSql();
  const rows = await sql.query<{ phone: string }>(
    "select phone from member_profiles where user_id = $1",
    [userId],
  );
  return rows[0]?.phone ?? "";
}

export async function savePhone(userId: string, raw: string) {
  const phone = normalizePhone(raw);
  if (!phone) throw new Error("INVALID_PHONE");
  await ensureProfileTable();
  const { getSql } = await import("./db");
  const sql = await getSql();
  await sql.query(
    `insert into member_profiles (user_id, phone, updated_at)
     values ($1, $2, now())
     on conflict (user_id) do update set phone = excluded.phone, updated_at = now()`,
    [userId, phone],
  );
  return phone;
}

export async function sessionUser(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

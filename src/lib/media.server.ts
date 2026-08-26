import { getSql } from "./db";

export async function ensureMediaTable() {
  const sql = await getSql();
  await sql.query(`
    create table if not exists media_files (
      id text primary key,
      mime text not null default 'application/octet-stream',
      bytes bytea not null,
      created_at timestamptz not null default now()
    )
  `);
}

function asBuffer(value: unknown): Buffer | null {
  if (!value) return null;
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === "string") {
    if (value.startsWith("\\x") || value.startsWith("\\\\x")) {
      return Buffer.from(value.replace(/^\\+x/i, ""), "hex");
    }
    return Buffer.from(value, "base64");
  }
  return null;
}

export async function saveMediaFile(id: string, mime: string, bytes: Buffer) {
  await ensureMediaTable();
  const sql = await getSql();
  await sql.query(
    `insert into media_files (id, mime, bytes)
     values ($1, $2, $3)
     on conflict (id) do update set mime = excluded.mime, bytes = excluded.bytes`,
    [id, mime || "application/octet-stream", bytes],
  );
}

export async function readMediaFile(id: string) {
  await ensureMediaTable();
  const sql = await getSql();
  const rows = await sql.query<{ mime: string; bytes: unknown }>(
    "select mime, bytes from media_files where id = $1",
    [id],
  );
  const row = rows[0];
  if (!row) return null;
  const bytes = asBuffer(row.bytes);
  if (!bytes?.length) return null;
  return { mime: row.mime || "application/octet-stream", bytes };
}

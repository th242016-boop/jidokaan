import { getSql } from "./db";

export async function ensureMediaTable() {
  const sql = await getSql();
  try {
    await sql.query(`
      create table if not exists media_files (
        id text primary key,
        mime text not null default 'application/octet-stream',
        bytes bytea,
        b64 text,
        created_at timestamptz not null default now()
      )
    `);
  } catch {
    /* table may already exist */
  }
  try {
    await sql.query(`alter table media_files add column if not exists b64 text`);
  } catch {
    /* ignore */
  }
  try {
    await sql.query(`alter table media_files alter column bytes drop not null`);
  } catch {
    /* ignore */
  }
}

function asBuffer(value: unknown): Buffer | null {
  if (!value) return null;
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === "string") {
    const s = value.replace(/^\\+x/i, "");
    if (/^[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0) {
      try {
        return Buffer.from(s, "hex");
      } catch {
        /* fall through */
      }
    }
    try {
      return Buffer.from(value, "base64");
    } catch {
      return null;
    }
  }
  return null;
}

async function checkpoint() {
  try {
    const { dbSource, getPglite } = await import("./db");
    if (dbSource === "pglite") {
      const pg = await getPglite();
      await pg.exec("CHECKPOINT");
    }
  } catch {
    /* neon */
  }
}

export async function saveMediaFile(id: string, mime: string, bytes: Buffer) {
  await ensureMediaTable();
  const sql = await getSql();
  const hex = bytes.toString("hex");
  const b64 = bytes.toString("base64");
  const kind = mime || "application/octet-stream";
  const attempts: Array<() => Promise<unknown>> = [
    () =>
      sql.query(
        `insert into media_files (id, mime, bytes, b64)
         values ($1, $2, decode($3, 'hex'), $4)
         on conflict (id) do update set mime = excluded.mime, bytes = excluded.bytes, b64 = excluded.b64`,
        [id, kind, hex, b64],
      ),
    () =>
      sql.query(
        `insert into media_files (id, mime, b64)
         values ($1, $2, $3)
         on conflict (id) do update set mime = excluded.mime, b64 = excluded.b64`,
        [id, kind, b64],
      ),
    () =>
      sql.query(
        `insert into media_files (id, mime, bytes)
         values ($1, $2, $3)
         on conflict (id) do update set mime = excluded.mime, bytes = excluded.bytes`,
        [id, kind, new Uint8Array(bytes)],
      ),
  ];
  let last: unknown;
  for (const run of attempts) {
    try {
      await run();
      await checkpoint();
      return;
    } catch (err) {
      last = err;
    }
  }
  throw last instanceof Error ? last : new Error("store_failed");
}

export async function readMediaFile(id: string) {
  await ensureMediaTable();
  const sql = await getSql();
  let row: { mime: string; bytes: unknown; b64?: string } | undefined;
  try {
    const rows = await sql.query<{ mime: string; bytes: unknown; b64?: string }>(
      "select mime, bytes, b64 from media_files where id = $1",
      [id],
    );
    row = rows[0];
  } catch {
    const rows = await sql.query<{ mime: string; bytes: unknown }>(
      "select mime, bytes from media_files where id = $1",
      [id],
    );
    row = rows[0];
  }
  if (!row) return null;
  const fromBytes = asBuffer(row.bytes);
  const fromB64 = row.b64 ? Buffer.from(row.b64, "base64") : null;
  const bytes = fromBytes?.length ? fromBytes : fromB64;
  if (!bytes?.length) return null;
  return { mime: row.mime || "application/octet-stream", bytes };
}

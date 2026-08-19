import { assertSession } from "./admin-auth.server";

export type AnalyticsHit = {
  id: string;
  at: string;
  type: "page" | "cart" | "order";
  path: string;
  referrer: string;
  source: string;
  medium: string;
  campaign: string;
  keyword: string;
  landing: string;
};

async function db() {
  const { getSql } = await import("./db");
  return getSql();
}

async function ensure() {
  const sql = await db();
  await sql.query(`
    create table if not exists store_analytics (
      id text primary key,
      data jsonb not null,
      created_at timestamptz not null default now()
    )
  `);
}

export async function trackHit(input: Partial<AnalyticsHit>) {
  await ensure();
  const hit: AnalyticsHit = {
    id: `AN-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(),
    type: input.type === "cart" || input.type === "order" ? input.type : "page",
    path: String(input.path ?? "/").slice(0, 200),
    referrer: String(input.referrer ?? "").slice(0, 300),
    source: String(input.source ?? "").slice(0, 80),
    medium: String(input.medium ?? "").slice(0, 80),
    campaign: String(input.campaign ?? "").slice(0, 80),
    keyword: String(input.keyword ?? "").slice(0, 120),
    landing: String(input.landing ?? "").slice(0, 200),
  };
  const sql = await db();
  await sql.query("insert into store_analytics (id, data) values ($1, $2::jsonb)", [
    hit.id,
    JSON.stringify(hit),
  ]);
  return { ok: true };
}

export async function listHits(token: string, limit = 500): Promise<AnalyticsHit[]> {
  await assertSession(token);
  await ensure();
  const sql = await db();
  const rows = await sql.query<{ data: unknown }>(
    "select data from store_analytics order by created_at desc limit $1",
    [limit],
  );
  return rows
    .map((r) => (typeof r.data === "string" ? JSON.parse(r.data) : r.data) as AnalyticsHit)
    .filter((h) => h?.id);
}

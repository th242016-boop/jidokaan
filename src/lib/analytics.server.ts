import { assertSession } from "./admin-auth.server";
import { randomUUID } from "node:crypto";
import {
  analyticsPeriod,
  analyticsSafePath,
  analyticsSourceLabel,
  type AnalyticsPage,
  type AnalyticsRank,
  type AnalyticsSummary,
} from "./analytics-summary";

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
  const text = (value: unknown, length: number) => typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, length) : "";
  let referrer = "";
  try {
    const ref = new URL(String(input.referrer || ""));
    if (ref.protocol === "https:" || ref.protocol === "http:") referrer = ref.origin;
  } catch { /* A missing referrer is valid and must not be guessed. */ }
  const hit: AnalyticsHit = {
    id: `AN-${randomUUID()}`,
    at: new Date().toISOString(),
    type: input.type === "cart" || input.type === "order" ? input.type : "page",
    path: analyticsSafePath(input.path),
    referrer,
    source: text(input.source, 80),
    medium: text(input.medium, 80),
    campaign: text(input.campaign, 80),
    keyword: text(input.keyword, 120),
    landing: analyticsSafePath(input.landing, ""),
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
    [Number.isFinite(limit) ? Math.max(1, Math.min(500, Math.floor(limit))) : 500],
  );
  return rows
    .map((r) => (typeof r.data === "string" ? JSON.parse(r.data) : r.data) as AnalyticsHit)
    .filter((h) => h?.id);
}

type Ranked = { key: string; count: number };
type SummaryRow = {
  totals: AnalyticsSummary["totals"];
  sources: Ranked[];
  keywords: Ranked[];
  campaigns: Ranked[];
  pages: Ranked[];
  search: AnalyticsSummary["search"];
  excludedSourceViews: number;
};

const fixedPages: Record<string, Omit<AnalyticsPage, "path" | "count">> = {
  "/": { title: "지도칸 홈", image: "/homepage/assets/hero-landscape.webp", kind: "store" },
  "/shop": { title: "전체 상품 · 샵", image: "/products/store/drone-main.png", kind: "store" },
  "/customize": { title: "복싱화 커스텀 시뮬레이터", image: "/simulator/main.jpg", kind: "store" },
  "/special": { title: "스페셜 오더", image: "/homepage/assets/special-denim.webp", kind: "store" },
  "/brand": { title: "지도칸 브랜드 소개", image: "/homepage/assets/made-in-korea.webp", kind: "store" },
  "/about": { title: "지도칸 소개", image: "/homepage/assets/made-in-korea.webp", kind: "store" },
  "/login": { title: "로그인 / 회원가입", image: "", kind: "account" },
  "/signup": { title: "회원가입", image: "", kind: "account" },
  "/checkout": { title: "주문 · 결제", image: "", kind: "store" },
  "/order-success": { title: "주문 접수 결과", image: "", kind: "store" },
  "/cart": { title: "장바구니", image: "", kind: "store" },
  "/orders": { title: "내 주문 조회", image: "", kind: "account" },
  "/account": { title: "내 계정", image: "", kind: "account" },
  "/contact": { title: "고객 문의", image: "", kind: "support" },
  "/faq": { title: "자주 묻는 질문", image: "", kind: "support" },
  "/shipping": { title: "배송 안내", image: "", kind: "support" },
  "/terms": { title: "이용약관", image: "", kind: "support" },
  "/privacy": { title: "개인정보 처리방침", image: "", kind: "support" },
};

function safeImage(value: unknown) {
  if (typeof value !== "string" || value.length > 2000) return "";
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return value;
  try { return new URL(value).protocol === "https:" ? value : ""; } catch { return ""; }
}

/** Aggregates the entire selected period in SQL; the old 500-row feed is not a total. */
export async function summarizeAnalytics(token: string, from?: string | null, to?: string | null): Promise<AnalyticsSummary> {
  await assertSession(token);
  const period = analyticsPeriod(from, to);
  await ensure();
  const sql = await db();
  const rows = await sql.query<{ summary: SummaryRow | string }>(`
    with hits as (
      select coalesce(data->>'type', 'page') as type,
        split_part(split_part(coalesce(data->>'path', '/'), '?', 1), '#', 1) as path,
        lower(regexp_replace(split_part(regexp_replace(trim(coalesce(data->>'source', '')), '^https?://', ''), '/', 1), '^www\\.', '')) as source,
        lower(coalesce(data->>'medium', '')) as medium,
        trim(coalesce(data->>'keyword', '')) as keyword,
        trim(coalesce(data->>'campaign', '')) as campaign
      from store_analytics where created_at >= $1::timestamptz and created_at < $2::timestamptz
    ), classified as (
      select *, source in ('jidokaan.com', 'accounts.google.com', 'kauth.kakao.com', 'accounts.kakao.com', 'nid.naver.com', 'jidokaan-production.up.railway.app') as internal,
        (medium = 'organic' or source in ('naver', 'search.naver.com', 'm.search.naver.com', 'google', 'bing', 'bing.com', 'search.daum.net', 'daum') or source ~ '^google\\.[a-z.]+$') as search,
        case when source = '' then 'unknown' else source end as source_key
      from hits
    )
    select jsonb_build_object(
      'totals', (select jsonb_build_object(
        'pageViews', count(*) filter (where type = 'page'),
        'cartEvents', count(*) filter (where type = 'cart'),
        'orderEvents', count(*) filter (where type = 'order')) from classified),
      'sources', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select source_key as key, count(*)::int as count from classified
        where type = 'page' and not internal group by source_key order by count desc, source_key limit 20) t),
      'keywords', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select keyword as key, count(*)::int as count from classified
        where type = 'page' and keyword <> '' and not internal group by keyword order by count desc, keyword limit 20) t),
      'campaigns', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select campaign as key, count(*)::int as count from classified
        where type = 'page' and campaign <> '' and not internal group by campaign order by count desc, campaign limit 20) t),
      'pages', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select path as key, count(*)::int as count from classified
        where type = 'page' group by path order by count desc, path limit 20) t),
      'search', (select jsonb_build_object(
        'pageViews', count(*) filter (where search),
        'withKeyword', count(*) filter (where search and keyword <> ''),
        'withoutKeyword', count(*) filter (where search and keyword = '')) from classified where type = 'page' and not internal),
      'excludedSourceViews', (select count(*) from classified where type = 'page' and internal)
    ) as summary
  `, [period.start, period.end]);
  const raw = rows[0]?.summary;
  if (!raw) throw new Error("ANALYTICS_UNAVAILABLE");
  const summary = (typeof raw === "string" ? JSON.parse(raw) : raw) as SummaryRow;
  const productIds = summary.pages.map((p) => /^\/products\/([^/]+)\/?$/.exec(p.key)?.[1]).filter((id): id is string => !!id);
  const products = productIds.length ? await sql.query<{ id: string; title: string; image: string }>(`
    select id, coalesce(data->'name'->>'ko', id) as title,
      coalesce(nullif(data->>'image', ''), data->'images'->>0, '') as image
    from catalog_products where id = any($1::text[])
  `, [productIds]) : [];
  const catalog = new Map(products.map((p) => [p.id, p]));
  const ranks = (items: Ranked[], source = false): AnalyticsRank[] => items.map((item) => ({
    key: item.key, label: source ? analyticsSourceLabel(item.key) : item.key, count: Number(item.count),
  }));
  return {
    period: { from: period.from, to: period.to, timezone: "Asia/Seoul" },
    totals: summary.totals,
    sources: ranks(summary.sources, true), keywords: ranks(summary.keywords), campaigns: ranks(summary.campaigns),
    pages: summary.pages.map((page) => {
      const path = analyticsSafePath(page.key), product = catalog.get(/^\/products\/([^/]+)\/?$/.exec(path)?.[1] || "");
      const info = product ? { title: product.title, image: safeImage(product.image), kind: "product" as const }
        : fixedPages[path] || { title: path.startsWith("/products/") ? "상품 페이지 (현재 상품 정보 없음)" : "기타 페이지", image: "", kind: "other" as const };
      return { path, ...info, count: Number(page.count) };
    }),
    search: summary.search, excludedSourceViews: Number(summary.excludedSourceViews),
  };
}

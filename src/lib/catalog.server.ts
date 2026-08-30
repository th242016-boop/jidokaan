import { PRODUCTS, type Product } from "./products";
import { DEFAULT_COMPANY, DEFAULT_NOTICE, DEFAULT_SUPPORT, type InfoRow, type StoreNotice } from "./site-defaults";
import type { Coupon } from "./order-types";
import { DEFAULT_PAY, type PaySettings } from "./pay-settings";
import { DEFAULT_SHIPPING, type ShippingSettings } from "./shipping";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_SEO,
  fillProductSeo,
  migrateCategories,
  normalizeProduct,
  applyDisplayOrder,
  sortForDisplay,
  type ShopCategory,
  type SiteSeo,
} from "./shop-taxonomy";
import type { BlackCustomer, FaqItem } from "./store-extras";
import { assertSession, migratePlainPin } from "./admin-auth.server";

export type { StoreNotice };

export type CatalogPayload = {
  products: Product[];
  company: InfoRow[];
  support: InfoRow[];
  categories: ShopCategory[];
  seo: SiteSeo;
  shipping: ShippingSettings;
  notice: StoreNotice;
  coupons: Coupon[];
  pay: PaySettings;
  faqs: FaqItem[];
  blacklist: BlackCustomer[];
  hasPin: boolean;
};

async function db() {
  const { getSql } = await import("./db");
  return getSql();
}

function asProduct(raw: unknown): Product | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Product;
  if (!p.id || !p.name) return null;
  return normalizeProduct(p);
}

/** Insert missing starter products only. Never update or delete live rows. */
async function applySmartstoreCatalog(
  sql: Awaited<ReturnType<typeof db>>,
) {
  const existing = await sql.query<{ id: string }>(
    "select id from catalog_products",
  );
  const have = new Set(existing.map((r) => r.id));
  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = normalizeProduct(PRODUCTS[i]);
    if (have.has(p.id)) continue;
    await sql.query(
      "insert into catalog_products (id, data, sort) values ($1, $2::jsonb, $3) on conflict (id) do nothing",
      [p.id, JSON.stringify(p), i],
    );
  }
}

function parseRows(raw: string | null | undefined, fallback: InfoRow[]): InfoRow[] {
  if (!raw) return fallback;
  try {
    const v = JSON.parse(raw) as InfoRow[];
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function seedIfEmpty() {
  const sql = await db();
  await sql.query(`
    create table if not exists catalog_products (
      id text primary key,
      data jsonb not null,
      sort integer not null default 0,
      updated_at timestamptz not null default now()
    )
  `);
  await sql.query(`
    create table if not exists site_settings (
      key text primary key,
      value text not null
    )
  `);
  const seeded = await sql<{ value: string }>`
    select value from site_settings where key = ${"catalog_seeded"}
  `;
  const count = await sql<{ n: number }>`select count(*)::int as n from catalog_products`;
  if ((count[0]?.n ?? 0) === 0 && seeded.length === 0) {
    for (let i = 0; i < PRODUCTS.length; i++) {
      const p = normalizeProduct(PRODUCTS[i]);
      await sql.query(
        "insert into catalog_products (id, data, sort) values ($1, $2::jsonb, $3) on conflict (id) do nothing",
        [p.id, JSON.stringify(p), i],
      );
    }
  }
  if (seeded.length === 0) {
    await sql`
      insert into site_settings (key, value)
      values (${"catalog_seeded"}, ${"1"})
      on conflict (key) do nothing
    `;
  }
  await applySmartstoreCatalog(sql);
  await migratePlainPin();
  const noticeFlag = await sql<{ value: string }>`
    select value from site_settings where key = ${"notice_closed_banner_v1"}
  `;
  if (!noticeFlag.length) {
    await sql`
      insert into site_settings (key, value)
      values (${"notice_json"}, ${JSON.stringify(DEFAULT_NOTICE)})
      on conflict (key) do nothing
    `;
    await sql`
      insert into site_settings (key, value)
      values (${"notice_closed_banner_v1"}, ${"1"})
      on conflict (key) do nothing
    `;
  }
  const cannedClear = await sql<{ value: string }>`
    select value from site_settings where key = ${"notice_canned_cleared_v1"}
  `;
  if (!cannedClear.length) {
    const current = await sql<{ value: string }>`
      select value from site_settings where key = ${"notice_json"}
    `;
    const raw = current[0]?.value ?? "";
    if (!raw.trim() || raw.includes("임시사이트로 현재 주문 불가")) {
      await sql`
        insert into site_settings (key, value)
        values (${"notice_json"}, ${JSON.stringify({ enabled: false, text: "" })})
        on conflict (key) do update set value = excluded.value
      `;
    }
    await sql`
      insert into site_settings (key, value)
      values (${"notice_canned_cleared_v1"}, ${"1"})
      on conflict (key) do nothing
    `;
  }
  const cats = await sql<{ value: string }>`
    select value from site_settings where key = ${"categories_json"}
  `;
  if (!cats.length) {
    await sql`
      insert into site_settings (key, value)
      values (${"categories_json"}, ${JSON.stringify(DEFAULT_CATEGORIES)})
      on conflict (key) do nothing
    `;
  }
}

export async function readCatalog(): Promise<CatalogPayload> {
  await seedIfEmpty();
  const sql = await db();
  const rows = await sql.query<{ id: string; data: unknown }>(
    "select id, data from catalog_products order by sort asc, id asc",
  );
  const products = rows
    .map((r) => {
      const data =
        typeof r.data === "string" ? (JSON.parse(r.data) as unknown) : r.data;
      return asProduct(data);
    })
    .filter((p): p is Product => Boolean(p));

  const settings = await sql<{ key: string; value: string }>`
    select key, value from site_settings
  `;
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const categories = migrateCategories(parseJson(map.categories_json, DEFAULT_CATEGORIES));
  const seo = parseJson(map.seo_json, DEFAULT_SEO);
  const rawProducts = products.length ? products : PRODUCTS.map(normalizeProduct);
  const savedOrder = parseJson<string[]>(map.product_order, []);
  const ordered = savedOrder.length
    ? applyDisplayOrder(rawProducts, savedOrder)
    : sortForDisplay(rawProducts);
  return {
    products: ordered,
    company: parseRows(map.company_json, DEFAULT_COMPANY),
    support: parseRows(map.support_json, DEFAULT_SUPPORT),
    categories: categories.length ? categories : DEFAULT_CATEGORIES,
    seo: seo?.title ? seo : DEFAULT_SEO,
    shipping: parseJson(map.shipping_json, DEFAULT_SHIPPING),
    notice: (() => {
      const n = parseJson(map.notice_json, DEFAULT_NOTICE);
      const text = String(n?.text ?? "").trim();
      return {
        enabled: Boolean(n?.enabled) && Boolean(text),
        text,
      };
    })(),
    coupons: parseJson(map.coupons_json, []),
    pay: parseJson(map.pay_json, DEFAULT_PAY),
    faqs: parseJson(map.faqs_json, []),
    blacklist: parseJson(map.blacklist_json, []),
    hasPin: Boolean(map.admin_pin),
  };
}

async function persistDisk() {
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

export async function assertAdmin(token: string) {
  await assertSession(token);
}

async function writeSetting(key: string, value: string) {
  const sql = await db();
  await sql`
    insert into site_settings (key, value)
    values (${key}, ${value})
    on conflict (key) do update set value = excluded.value
  `;
  await persistDisk();
}

export async function upsertProduct(token: string, product: Product) {
  await assertAdmin(token);
  const sql = await db();
  const saved = fillProductSeo(normalizeProduct({
    ...product,
    createdAt: product.createdAt || new Date().toISOString(),
  }));
  await sql.query(
    `insert into catalog_products (id, data, sort, updated_at)
     values ($1, $2::jsonb, $3, now())
     on conflict (id) do update set data = excluded.data, sort = excluded.sort, updated_at = now()`,
    [saved.id, JSON.stringify(saved), saved.sortOrder ?? 0],
  );
  await persistDisk();
}

export async function deleteProduct(token: string, id: string) {
  await assertAdmin(token);
  const sql = await db();
  await sql`delete from catalog_products where id = ${id}`;
  await persistDisk();
}

export async function bulkProducts(
  token: string,
  ids: string[],
  op: string,
  extra?: { majorId?: string; minorId?: string; order?: string[] },
) {
  await assertAdmin(token);
  const sql = await db();
  const catalog = await readCatalog();
  const selected = new Set(ids);
  for (const p of catalog.products) {
    if (!selected.has(p.id)) continue;
    if (op === "delete") {
      await sql`delete from catalog_products where id = ${p.id}`;
      continue;
    }
    if (op === "copy") {
      const copy: Product = fillProductSeo(normalizeProduct({
        ...p,
        id: `${p.id}-copy-${Date.now().toString(36)}`,
        sku: p.sku ? `${p.sku}-COPY` : "",
        name: { ...p.name, ko: `${p.name.ko} 복사` },
        createdAt: new Date().toISOString(),
        featured: false,
      }));
      await sql.query(
        `insert into catalog_products (id, data, sort, updated_at)
         values ($1, $2::jsonb, 0, now())`,
        [copy.id, JSON.stringify(copy)],
      );
      continue;
    }
    const next: Product = { ...p };
    if (op === "show") next.visible = true;
    if (op === "hide") next.visible = false;
    if (op === "sell") next.inStock = true;
    if (op === "unsell") next.inStock = false;
    if (op === "category") {
      if (extra?.majorId) next.majorId = extra.majorId;
      next.minorId = undefined;
    }
    await sql.query(
      `update catalog_products set data = $2::jsonb, updated_at = now() where id = $1`,
      [next.id, JSON.stringify(normalizeProduct(next))],
    );
  }
  await persistDisk();
}

export async function reorderProducts(token: string, ids: string[]) {
  await assertAdmin(token);
  const unique = ids.filter((id, i) => id && ids.indexOf(id) === i);
  if (!unique.length) return;
  await writeSetting("product_order", JSON.stringify(unique));
  const sql = await db();
  const catalog = await readCatalog();
  const byId = new Map(catalog.products.map((p) => [p.id, p]));
  const rest = catalog.products.map((p) => p.id).filter((id) => !unique.includes(id));
  const full = [...unique, ...rest];
  for (let i = 0; i < full.length; i++) {
    const p = byId.get(full[i]!);
    if (!p) continue;
    const next = normalizeProduct({ ...p, sortOrder: i + 1 });
    await sql.query(
      `update catalog_products set data = $2::jsonb, sort = $3, updated_at = now() where id = $1`,
      [next.id, JSON.stringify(next), i + 1],
    );
  }
  await persistDisk();
}

export async function writeSiteInfo(
  token: string,
  company: InfoRow[],
  support: InfoRow[],
) {
  await assertAdmin(token);
  await writeSetting("company_json", JSON.stringify(company));
  await writeSetting("support_json", JSON.stringify(support));
}

export async function writeCategories(token: string, categories: ShopCategory[]) {
  await assertAdmin(token);
  await writeSetting("categories_json", JSON.stringify(categories));
}

export async function writeSeo(token: string, seo: SiteSeo) {
  await assertAdmin(token);
  await writeSetting("seo_json", JSON.stringify(seo));
}

export async function writeShipping(token: string, shipping: ShippingSettings) {
  await assertAdmin(token);
  await writeSetting("shipping_json", JSON.stringify(shipping));
}

export async function writeNotice(token: string, notice: StoreNotice) {
  await assertAdmin(token);
  await writeSetting("notice_json", JSON.stringify(notice));
}

export async function writeCoupons(token: string, coupons: Coupon[]) {
  await assertAdmin(token);
  await writeSetting("coupons_json", JSON.stringify(coupons));
}

export async function writePay(token: string, pay: PaySettings) {
  await assertAdmin(token);
  await writeSetting("pay_json", JSON.stringify(pay));
}

export async function writeFaqs(token: string, faqs: FaqItem[]) {
  await assertAdmin(token);
  await writeSetting("faqs_json", JSON.stringify(faqs));
}

export async function writeBlacklist(token: string, blacklist: BlackCustomer[]) {
  await assertAdmin(token);
  await writeSetting("blacklist_json", JSON.stringify(blacklist));
}

export async function isBlockedEmail(email: string) {
  const list = parseJson<BlackCustomer[]>(
    (await (async () => {
      const sql = await db();
      const rows = await sql.query<{ value: string }>(
        "select value from site_settings where key = $1",
        ["blacklist_json"],
      );
      return rows[0]?.value ?? "[]";
    })()),
    [],
  );
  const needle = email.trim().toLowerCase();
  return list.some((b) => b.email.trim().toLowerCase() === needle);
}

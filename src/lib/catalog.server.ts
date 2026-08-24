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

/**
 * Upserts the grok.me PRODUCTS catalog even when catalog_products is not empty,
 * then deletes SKUs that are not on grok.me (legacy drone-black/white, ring-red/mint,
 * lace-pack, care-kit, jidokaan-patch, and any other non-PRODUCTS rows).
 */
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
  const keepIds = PRODUCTS.map((p) => p.id);
  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = normalizeProduct(PRODUCTS[i]);
    await sql.query(
      `insert into catalog_products (id, data, sort, updated_at)
       values ($1, $2::jsonb, $3, now())
       on conflict (id) do update set data = excluded.data, sort = excluded.sort, updated_at = now()`,
      [p.id, JSON.stringify(p), p.sortOrder ?? i + 1],
    );
  }
  const legacyOffGrokMe = [
    "drone-black",
    "drone-white",
    "ring-red",
    "ring-mint",
    "lace-pack",
    "care-kit",
    "jidokaan-patch",
  ];
  await sql.query(
    "delete from catalog_products where id <> all($1::text[]) or id = any($2::text[])",
    [keepIds, legacyOffGrokMe],
  );
  const pin = await sql<{ value: string }>`
    select value from site_settings where key = ${"admin_pin"}
  `;
  if (pin.length === 0) {
    await sql`
      insert into site_settings (key, value)
      values (${"admin_pin"}, ${""})
      on conflict (key) do nothing
    `;
  }
  await migratePlainPin();
  const cats = await sql<{ value: string }>`
    select value from site_settings where key = ${"categories_json"}
  `;
  const current = parseJson<ShopCategory[]>(cats[0]?.value, []);
  const nextCats = migrateCategories(current);
  if (JSON.stringify(current) !== JSON.stringify(nextCats)) {
    await sql`
      insert into site_settings (key, value)
      values (${"categories_json"}, ${JSON.stringify(nextCats)})
      on conflict (key) do update set value = excluded.value
    `;
  }
  const all = await sql.query<{ id: string; data: unknown }>(
    "select id, data from catalog_products",
  );
  for (const row of all) {
    const data = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
    const p = asProduct(data);
    if (!p) continue;
    const fixed = normalizeProduct(p);
    if (fixed.majorId !== p.majorId || fixed.minorId !== p.minorId) {
      await sql.query(
        "update catalog_products set data = $2::jsonb where id = $1",
        [fixed.id, JSON.stringify(fixed)],
      );
    }
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
  return {
    products: sortForDisplay(rawProducts),
    company: parseRows(map.company_json, DEFAULT_COMPANY),
    support: parseRows(map.support_json, DEFAULT_SUPPORT),
    categories: categories.length ? categories : DEFAULT_CATEGORIES,
    seo: seo?.title ? seo : DEFAULT_SEO,
    shipping: parseJson(map.shipping_json, DEFAULT_SHIPPING),
    notice: parseJson(map.notice_json, DEFAULT_NOTICE),
    coupons: parseJson(map.coupons_json, []),
    pay: parseJson(map.pay_json, DEFAULT_PAY),
    faqs: parseJson(map.faqs_json, []),
    blacklist: parseJson(map.blacklist_json, []),
    hasPin: Boolean(map.admin_pin),
  };
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
}

export async function deleteProduct(token: string, id: string) {
  await assertAdmin(token);
  const sql = await db();
  await sql`delete from catalog_products where id = ${id}`;
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
}

export async function reorderProducts(token: string, ids: string[]) {
  await assertAdmin(token);
  const sql = await db();
  const catalog = await readCatalog();
  const byId = new Map(catalog.products.map((p) => [p.id, p]));
  for (let i = 0; i < ids.length; i++) {
    const p = byId.get(ids[i]);
    if (!p) continue;
    const next = normalizeProduct({ ...p, sortOrder: i + 1 });
    await sql.query(
      `update catalog_products set data = $2::jsonb, sort = $3, updated_at = now() where id = $1`,
      [next.id, JSON.stringify(next), i + 1],
    );
  }
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

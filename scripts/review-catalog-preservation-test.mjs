// Public original-detail preservation checks. No network, orders or customer data.
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { createServer } from "vite";

// V16 intentionally fixes rendered translations/prices/policies; preserve the source
// catalog and every media asset instead of freezing the old buggy route source.
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => { throw Error("OUTBOUND_NETWORK_BLOCKED"); };
const server = await createServer({
  configFile: false, root: process.cwd(),
  define: { "import.meta.env.VITE_REVIEW_PREVIEW": '"true"' },
  resolve: { alias: { "@": resolve("src") } },
  server: { middlewareMode: true }, appType: "custom",
});
try {
  const captured = JSON.parse(await readFile("src/lib/review-catalog-products.json", "utf8"));
  assert.equal(createHash("sha256").update(JSON.stringify(captured.products)).digest("hex"),
    "0dbabf073c2981f3336c2832421e149b4aa8b9760f981cb574a0cad075f06113",
    "Products must remain identical to the public 2026-11-16 production capture");
  const { reviewCatalogProducts } = await server.ssrLoadModule("/src/lib/review-catalog.ts");
  const { fetchCatalog } = await server.ssrLoadModule("/src/lib/use-catalog.ts");
  const { preservedProductDisplayName } = await server.ssrLoadModule("/src/lib/preserved-product-detail.ts");
  const { LOCALES, pickLocalized } = await server.ssrLoadModule("/src/lib/i18n.ts");
  const before = structuredClone(captured.products);
  const reviewed = reviewCatalogProducts();
  const catalog = await fetchCatalog();
  assert.equal(reviewed.length, 8);
  assert.equal(catalog.products.filter(p => p.visible !== false).length, 6);
  assert.deepEqual(catalog.products.filter(p => p.visible === false).map(p => p.id), ["lace-a1", "lace-a2"]);
  assert.equal(reviewed.reduce((n, p) => n + (p.detailImages?.length ?? 0), 0), 39);
  const unmapped = (src) => src.replace(/^https:\/\/jidokaan\.com/, "");
  for (const source of captured.products) {
    const product = reviewed.find(p => p.id === source.id);
    const served = catalog.products.find(p => p.id === source.id);
    assert.ok(product, source.id);
    for (const key of ["name", "description", "tagline", "options", "priceUsd", "priceKrw", "sku", "visible", "smartstoreUrl"]) {
      assert.deepEqual(product[key], source[key], `${source.id}: preserve ${key}`);
      assert.deepEqual(served[key], source[key], `${source.id}: served catalog preserves ${key}`);
    }
    for (const key of ["images", "detailImages"]) {
      assert.deepEqual(product[key]?.map(unmapped), source[key], `${source.id}: preserve ${key} order`);
      assert.deepEqual(served[key]?.map(unmapped), source[key], `${source.id}: served media order`);
    }
    for (const src of [product.image, ...(product.images ?? []), ...(product.detailImages ?? [])].filter(Boolean)) {
      if (src.startsWith("https:")) {
        assert.ok(captured.externalMedia.includes(unmapped(src)));
        assert.ok(src.startsWith("https://jidokaan.com/products/"));
      } else await access(resolve("public", src.slice(1)));
    }
    for (const { id: locale } of LOCALES) {
      const body = pickLocalized(served.description, locale);
      const originalBody = Object.hasOwn(source.description, locale)
        ? source.description[locale] : source.description.en || source.description.ko || source.description.ja || "";
      assert.equal(body, originalBody, `${source.id}/${locale}: original full detail body and fallback`);
      assert.ok(body.trim(), `${source.id}/${locale}: nonempty detail body`);
      const originalTitle = locale === "ko" ? source.name.ko || source.name.en || "지도칸"
        : locale === "ja" ? source.name.ja || source.name.en : source.name.en;
      assert.equal(preservedProductDisplayName(served, locale), originalTitle,
        `${source.id}/${locale}: original production title`);
    }
  }
  // Existing editorial notices are preserved, including their historical numbers.
  // Current homepage/order guidance has a separate source and must not rewrite these bodies.
  for (const id of ["drone-custom", "drone-mid"]) {
    const product = reviewed.find(p => p.id === id);
    assert.match(pickLocalized(product.description, "ko"), /20[~～–]30/);
    assert.match(pickLocalized(product.description, "ja"), /USD 230/);
  }
  assert.deepEqual(captured.products, before, "snapshot and merchant copy remain immutable");
  assert.deepEqual(catalog.blacklist, []);
  assert.deepEqual(catalog.coupons, []);
  assert.equal(Object.hasOwn(captured, "blacklist"), false);
  assert.equal(Object.hasOwn(captured, "pay"), false);
  console.log("PASS unchanged catalog titles, full source bodies and original locale fallback");
  console.log("PASS 8 unchanged public products, 6 visible, 39 ordered detail images, local/public-URL asset integrity; no live API call");
} finally { globalThis.fetch = originalFetch; await server.close(); }

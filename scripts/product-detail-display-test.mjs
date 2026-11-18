// Offline regression against the actual preserved public catalog, not synthetic summaries.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createServer } from "vite";
globalThis.fetch = async () => { throw Error("OUTBOUND_NETWORK_BLOCKED"); };
const server = await createServer({configFile:false,root:process.cwd(),resolve:{alias:{"@":resolve("src")}},server:{middlewareMode:true},appType:"custom"});
try {
  const { productDetailBody } = await server.ssrLoadModule("/src/lib/product-detail-copy.ts");
  const { storefrontProductPrice, storefrontProductCompare } = await server.ssrLoadModule("/src/lib/storefront-money.ts");
  const { LOCALES } = await server.ssrLoadModule("/src/lib/i18n.ts");
  const catalog = JSON.parse(await readFile("src/lib/review-catalog-products.json", "utf8")).products;
  const before = structuredClone(catalog);
  let pairs = 0;
  for (const product of catalog) {
    for (const {id:locale} of LOCALES) {
      const body = productDetailBody(product, locale, "USD", "JP");
      assert.ok(body.trim(), `${product.id}/${locale}`);
      if (!["ko","en"].includes(locale)) assert.notEqual(body, productDetailBody(product,"en","USD","JP"), `${product.id}/${locale}: no English fallback`);
      if (locale !== "ko") assert.doesNotMatch(body, /[가-힣]/, `${product.id}/${locale}: no Korean fallback`);
      if (product.customizable) {
        assert.match(body, /15.*21/, `${product.id}/${locale}: current production time`);
        assert.match(body, /37[,\s.]000/, `${product.id}/${locale}: destination price in narrative`);
        assert.doesNotMatch(body, /20[~～–]30|USD\s*(230|250)|\$250/, `${product.id}/${locale}: stale price or production time`);
        assert.equal(storefrontProductCompare(product,"USD","JP"), null);
        assert.match(storefrontProductPrice(product,"USD","JP",locale), /37[,\s.]000/);
      }
      pairs++;
    }
  }
  const high = catalog.find(p=>p.id==="drone-custom");
  const mid = catalog.find(p=>p.id==="drone-mid");
  assert.match(productDetailBody(high,"ko","KRW","KR"), /288,000/);
  assert.match(productDetailBody(high,"ja","USD","MX"), /250/);
  assert.doesNotMatch(productDetailBody(mid,"en","USD","JP"), /taller collar/);
  assert.doesNotMatch(productDetailBody(mid,"ja","USD","JP"), /カラーが高め/);
  // Preserve merchant-authored narrative instead of silently substituting default translations.
  const edited = {...high,description:{...high.description,en:"A new merchant product story.",es:"Mi descripción propia."}};
  assert.equal(productDetailBody(edited,"es","USD","MX"),"Mi descripción propia.");
  assert.equal(productDetailBody(edited,"fr","USD","MX"),"A new merchant product story.");
  assert.deepEqual(catalog,before,"display corrections must not mutate source catalog or media");
  console.log(`PASS ${pairs} actual catalog/language detail bodies, JPY narrative/offer consistency, KR/MX destination switch, source immutability and merchant copy`);
} finally { await server.close(); }

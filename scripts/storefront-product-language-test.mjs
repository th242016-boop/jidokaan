// Local display/state tests: no requests, checkout, payments, or messages.
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { createServer } from "vite";
globalThis.fetch = async () => { throw Error("OUTBOUND_NETWORK_BLOCKED"); };
const server = await createServer({configFile:false,root:process.cwd(),resolve:{alias:{"@":resolve("src")}},server:{middlewareMode:true},appType:"custom"});
try {
  const { LOCALES } = await server.ssrLoadModule("/src/lib/i18n.ts");
  const { PRODUCTS, localizedProductText, productDisplayName } = await server.ssrLoadModule("/src/lib/products.ts");
  const { storefrontDetailCopy, simulatorColorLabel, productOptionLabel, productCategoryLabel, productShippingCopy } = await server.ssrLoadModule("/src/lib/storefront-detail-copy.ts");
  const { modelLabel, designSpecLine, FULL_COLORS } = await server.ssrLoadModule("/src/lib/simulator-config.ts");
  const { catalogProductCopy } = await server.ssrLoadModule("/src/lib/catalog-product-copy.ts");
  const { storefrontProductPrice } = await server.ssrLoadModule("/src/lib/storefront-money.ts");
  let cases = 0;
  for (const { id:locale } of LOCALES) {
    const copy = storefrontDetailCopy(locale);
    const shipping = productShippingCopy(locale);
    assert.ok(shipping.title && shipping.body);
    if(locale!=="en") assert.notEqual(shipping.body,productShippingCopy("en").body);
    if(locale!=="ko") assert.doesNotMatch(shipping.title+shipping.body,/[가-힣]/);
    assert.equal(Object.keys(copy).length, 31);
    for (const [key,text] of Object.entries(copy)) {
      assert.equal(typeof text,"string",`${locale}.${key}`);
      assert.ok(text.trim(),`${locale}.${key}`);
      if (locale !== "ko") assert.doesNotMatch(text,/[가-힣]/,`${locale}.${key}`);
      if (locale !== "ko" && locale !== "en" && ["notFound", "chooseAll", "saveError", "invalidLink", "materialError"].includes(key)) assert.notEqual(text,storefrontDetailCopy("en")[key],`${locale}.${key} English fallback`);
    }
    for (const product of PRODUCTS) {
      const translated=catalogProductCopy(product.id,locale);
      assert.ok(translated);
      assert.equal(productDisplayName(product,locale),locale === "ko" ? product.name.ko : translated.name);
      for(const field of ["tagline","description"]) {
        const value=localizedProductText(product,field,locale);
        assert.ok(value.trim());
        assert.equal(value,translated[field]);
        if(locale!=="ko") assert.doesNotMatch(value,/[가-힣]/);
        if(locale!=="en") assert.notEqual(value,localizedProductText(product,field,"en"));
        assert.doesNotMatch(value,/USD\s*250|\$\s*250|20[~～–]30|30\s*(?:business|영업일)/i);
      }
      if(product.customizable) assert.match(localizedProductText(product,"description",locale),/15.*21/);
      cases++;
    }
    assert.notEqual(modelLabel({model:"mid"},locale),modelLabel({model:"high"},locale));
    assert.ok(designSpecLine({model:"mid",a:"WHITE",b:"RED"},locale).startsWith(copy.modelMid));
    assert.ok(designSpecLine({model:"mid",a:"WHITE",b:"RED"},locale).includes(simulatorColorLabel("WHITE",locale)));
    for(const color of FULL_COLORS) assert.ok(simulatorColorLabel(color.name,locale));
    for(const value of ["블랙","화이트","레드","블루","네이비","골드","실버","브라운","와인","종류","바이퍼두건 쿨링타입(나일론)","바이퍼두건 타올타입(면)"]) {
      const label=productOptionLabel(value,locale);
      assert.ok(label);
      if(locale!=="ko")assert.doesNotMatch(label,/[가-힣]/);
    }
    assert.equal(productOptionLabel("merchant-specific option",locale),"merchant-specific option");
    assert.equal(productCategoryLabel("shoes","My edited category",locale),"My edited category");
  }
  const boots=PRODUCTS.find(p=>p.id==="drone-custom");
  assert.match(storefrontProductPrice(boots,"USD","JP","ja"),/37,000/);
  assert.match(storefrontProductPrice(boots,"USD","MX","es"),/250/);
  assert.doesNotMatch(localizedProductText(boots,"description","ja"),/USD|250|37000/);
  const merchant={...boots,name:{...boots.name,en:"Merchant renamed boots"},description:{...boots.description,en:"Merchant updated details"}};
  assert.equal(productDisplayName(merchant,"es"),"Merchant renamed boots");
  assert.equal(localizedProductText(merchant,"description","es"),"Merchant updated details");
  assert.equal(boots.priceUsd,25000);
  assert.equal(boots.priceKrw,288000);
  const live = JSON.parse(await readFile(resolve("scripts/fixtures/public-catalog-20261115.json"), "utf8"));
  for (const saved of live.products.filter(product => ["drone-custom", "drone-mid"].includes(product.id))) {
    const before = structuredClone(saved);
    for (const { id: locale } of LOCALES) {
      const result = localizedProductText(saved, "description", locale);
      assert.doesNotMatch(result, /20[~～–]30|50,000|USD\s*230|worldwide/i, `${saved.id}/${locale} stale notice`);
      if (locale !== "ko") {
        assert.equal(result, catalogProductCopy(saved.id, locale).description, `${saved.id}/${locale} actual saved default`);
        assert.doesNotMatch(result, /[가-힣]/);
      } else {
        assert.ok(result.includes("네이버 스마트스토어에서 주문해주세요"), "merchant Korean ordering instructions preserved");
        assert.ok(result.includes("15~21"));
      }
    }
    assert.deepEqual(saved, before, "display normalization must not mutate persisted product data");
    const edited = { ...saved, description: { ...saved.description, en: "Merchant's current custom description 29 days", ja: "店舗が独自に編集した説明", es: "Texto propio de la tienda" } };
    assert.equal(localizedProductText(edited, "description", "en"), edited.description.en);
    assert.equal(localizedProductText(edited, "description", "ja"), edited.description.ja);
    assert.equal(localizedProductText(edited, "description", "es"), edited.description.es);
    assert.equal(localizedProductText(edited, "description", "th"), edited.description.en);
  }
  console.log(`PASS ${cases} product/locale pairs: product names, copy, 15–21 days, no stale prices`);
  console.log("PASS 15-language option, model, color and accessible control labels; merchant edits preserved");
  console.log("PASS Japan JPY37,000 and Mexico USD250 display; stored amounts unchanged");
  console.log("PASS real saved Korean merchant copy retained; retired English/Japanese defaults translated in all supported languages");
} finally { await server.close(); }

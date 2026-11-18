// New-sale exclusions and existing-payment recovery. Synthetic fixtures only.
// Run: node --experimental-vm-modules scripts/active-sales-policy-test.mjs
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SourceTextModule, SyntheticModule } from "node:vm";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
globalThis.fetch = async () => { throw Error("OUTBOUND_NETWORK_BLOCKED"); };
const modules = new Map();
const loading = new Map();
let draft = null, paymentState = "unpaid", catalogReads = 0;
const calls = { capture: 0, verify: 0, create: 0, place: 0, updates: 0 };
const sql = { query: async (query) => {
  if (query.startsWith("select payload")) return draft ? [{ payload: structuredClone(draft) }] : [];
  if (query.startsWith("update")) calls.updates++;
  return [];
} };
const stubs = {
  db: { getSql: async () => sql },
  "catalog.server": { readCatalog: async () => { catalogReads++; throw Error("CATALOG_MUST_NOT_BE_READ"); }, isBlockedEmail: async () => false },
  "orders.server": { countOrdersByEmail: async () => 0, placeOrder: async (payload) => { calls.place++; return { ...payload, id: "TEST-PAID-RECOVERY" }; } },
  "admin-auth.server": { assertSession: async () => {} },
  "paypal.server": {
    createPaypalOrder: async () => { calls.create++; throw Error("CREATE_MUST_NOT_BE_CALLED"); },
    capturePaypalOrder: async () => { calls.capture++; paymentState = "paid"; },
    verifyPaypalPayment: async (id, expected) => {
      calls.verify++;
      if (paymentState === "timeout") throw Error("SIMULATED_PROVIDER_TIMEOUT");
      if (paymentState !== "paid") throw Error("PAYPAL_NOT_PAID");
      return { paypalOrderId: id, paypalCaptureId: "TEST-CAPTURE", paypalGrossUsd: expected };
    },
  },
};
async function synthetic(id, exports) {
  const module = new SyntheticModule(Object.keys(exports), function () { for (const [name, value] of Object.entries(exports)) this.setExport(name, value); }, { identifier: id });
  modules.set(id, module); return module;
}
async function load(path) {
  if (modules.has(path)) return modules.get(path);
  if (loading.has(path)) return loading.get(path);
  const pending = (async () => {
    if (path === "libphonenumber-js/max" || path === "node:crypto") return synthetic(path, await import(path));
    const key = path.split("/").at(-1).replace(/\.ts$/, "");
    if (stubs[key]) return synthetic(path, stubs[key]);
    const module = new SourceTextModule(stripTypeScriptTypes(await readFile(path, "utf8")), { identifier: path });
    modules.set(path, module);
    return module;
  })();
  loading.set(path, pending);
  return pending;
}
async function api(name) {
  const module = await load(resolve(root, "src/lib", `${name}.ts`));
  if (module.status === "unlinked") await module.link((specifier, referrer) => specifier.startsWith(".") ? load(resolve(dirname(referrer.identifier), `${specifier}.ts`)) : load(specifier));
  if (module.status !== "evaluated") await module.evaluate();
  return module.namespace;
}
const policy = await api("active-sales-policy"), shipping = await api("shipping"), rates = await api("ems-rates");
const countries = await api("i18n"), phone = await api("phone"), destination = await api("shipping-destination");
const quote = await api("checkout-quote.server"), paypal = await api("paypal-checkout.server");
const importPolicy = await api("country-import-policy"), copies = await api("checkout-enhancements-copy");
const orders = await api("order-types");
const excluded = ["EG","SA","TR","IN","DE","NL","SE","BR","AR","RU","UZ","AE","FR","ES","CN"];
const active = ["KR","US","CA","MX","AU","TH","GB","PH","CH","HK","SG","JP"];
let count = 0;
async function check(label, fn) { await fn(); count++; console.log(`PASS ${label}`); }
await check("15 excluded countries stay in historical catalogs; 12 delivery choices retain Korea, Hong Kong and Mexico", () => {
  assert.deepEqual([...policy.EXCLUDED_SALES_COUNTRIES].sort(), [...excluded].sort());
  assert.deepEqual([...policy.ACTIVE_SALES_COUNTRIES].sort(), [...active].sort());
  assert.equal(Object.keys(rates.EMS_RATES_KRW).length, 26);
  assert.equal(Object.keys(shipping.DEFAULT_SHIPPING.countryRates).length, 26);
  assert.deepEqual(policy.activeSalesCountries(countries.COUNTRIES).map(c => c.code).sort(), [...active].sort());
  assert.deepEqual(policy.activeSalesCountries(countries.FLAG_MARKETS).map(c => c.code.toUpperCase()).sort(), [...active].sort());
  for (const code of excluded) {
    assert.ok(countries.COUNTRIES.some(c => c.code === code));
    assert.ok(rates.EMS_RATES_KRW[code]);
    assert.ok(shipping.DEFAULT_SHIPPING.countryRates[code]);
  }
});
await check("adding a historical tariff cannot implicitly open sales to a new country", () => {
  rates.EMS_RATES_KRW.NZ = 50000;
  try {
    assert.equal(policy.isActiveSalesCountry("NZ"), false);
    assert.equal(policy.activeSalesCountries([{ code: "NZ" }]).length, 0);
  } finally { delete rates.EMS_RATES_KRW.NZ; }
});
await check("stale saved destinations and malformed payloads cannot silently become a different destination", () => {
  for (const code of excluded) assert.equal(policy.isActiveSalesCountry(` ${code.toLowerCase()} `), false);
  for (const value of [null, undefined, {}, "US-extra", "US KR", "", "ZZ"]) assert.equal(policy.isActiveSalesCountry(value), false);
  assert.equal(policy.isActiveSalesCountry(" us "), true);
  const storage = new Map([[destination.SHIPPING_COUNTRY_KEY, "DE"]]);
  globalThis.sessionStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
  for (const country of ["DE", "CN"]) {
    storage.set(destination.SHIPPING_COUNTRY_KEY, country);
    assert.equal(destination.readLegacyShippingCountry(), country, "preserve a stale saved choice for an explicit unavailable message");
    assert.equal(destination.isSupportedShippingCountry(destination.readLegacyShippingCountry()), false);
  }
  assert.equal(countries.detectVisitorMarketFrom("de-DE", "Europe/Berlin").code, "");
  assert.equal(countries.detectVisitorMarketFrom("de-DE", "Europe/Berlin").locale, "de");
  assert.equal(countries.detectVisitorMarketFrom("en-US", "Asia/Dubai").code, "");
  assert.equal(countries.detectVisitorMarketFrom("zh-CN", "Asia/Shanghai").code, "");
  assert.equal(countries.detectVisitorMarketFrom("zh-CN", "Asia/Shanghai").locale, "zh");
  assert.equal(countries.detectVisitorMarketFrom("zh-HK", "Asia/Hong_Kong").code, "hk");
  assert.equal(countries.detectVisitorMarketFrom("zh-HK", "Asia/Hong_Kong").locale, "zh-Hant");
  assert.ok(countries.LOCALES.some(locale => locale.id === "zh"));
  assert.ok(countries.LOCALES.some(locale => locale.id === "zh-Hant"));
  assert.equal(countries.detectVisitorMarketFrom("es-MX", "America/Mexico_City").code, "mx");
  assert.equal(countries.detectVisitorMarketFrom("es-MX", "America/Mexico_City").locale, "es");
});
await check("excluded shipping quotes are unavailable, never free, including domestic-zone tampering and accessory baskets", () => {
  for (const country of [...excluded, "ZZ", "US_extra"]) {
    for (const items of [undefined, [{category:"gear",qty:1}], [{category:"custom",qty:1}]]) {
      const q = shipping.quoteShipping({country, method:"standard", subtotalKrw:999999, subtotalUsd:999999, qty:1, items});
      assert.equal(q.available, false, country); assert.equal(q.free, false, country); assert.equal(q.reason, "sales_unavailable", country);
    }
  }
  assert.equal(shipping.quoteShipping({country:"KR",method:"standard",subtotalKrw:999999,subtotalUsd:0,qty:1}).available, true);
});
await check("all new purchase methods block excluded destinations before catalog/DB/payment access", async () => {
  for (const country of excluded) {
    for (const pay of ["paypal", "transfer"]) {
      for (const items of [[{productId:"test-shoe",qty:1}],[{productId:"test-band",qty:1}]]) {
        await assert.rejects(quote.quoteCheckout({country,pay,items}), /DESTINATION_SALES_UNAVAILABLE/);
      }
    }
    await assert.rejects(paypal.startPaypalCheckout({country}, "0"), /DESTINATION_SALES_UNAVAILABLE/);
  }
  await assert.rejects(quote.quoteCheckout({country:"US_extra",pay:"paypal"}), /SHIPPING_COUNTRY/);
  assert.equal(catalogReads, 0); assert.equal(calls.create, 0); assert.equal(calls.capture, 0); assert.equal(calls.place, 0);
});
await check("telephone countries remain independent, including numbers from excluded sales countries", () => {
  for (const code of excluded) assert.ok(phone.PHONE_COUNTRY_OPTIONS.some(option => option.code === code), code);
  const foreign = phone.validatePhoneNumber("+49 1512 3456789", "JP");
  assert.equal(foreign.valid, true); assert.equal(foreign.country, "DE");
});
await check("all 16 locales say unavailable rather than suggesting consultation can enable sales; official sources stay intact", () => {
  for (const country of excluded) {
    const rule = importPolicy.countryImportPolicy(country, false);
    assert.equal(rule.salesAvailable, false); assert.equal(rule.consultationRequired, false);
    assert.ok(rule.sources.includes(`https://ems.epost.go.kr/front.EmsApplyGoCondition.postal?nation=${country}`));
    for (const locale of ["en","ko","ja","zh","zh-Hant","es","fr","de","it","pt","ru","tr","uz","th","hi","tl"]) {
      assert.equal(importPolicy.countryImportNotice(country, locale, false), copies.checkoutEnhancementsCopy(locale).salesUnavailable);
    }
  }
  assert.ok(importPolicy.countryImportPolicy("DE").sources.some(source => source.includes("seq=1408")));
});
const reset = (state, country="DE") => {
  draft = {country,totalUsd:310,email:"synthetic@example.invalid",status:"paid",items:[],importPolicyVersion:"historical-version"};
  paymentState = state;
  for (const key of Object.keys(calls)) calls[key] = 0;
};
await check("unpaid or uncertain excluded PayPal drafts cannot initiate a new capture on retry", async () => {
  for (const country of excluded) for (const state of ["unpaid", "timeout"]) {
    reset(state,country);
    await assert.rejects(paypal.completePaypalCheckout("TEST-PAYPAL", true), /DESTINATION_SALES_UNAVAILABLE/);
    assert.equal(calls.capture, 0); assert.equal(calls.verify, 1); assert.equal(calls.place, 0); assert.equal(calls.updates, 0);
  }
});
await check("an already-paid excluded draft is recovered after a response timeout without capturing again", async () => {
  for (const country of ["DE", "CN"]) {
    reset("paid", country);
    const result = await paypal.completePaypalCheckout("TEST-PAYPAL", true);
    assert.equal(result.country, country); assert.equal(result.totalUsd, 310);
    assert.equal(result.importPolicyVersion, "historical-version");
    assert.equal(calls.capture, 0); assert.equal(calls.verify, 1); assert.equal(calls.place, 1); assert.equal(calls.updates, 1);
  }
});
await check("explicit read-only payment recovery remains available for old excluded-country orders", async () => {
  reset("paid", "AE");
  assert.equal((await paypal.recoverPaypalCheckout("TEST-ADMIN", "TEST-PAYPAL")).country, "AE");
  assert.equal(calls.capture, 0); assert.equal(calls.verify, 1); assert.equal(calls.place, 1);
  reset("unpaid", "AE");
  await assert.rejects(paypal.completePaypalCheckout("TEST-PAYPAL", false), /PAYPAL_NOT_PAID/);
  assert.equal(calls.capture, 0); assert.equal(calls.place, 0);
});
await check("active-country checkout capture behavior is preserved", async () => {
  for (const country of ["US", "MX"]) {
    reset("unpaid", country);
    assert.equal((await paypal.completePaypalCheckout("TEST-PAYPAL", true)).country, country);
    assert.equal(calls.capture, 1); assert.equal(calls.verify, 1); assert.equal(calls.place, 1);
  }
});
await check("historical customer order projections preserve excluded destination, paid totals and completion", () => {
  for (const country of excluded) {
    const original = {id:"TEST-OLD",country,status:"done",totalUsd:310,shippingUsd:60,items:[],createdAt:"2025-01-01"};
    const saved = structuredClone(original), result = orders.customerOrder(original);
    assert.equal(result.country,country); assert.equal(result.status,"done"); assert.equal(result.totalUsd,310);
    assert.deepEqual(original,saved);
  }
});
console.log(`${count} active-sales scenarios passed; 15 excluded / 11 active foreign destinations; no real DB, payment, mail or network.`);

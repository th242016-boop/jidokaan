// Run with: node --experimental-vm-modules scripts/hong-kong-shipping-test.mjs
// Real shipping/address/quote/EMS code; in-memory catalog only. No payment, DB, or network.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SourceTextModule, SyntheticModule } from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
globalThis.fetch = async () => { throw new Error("OUTBOUND_NETWORK_BLOCKED"); };
const modules = new Map();
let currentCatalog;
const copy = { shipping: "TEST SHIPPING", duty: "TEST DUTY", usDuty: "TEST US DUTY", design: "TEST DESIGN", production: "TEST PRODUCTION", agree: "TEST TERMS" };
const stubs = {
  "checkout-copy": { checkoutCopy: () => copy, CHECKOUT_COPY: { en: copy } },
  "catalog.server": { readCatalog: async () => currentCatalog, isBlockedEmail: async () => false },
  "orders.server": { countOrdersByEmail: async () => 0 },
  "simulator-config": { modelLabel: () => "TEST MODEL" },
  "design-order": { completeDesign: () => null, designColors: () => ({}), designKey: () => "test", validDesignPreview: () => true, DESIGN_VERSION: "test", ORDER_TERMS_VERSION: "test" },
  "coupon": { couponDiscount: () => ({ krw: 0, usdCents: 0 }), couponRejectReason: () => null, findCoupon: () => null },
  "order-contact": { normalizeInstagram: (s) => String(s ?? "") },
};
async function load(path) {
  if (modules.has(path)) return modules.get(path);
  const key = path.split("/").at(-1).replace(/\.ts$/, "");
  const fixture = stubs[key];
  const mod = fixture
    ? new SyntheticModule(Object.keys(fixture), function () {
        for (const [name, value] of Object.entries(fixture)) this.setExport(name, value);
      }, { identifier: path })
    : new SourceTextModule(stripTypeScriptTypes(await readFile(path, "utf8")), { identifier: path });
  modules.set(path, mod);
  await mod.link((specifier) => load(resolve(dirname(path), `${specifier}.ts`)));
  return mod;
}
async function api(name) {
  const mod = await load(resolve(root, "src/lib", `${name}.ts`));
  if (mod.status !== "evaluated") await mod.evaluate();
  return mod.namespace;
}
let passed = 0;
async function check(label, test) {
  await test();
  console.log(`PASS ${label}`);
  passed++;
}
const shipping = await api("shipping");
const phone = await api("phone");
const i18n = await api("i18n");
const addresses = await api("address-requirements");
const quoteModule = await api("checkout-quote.server");
const ems = await api("ems-workflow");
const quote = (country, qty = 1, settings = shipping.DEFAULT_SHIPPING) => shipping.quoteShipping({ country, qty, method: "standard", subtotalKrw: 288000 * qty, subtotalUsd: 250 * qty, settings });

await check("Hong Kong selectable with correct country name and +852 phone prefix", () => {
  const hk = i18n.COUNTRIES.find(c => c.code === "HK");
  assert.ok(hk);
  assert.equal(i18n.countryName(hk, "ko"), "홍콩");
  assert.equal(i18n.countryName(hk, "en"), "Hong Kong");
  assert.equal(i18n.countryName(hk, "zh"), "香港");
  assert.equal(phone.fullPhoneNumber("91234567", "HK"), "+852 91234567");
  assert.equal(phone.localPhoneNumber("+852 91234567", "HK"), "91234567");
  assert.equal(shipping.zoneForCountry("HK"), "asia");
});
await check("35000 KRW one-box cost quotes $31; multiple pairs use separate boxes", () => {
  const one = quote("HK");
  assert.equal(one.available, true);
  assert.equal(one.krw, 35000);
  assert.equal(one.usd, 31);
  assert.equal(quote("HK", 3).usd, 93);
  assert.equal(quote("HK", 3).krw, 105000);
  assert.equal(quote("IT").available, false);
});
await check("adding absent HK preserves all existing rates, custom FX and merchant minimums", () => {
  const before = shipping.applyEmsPolicy({ ...structuredClone(shipping.DEFAULT_SHIPPING), exchangeKrwPerUsd: 1250 });
  delete before.countryRates.HK;
  before.countryRates.SG.minimumUsd = 49;
  before.countryRates.SG.usd = 49;
  const snapshot = structuredClone(before);
  const after = shipping.applyEmsPolicy(before);
  assert.deepEqual(before, snapshot);
  assert.equal(after.exchangeKrwPerUsd, 1250);
  assert.deepEqual(after.pricing, before.pricing);
  for (const [country, rate] of Object.entries(before.countryRates)) assert.deepEqual(after.countryRates[country], rate);
  assert.equal(after.countryRates.HK.usd, 33);
  assert.deepEqual(shipping.applyEmsPolicy(after), after);
});
await check("existing HK merchant override survives normalization", () => {
  const settings = structuredClone(shipping.DEFAULT_SHIPPING);
  settings.countryRates.HK = { krw: 36000, usd: 45, minimumUsd: 45, note: "EXISTING MERCHANT OVERRIDE" };
  assert.deepEqual(shipping.applyEmsPolicy(settings).countryRates.HK, settings.countryRates.HK);
});

currentCatalog = { products: [{ id: "test-shoe", name: { ko: "TEST ONLY" }, priceUsd: 25000, priceKrw: 288000, inStock: true, visible: true, customizable: false }], shipping: shipping.DEFAULT_SHIPPING, coupons: [] };
const input = { country: "HK", pay: "paypal", email: "test@example.invalid", name: "TEST ONLY", phone: "+852 91234567", address: "TEST ADDRESS", city: "Hong Kong", region: "", postal: "", contactMethod: "email", termsAccepted: true, termsVersion: "test", checkoutLocale: "en", items: [{ productId: "test-shoe", qty: 1 }] };
await check("server accepts HK without invented postcode and quotes catalog price plus shipping", async () => {
  const result = await quoteModule.quoteCheckout({ ...input, totalUsd: 1 });
  assert.equal(result.postal, "");
  assert.equal(result.items[0].priceUsd, 250);
  assert.equal(result.shippingUsd, 31);
  assert.equal(result.totalUsd, 281);
  assert.equal(result.dutyTerms, "DESTINATION_RULES");
  const two = await quoteModule.quoteCheckout({ ...input, items: [{ productId: "test-shoe", qty: 2 }] });
  assert.equal(two.totalUsd, 562);
});
await check("postcode exception preserves AE and requires real codes for other destinations", async () => {
  assert.equal(addresses.requiresPostalCode(" hk "), false);
  assert.equal(addresses.requiresPostalCode("AE"), false);
  assert.equal(addresses.requiresPostalCode("SG"), true);
  assert.equal((await quoteModule.quoteCheckout({ ...input, country: "AE" })).postal, "");
  await assert.rejects(quoteModule.quoteCheckout({ ...input, country: "SG" }), /POSTAL_REQUIRED/);
  await assert.rejects(quoteModule.quoteCheckout({ ...input, country: "TW" }), /SHIPPING_COUNTRY/);
});
await check("EMS preparation does not block Hong Kong or AE on missing postcode", () => {
  const order = { ...input, id: "TEST-HK", status: "paid", currency: "USD", totalUsd: 281, shippingUsd: 31, totalKrw: 323000, shippingKrw: 35000, items: [{ name: "TEST ONLY", qty: 1, priceUsd: 250, priceKrw: 288000 }] };
  const ready = ems.prepareEms(order);
  assert.equal(ready.fulfillment.recipient.postal, "");
  for (const country of ["HK", "AE"]) {
    ready.fulfillment.recipient.country = country;
    assert.equal(ems.emsIssues(ready).some(issue => issue.field === "postal"), false);
  }
  ready.fulfillment.recipient.country = "SG";
  assert.equal(ems.emsIssues(ready).some(issue => issue.field === "postal"), true);
  assert.ok(ems.emsIssues(ready).some(issue => issue.field === "englishConfirmed"));
});
console.log(`${passed} Hong Kong shipping/address checks passed; no external requests or writes.`);

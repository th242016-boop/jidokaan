// Read-only recovery logic with synthetic orders and provider responses. No network or DB.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SourceTextModule, SyntheticModule } from "node:vm";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
globalThis.fetch = async () => { throw Error("OUTBOUND_NETWORK_BLOCKED"); };
let existing = null, verified = [], providerError = null;
const modules = new Map();
const stubs = {
  "orders.server": { lookupOrderByPaypalId: async (id, email) =>
    existing?.paypalOrderId === id && existing.email.toLowerCase() === email.toLowerCase() ? structuredClone(existing) : null },
  "paypal.server": { verifyPaypalPayment: async (id, total, currency) => {
    verified.push({ id, total, currency });
    if (providerError) throw Error(providerError);
    return { paypalOrderId: id, paypalCaptureId: "CAPTURE-TEST" };
  } },
};
async function load(path) {
  if (modules.has(path)) return modules.get(path);
  const key = path.split("/").at(-1).replace(/\.ts$/, "");
  const stub = stubs[key];
  const module = stub ? new SyntheticModule(Object.keys(stub), function () {
    for (const [name, value] of Object.entries(stub)) this.setExport(name, value);
  }, { identifier: path }) : new SourceTextModule(stripTypeScriptTypes(await readFile(path, "utf8")), { identifier: path });
  modules.set(path, module); return module;
}
const module = await load(resolve(root, "src/lib/legacy-paypal-recovery.server.ts"));
await module.link((specifier, referrer) => {
  assert.ok(specifier.startsWith("."), "Unexpected dependency");
  return load(resolve(dirname(referrer.identifier), `${specifier}.ts`));
});
await module.evaluate();
const { recoverLegacyPaypalOrder } = module.namespace;
const fixture = { id: "TEST-HISTORICAL", paypalOrderId: "TESTPAYPAL001", email: "test@example.invalid",
  country: "DE", currency: "USD", totalUsd: 268, shippingUsd: 38, status: "done", items: [{ productId: "old", priceUsd: 230, qty: 1 }],
  note: "Original merchant note", fulfillment: { parcels: [{ id: "parcel-old", state: "delivered" }] } };
const request = { paypalOrderId: fixture.paypalOrderId, email: fixture.email, country: "DE", totalUsd: 1, items: [] };
let count = 0;
async function check(label, fn) { verified = []; providerError = null; existing = structuredClone(fixture); await fn(); count++; console.log(`PASS ${label}`); }
await check("excluded-country saved order uses historical amount and preserves completion, design and notes", async () => {
  const result = await recoverLegacyPaypalOrder(request);
  assert.deepEqual(result, fixture); assert.deepEqual(existing, fixture);
  assert.deepEqual(verified, [{ id: fixture.paypalOrderId, total: 268, currency: "USD" }]);
});
await check("current client prices, destination and items never overwrite a stored order", async () => {
  assert.deepEqual(await recoverLegacyPaypalOrder({ ...request, country: "US", currency: "JPY", totalJpy: 43000 }), fixture);
});
await check("payment mismatch, unpaid/refunded and uncertain provider responses cannot recover", async () => {
  for (const error of ["PAYPAL_AMOUNT_MISMATCH", "PAYPAL_UNPAID", "PAYPAL_VERIFY"]) {
    providerError = error; await assert.rejects(recoverLegacyPaypalOrder(request), new RegExp(error));
    assert.deepEqual(existing, fixture);
  }
});
await check("email ownership must match before provider verification", async () => {
  await assert.rejects(recoverLegacyPaypalOrder({ ...request, email: "other@example.invalid" }), /PAYPAL_ORDER_REVIEW_REQUIRED/);
  assert.equal(verified.length, 0);
});
await check("unknown excluded-country payment requires support instead of guessed quote or new capture", async () => {
  existing = null; await assert.rejects(recoverLegacyPaypalOrder(request), /PAYPAL_ORDER_REVIEW_REQUIRED/);
  assert.equal(verified.length, 0);
});
await check("active-country unsaved legacy flow can continue through authoritative checkout", async () => {
  existing = null; assert.equal(await recoverLegacyPaypalOrder({ ...request, country: "MX" }), null);
  assert.equal(verified.length, 0);
});
await check("historical Japanese USD order is never converted to yen", async () => {
  existing = { ...fixture, country: "JP" };
  assert.equal((await recoverLegacyPaypalOrder({ ...request, country: "JP" })).currency, "USD");
  assert.equal(verified[0].total, 268); assert.equal(verified[0].currency, "USD");
});
await check("saved JPY facts use integer yen and retain old price versions", async () => {
  existing = { ...fixture, country: "JP", currency: "JPY", totalJpy: 47000, shippingJpy: 6000, priceVersion: "historical" };
  const result = await recoverLegacyPaypalOrder(request);
  assert.equal(verified[0].total, 47000); assert.equal(verified[0].currency, "JPY");
  assert.equal(result.priceVersion, "historical");
});
console.log(`${count} legacy recovery scenarios passed; no real DB, payments, mail or network.`);

// Real orders route + recovery modules; synthetic SQL/orders/provider only.
// Run: node --experimental-vm-modules scripts/legacy-paypal-route-test.mjs
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SourceTextModule, SyntheticModule } from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
globalThis.fetch = async () => { throw Error("OUTBOUND_NETWORK_BLOCKED"); };
const modules = new Map();
let draft, existing, providerError, transferQuote;
let calls;
const unexpected = async () => { throw Error("UNEXPECTED_DEPENDENCY_CALL"); };
const sql = { query: async (query) => {
  if (query.startsWith("create table if not exists paypal_checkout_drafts")) return [];
  if (query.startsWith("select payload")) return draft ? [{ payload: structuredClone(draft) }] : [];
  if (query.startsWith("update paypal_checkout_drafts")) { calls.draftUpdates++; return []; }
  throw Error(`UNEXPECTED_SQL: ${query}`);
} };
const stubs = {
  "@tanstack/react-router": { createFileRoute: () => options => options },
  "admin-shipping-guidance.server": { adminOrderWithGuidance: unexpected },
  "admin-auth.server": { AUTH_HEADERS: {}, assertSession: unexpected },
  "live-proxy.server": { shouldProxyToLive: () => false, proxyToLive: unexpected },
  "catalog.server": { readCatalog: unexpected },
  coupon: { couponRejectReason: unexpected, findCoupon: unexpected },
  db: { getSql: async () => sql },
  "orders.server": {
    countOrdersByEmail: unexpected, findOrderById: unexpected, decideClaim: unexpected,
    deleteCancelledOrders: unexpected, listOrders: unexpected, lookupOrder: unexpected,
    requestClaim: unexpected, updateOrder: unexpected, withdrawClaim: unexpected,
    lookupOrderByPaypalId: async (id, email) => {
      calls.lookup++;
      return existing?.paypalOrderId === id && existing.email.toLowerCase() === email.toLowerCase()
        ? structuredClone(existing) : null;
    },
    placeOrder: async (payload, preserve) => {
      calls.place++;
      assert.equal(preserve, true);
      return { ...structuredClone(payload), id: "TEST-SAVED", status: payload.pay === "transfer" ? "wait" : "paid" };
    },
  },
  "checkout-quote.server": { quoteCheckout: async body => {
    calls.quote++;
    if (body.pay === "paypal") throw Error("LEGACY_PAYMENT_MUST_NOT_BE_REQUOTED");
    return transferQuote;
  } },
  "paypal.server": {
    createPaypalOrder: async () => { calls.create++; throw Error("CREATE_FORBIDDEN"); },
    capturePaypalOrder: async () => { calls.capture++; throw Error("CAPTURE_FORBIDDEN"); },
    verifyPaypalPayment: async (id, total, currency) => {
      calls.verify.push({ id, total, currency });
      if (providerError) throw Error(providerError);
      return { paypalOrderId: id, paypalCaptureId: "TEST-CAPTURE", paypalCurrency: currency, paypalGrossAmount: total };
    },
  },
};
async function load(path) {
  if (modules.has(path)) return modules.get(path);
  let exports = stubs[path] ?? stubs[path.split("/").at(-1).replace(/\.ts$/, "")];
  if (path === "node:crypto") exports = await import(path);
  const module = exports
    ? new SyntheticModule(Object.keys(exports), function () {
        for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
      }, { identifier: path })
    : new SourceTextModule(stripTypeScriptTypes(await readFile(path, "utf8")), { identifier: path });
  modules.set(path, module);
  return module;
}
const routeModule = await load(resolve(root, "src/routes/api/orders.ts"));
await routeModule.link((specifier, referrer) => {
  if (specifier.startsWith("@/")) return load(resolve(root, "src", `${specifier.slice(2)}.ts`));
  if (specifier.startsWith(".")) return load(resolve(dirname(referrer.identifier), `${specifier}.ts`));
  assert.ok(specifier === "@tanstack/react-router" || specifier === "node:crypto", "Unexpected package");
  return load(specifier);
});
await routeModule.evaluate();
const post = async body => {
  const response = await routeModule.namespace.Route.server.handlers.POST({ request: new Request("https://example.invalid/api/orders", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  }) });
  return { status: response.status, body: await response.json() };
};
// Production-era payload: no V17 import-policy version; client values are untrusted.
const legacy = { pay: "paypal", paypalOrderId: "TESTPAYPAL001", email: "buyer@example.invalid",
  country: "US", currency: "USD", totalUsd: 1, shippingUsd: 0, name: "Synthetic Buyer",
  address: "Synthetic address", phone: "old-phone-format", termsVersion: "production-era",
  items: [{ productId: "drone-custom", qty: 1, priceUsd: 1, priceKrw: 0 }],
};
const historical = { ...legacy, id: "TEST-HISTORICAL", country: "JP", totalUsd: 268, shippingUsd: 38,
  status: "done", createdAt: "2026-01-01T00:00:00Z", priceVersion: "HISTORICAL",
  items: [{ productId: "old-model", qty: 1, priceUsd: 230, priceKrw: 0 }],
};
let count = 0;
async function check(label, fn) {
  draft = existing = providerError = transferQuote = null;
  calls = { lookup: 0, quote: 0, place: 0, create: 0, capture: 0, draftUpdates: 0, verify: [] };
  await fn();
  assert.equal(calls.create, 0);
  assert.equal(calls.capture, 0);
  count++;
  console.log(`PASS ${label}`);
}

await check("active-country old captured retry without authoritative records requires review, never a current quote", async () => {
  for (const country of ["US", "MX", "JP"]) {
    assert.deepEqual(await post({ ...legacy, country }), { status: 400, body: { error: "PAYPAL_ORDER_REVIEW_REQUIRED" } });
  }
  assert.equal(calls.lookup, 3);
  assert.equal(calls.quote, 0);
  assert.equal(calls.place, 0);
  assert.equal(calls.draftUpdates, 0);
  assert.deepEqual(calls.verify, []);
});
await check("client-supplied modern prices, policy version or capture ID cannot substitute for a saved specification", async () => {
  const response = await post({ ...legacy, currency: "JPY", totalJpy: 43000, shippingJpy: 6000,
    paypalCaptureId: "CLIENT-CLAIM", importPolicyVersion: "client-claim", termsAccepted: true });
  assert.deepEqual(response, { status: 400, body: { error: "PAYPAL_ORDER_REVIEW_REQUIRED" } });
  assert.equal(calls.quote, 0);
  assert.equal(calls.place, 0);
  assert.deepEqual(calls.verify, []);
});
await check("saved Japanese USD order preserves its historical amount and completion status", async () => {
  existing = structuredClone(historical);
  const response = await post(legacy);
  assert.equal(response.status, 200);
  assert.equal(response.body.order.id, historical.id);
  assert.equal(response.body.order.totalUsd, 268);
  assert.equal(response.body.order.currency, "USD");
  assert.equal(response.body.order.status, "done");
  assert.deepEqual(response.body.order.items, historical.items);
  assert.equal(response.body.order.paypalCaptureId, undefined);
  assert.deepEqual(existing, historical);
  assert.deepEqual(calls.verify, [{ id: legacy.paypalOrderId, total: 268, currency: "USD" }]);
  assert.equal(calls.quote, 0);
  assert.equal(calls.place, 0);
});
await check("saved order ownership and provider failures cannot be bypassed by fallback repricing", async () => {
  existing = structuredClone(historical);
  assert.equal((await post({ ...legacy, email: "other@example.invalid" })).body.error, "PAYPAL_ORDER_REVIEW_REQUIRED");
  assert.deepEqual(calls.verify, []);
  providerError = "PAYPAL_UNPAID";
  assert.equal((await post(legacy)).body.error, "PAYPAL_UNPAID");
  assert.equal(calls.quote, 0);
  assert.equal(calls.place, 0);
});
await check("saved historical USD and JPY drafts recover from their original facts without new capture", async () => {
  for (const currency of ["USD", "JPY"]) {
    draft = { ...historical, status: undefined, currency,
      ...(currency === "JPY" ? { totalJpy: 47000, shippingJpy: 6000, discountJpy: 0,
        items: [{ ...historical.items[0], priceJpy: 41000 }] } : {}),
    };
    const response = await post(legacy);
    assert.equal(response.status, 200);
    assert.equal(response.body.order.currency, currency);
    assert.equal(response.body.order.priceVersion, "HISTORICAL");
    assert.deepEqual(response.body.order.items, draft.items);
    assert.equal(response.body.order.totalUsd, 268);
    if (currency === "JPY") assert.equal(response.body.order.totalJpy, 47000);
  }
  assert.deepEqual(calls.verify, [
    { id: legacy.paypalOrderId, total: 268, currency: "USD" },
    { id: legacy.paypalOrderId, total: 47000, currency: "JPY" },
  ]);
  assert.equal(calls.quote, 0);
  assert.equal(calls.lookup, 0);
  assert.equal(calls.place, 2);
  assert.equal(calls.draftUpdates, 2);
});
await check("new transfer orders still use the authoritative quote path", async () => {
  transferQuote = { ...legacy, pay: "transfer", totalUsd: 335, paypalOrderId: undefined };
  const response = await post({ ...legacy, pay: "transfer" });
  assert.equal(response.status, 200);
  assert.equal(response.body.order.totalUsd, 335);
  assert.equal(response.body.order.status, "wait");
  assert.equal(calls.quote, 1);
  assert.equal(calls.place, 1);
  assert.equal(calls.lookup, 0);
  assert.deepEqual(calls.verify, []);
});
console.log(`${count} route recovery scenarios passed; no live database, payment, email or network.`);

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
let browserFlow = false;
let calls;
const unexpected = async () => { throw Error("UNEXPECTED_DEPENDENCY_CALL"); };
const sql = { query: async (query, args) => {
  if (query.startsWith("insert into paypal_checkout_drafts")) { draft = JSON.parse(args[1]); return []; }
  if (query.startsWith("create table if not exists paypal_checkout_drafts")) return [];
  if (query.startsWith("select payload")) return draft ? [{ payload: structuredClone(draft) }] : [];
  if (query.startsWith("update paypal_checkout_drafts")) { calls.draftUpdates++; return []; }
  throw Error(`UNEXPECTED_SQL: ${query}`);
} };
const stubs = {
  "@tanstack/react-router": { createFileRoute: () => options => options },
  "admin-shipping-guidance.server": { adminOrderWithGuidance: unexpected },
  "admin-auth.server": { AUTH_HEADERS: {}, assertSession: unexpected },
  "request-guard.server": { guardResponse: () => null, limitRequests: () => {}, checkoutBodyLimit: 1024, readBoundedJson: request => request.json() },
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
    assert.equal(payload.checkoutOwnerDigest, undefined);
      return { ...structuredClone(payload), id: "TEST-SAVED", status: payload.pay === "transfer" ? "wait" : "paid" };
    },
  },
  "checkout-quote.server": { quoteCheckout: async body => {
    calls.quote++;
    if (browserFlow && body.pay === "paypal") return structuredClone(historical);
    if (body.pay === "paypal") throw Error("LEGACY_PAYMENT_MUST_NOT_BE_REQUOTED");
    return transferQuote;
  } },
  "paypal.server": {
    paypalPublic: () => ({}),
    createPaypalOrder: async () => { calls.create++; if (browserFlow) return legacy.paypalOrderId; throw Error("CREATE_FORBIDDEN"); },
    capturePaypalOrder: async () => { calls.capture++; if (browserFlow) return; throw Error("CAPTURE_FORBIDDEN"); },
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
const link = (specifier, referrer) => {
  if (specifier.startsWith("@/")) return load(resolve(root, "src", `${specifier.slice(2)}.ts`));
  if (specifier.startsWith(".")) return load(resolve(dirname(referrer.identifier), `${specifier}.ts`));
  assert.ok(specifier === "@tanstack/react-router" || specifier === "node:crypto", "Unexpected package");
  return load(specifier);
};
await routeModule.link(link);
await routeModule.evaluate();
const paypalModule = await load(resolve(root, "src/routes/api/paypal.ts"));
await paypalModule.link(link);
await paypalModule.evaluate();
const paymentRequest = async (body, cookie = "") => paypalModule.namespace.Route.server.handlers.POST({
  request: new Request("https://example.invalid/api/paypal", {
    method: "POST", headers: { "Content-Type": "application/json", cookie }, body: JSON.stringify(body),
  }),
});
const post = async (body, cookie = "") => {
  const response = await routeModule.namespace.Route.server.handlers.POST({ request: new Request("https://example.invalid/api/orders", {
    method: "POST", headers: { "Content-Type": "application/json", cookie }, body: JSON.stringify(body),
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
async function check(label, fn, { creates = 0, captures = 0 } = {}) {
  draft = existing = providerError = transferQuote = null;
  calls = { lookup: 0, quote: 0, place: 0, create: 0, capture: 0, draftUpdates: 0, verify: [] };
  await fn();
  assert.equal(calls.create, creates);
  assert.equal(calls.capture, captures);
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
  assert.deepEqual(response.body.order, { id: historical.id, email: legacy.email });
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
    assert.deepEqual(response.body.order, { id: "TEST-SAVED", email: legacy.email });
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
await check("a browser-bound draft only returns a receipt to the browser that opened it", async () => {
  const { createHash } = await import("node:crypto");
  const proof = "a".repeat(64);
  draft = { ...historical, checkoutOwnerDigest: createHash("sha256").update(proof).digest("hex") };
  const cookie = `__Host-jk-pay-${legacy.paypalOrderId}=${proof}`;
  for (const unavailable of ["", `__Host-jk-pay-OTHER=${proof}`, `__Host-jk-pay-${legacy.paypalOrderId}=confirm`]) {
    assert.equal((await post(legacy, unavailable)).body.error, "CHECKOUT_OWNER_REQUIRED");
  }
  assert.deepEqual(calls.verify, []);
  assert.equal(calls.place, 0);
  assert.equal(calls.lookup, 0);
  const response = await post(legacy, `other=abc; ${cookie}; __Host-jk-pay-SECOND=else`);
  assert.deepEqual(response.body.order, { id: "TEST-SAVED", email: legacy.email });
});
await check("pre-upgrade draft retry still checks the original checkout email", async () => {
  draft = { ...historical };
  assert.equal((await post({ ...legacy, email: "elsewhere@example.invalid" })).body.error, "CHECKOUT_OWNER_REQUIRED");
  assert.deepEqual(calls.verify, []);
  assert.equal(calls.place, 0);
});
await check("new SDK creation, approval and receipt work with an HttpOnly cookie", async () => {
  browserFlow = true;
  const opened = await paymentRequest({ action: "create", order: legacy, value: "268" });
  assert.deepEqual(await opened.json(), { id: legacy.paypalOrderId });
  const issued = opened.headers.get("set-cookie");
  assert.match(issued, /; Secure; HttpOnly; SameSite=Lax/);
  const cookie = issued.split(";")[0];
  const approve = { action: "capture", orderID: legacy.paypalOrderId, receiptOnly: true };
  assert.equal((await paymentRequest(approve)).status, 400);
  assert.deepEqual(await (await paymentRequest(approve, cookie)).json(), { order: { id: "TEST-SAVED" }, status: "COMPLETED" });
  assert.deepEqual((await post(legacy, cookie)).body.order, { id: "TEST-SAVED", email: legacy.email });
  browserFlow = false;
}, { creates: 1, captures: 1 });
await check("already-open old SDK can complete its own in-flight approval across deployment", async () => {
  browserFlow = true;
  draft = structuredClone(historical);
  const confirm = await paymentRequest({ action: "capture", orderID: legacy.paypalOrderId });
  const cookie = confirm.headers.get("set-cookie").split(";")[0];
  assert.deepEqual(await confirm.json(), { status: "CONFIRM_CHECKOUT" });
  assert.equal(calls.capture, 0);
  assert.equal((await post({ ...legacy, phone: "" }, cookie)).body.error, "CHECKOUT_OWNER_REQUIRED");
  assert.equal(calls.capture, 0);
  assert.deepEqual((await post(legacy, cookie)).body.order, { id: "TEST-SAVED", email: legacy.email });
  browserFlow = false;
}, { captures: 1 });
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

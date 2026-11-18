// Isolated localization/checkout contract checks. No real orders, payment, mail or network.
import assert from "node:assert/strict";
import { createServer } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  throw new Error("OUTBOUND_NETWORK_BLOCKED");
};
const server = await createServer({
  configFile: false,
  root,
  resolve: { alias: { "@": resolve(root, "src") } },
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const { LOCALES } = await server.ssrLoadModule("/src/lib/i18n.ts");
  const { customerOrderCopy } = await server.ssrLoadModule("/src/lib/customer-order-copy.ts");
  const { checkoutCopy } = await server.ssrLoadModule("/src/lib/checkout-copy.ts");
  const { checkoutEnhancementsCopy } = await server.ssrLoadModule("/src/lib/checkout-enhancements-copy.ts");
  const { customerOrderDetailCopy } = await server.ssrLoadModule("/src/lib/customer-order-detail-copy.ts");
  const { customerOptionLabel } = await server.ssrLoadModule("/src/lib/customer-order-view.ts");
  const { formatCartSize } = await server.ssrLoadModule("/src/lib/store.ts");
  const expectedStatuses = [
    "wait",
    "paid",
    "ready",
    "shipped",
    "done",
    "confirmed",
    "cancel",
    "return",
    "exchange",
  ].sort();
  const referenceKeys = Object.keys(customerOrderCopy("en")).sort();
  for (const { id } of LOCALES) {
    const customer = customerOrderCopy(id);
    assert.deepEqual(
      Object.keys(customer).sort(),
      referenceKeys,
      `${id}: missing customer instructions`,
    );
    assert.deepEqual(
      Object.keys(customer.statuses).sort(),
      expectedStatuses,
      `${id}: missing existing order status`,
    );
    assert.deepEqual(
      Object.keys(customer.claimStatuses).sort(),
      ["accepted", "cancelled", "rejected", "requested"],
      `${id}: missing claim history label`,
    );
    const visit = (value) => {
      if (typeof value === "object") return Object.values(value).forEach(visit);
      assert.equal(typeof value, "string");
      assert.ok(value.trim(), `${id}: empty translation`);
      if (id !== "ko") assert.ok(!/[가-힣]/u.test(value), `${id}: Korean customer label leaked`);
    };
    visit(customer);
    const checkout = checkoutCopy(id);
    assert.equal(checkout.instagram, customer.instagramRecommended);
    assert.equal(checkout.contactHelp, checkoutEnhancementsCopy(id).contactManual);
    assert.ok(checkout.shipping && checkout.duty && checkout.usDuty && checkout.agree);
    visit(checkout);
    const detail = customerOrderDetailCopy(id);
    visit(detail);
    for (const fit of ["men", "women"]) {
      assert.equal(formatCartSize({productId:"drone-custom",qty:1,size:"265",sizeFit:fit},id), `265 mm (${detail[fit]})`);
    }
    const model = customerOptionLabel("CUSTOM / 001 · 장목", id);
    assert.ok(model.startsWith("CUSTOM / 001 · "), "untranslated merchant SKU must be preserved");
    if (id !== "ko") assert.ok(!/[가-힣]/u.test(model), `${id}: saved model label leaked Korean`);
    const options = customerOptionLabel("블랙 / 바이퍼두건 타올타입(면) · 중목", id);
    if (id !== "ko") assert.doesNotMatch(options, /[가-힣]/u, `${id}: known catalog option leaked Korean`);
    assert.doesNotMatch(customer.domesticRedirect, /USD/, `${id}: Japan must not be promised USD checkout`);
    console.log(`PASS ${id}: guest lookup, all statuses, contact, confirmation and checkout copy`);
  }
  const en = customerOrderCopy("en");
  assert.deepEqual(customerOrderCopy("unrecognized"), en);
  assert.match(en.instagramNext, /@jidokaan/);
  assert.match(en.successBody, /order number/i);
  assert.doesNotMatch(en.successBody, /will email|we.ll email|email.*sent/i);
  assert.equal(formatCartSize({productId:"drone-custom",qty:1,size:"240 (여성)"},"ja"), "240 mm (レディース)");
  assert.equal(formatCartSize({productId:"drone-custom",qty:1,size:"265 mm"},"en"), "265 mm");
  assert.equal(customerOptionLabel("Merchant original / custom text", "ja"), "Merchant original / custom text");
  console.log(
    `PASS ${LOCALES.length} locales; no automatic email delivery promise or Korean status leakage`,
  );
} finally {
  await server.close();
  globalThis.fetch = originalFetch;
}

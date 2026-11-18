// Isolated in-memory storage only. No browser, customer records, DB or network.
// Run: node --experimental-vm-modules scripts/checkout-draft-test.mjs
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SourceTextModule } from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
globalThis.fetch = async () => { throw Error("OUTBOUND_NETWORK_BLOCKED"); };
const modules = new Map();
async function load(path) {
  if (modules.has(path)) return modules.get(path);
  const module = new SourceTextModule(stripTypeScriptTypes(await readFile(path, "utf8")), { identifier: path });
  modules.set(path, module);
  return module;
}
const module = await load(resolve(root, "src/lib/checkout-draft.ts"));
await module.link((specifier, referrer) => {
  assert.ok(specifier.startsWith("."), "Draft persistence must not need an external service or package");
  return load(resolve(dirname(referrer.identifier), `${specifier}.ts`));
});
await module.evaluate();
const { CHECKOUT_DRAFT_KEY, LEGACY_CHECKOUT_PROFILE_KEY, normalizeCheckoutRegion,
  readCheckoutDraft, readLegacyCheckoutProfile, writeCheckoutDraft, clearCheckoutDraft } = module.namespace;

function storage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
}
let count = 0;
async function check(label, fn) {
  await fn();
  count++;
  console.log(`PASS ${label}`);
}

await check("contact/address drafts round-trip non-Latin text and multiline addresses unchanged", () => {
  const draft = {
    instagram: "synthetic_buyer", contactMethod: "email", email: "test@example.invalid",
    firstName: "김太郎", lastName: "ณัฐ", phone: "+819012345678", phoneCountry: "JP",
    address: "東京都千代田区\n架空ビル １２階", address2: "문 앞 · unité 7",
    city: "東京", region: "東京都", postal: "100-0001", country: "JP", depositor: "김太郎",
  };
  const memory = storage();
  writeCheckoutDraft(memory, draft);
  assert.deepEqual(readCheckoutDraft(memory, "JP"), draft);
  assert.equal(CHECKOUT_DRAFT_KEY, "jidokaan-checkout-draft-v1");
});

await check("cleared fields and an empty draft replace old values instead of restoring stale contact details", () => {
  const memory = storage();
  writeCheckoutDraft(memory, { email: "old@example.invalid", address: "Old address", phone: "+12025550123" });
  writeCheckoutDraft(memory, { email: "", address: "", phone: "", contactMethod: "instagram" });
  assert.deepEqual(readCheckoutDraft(memory, "US"), { email: "", address: "", phone: "", contactMethod: "instagram" });
  writeCheckoutDraft(memory, {});
  assert.deepEqual(readCheckoutDraft(memory, "US"), {});
  clearCheckoutDraft(memory);
  assert.equal(readCheckoutDraft(memory, "US"), null);
});

await check("US and Canadian full-name profiles normalize to select values without changing unknown regions", () => {
  for (const [country, value, expected] of [
    ["US", "California", "CA"], ["us", " california ", "CA"], [" US ", "cA", "CA"],
    ["US", "NEW YORK", "NY"], ["CA", "Ontario", "ON"], ["ca", " oN ", "ON"],
    ["CA", "BRITISH COLUMBIA", "BC"], ["CA", "Newfoundland and Labrador", "NL"],
    ["JP", "東京都", "東京都"], ["KR", "서울", "서울"], ["US", "Unknown region", "Unknown region"],
  ]) assert.equal(normalizeCheckoutRegion(country, value), expected, `${country}: ${value}`);

  const memory = storage();
  memory.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify({ country: "US", region: "California" }));
  assert.deepEqual(readCheckoutDraft(memory, "US"), { country: "US", region: "CA" });
  memory.setItem(LEGACY_CHECKOUT_PROFILE_KEY, JSON.stringify({ country: "CA", region: "Ontario" }));
  assert.deepEqual(readLegacyCheckoutProfile(memory, "CA"), { country: "CA", region: "ON" });
});

await check("saved country is passive metadata and reads normalize regions only for the current destination", () => {
  for (const savedCountry of ["KR", "US", "JP"]) {
    const memory = storage();
    memory.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify({ country: savedCountry, region: "Ontario", phoneCountry: "KR" }));
    const before = memory.getItem(CHECKOUT_DRAFT_KEY);
    assert.deepEqual(readCheckoutDraft(memory, "CA"), { country: savedCountry, region: "ON", phoneCountry: "KR" });
    assert.deepEqual(readCheckoutDraft(memory, "JP"), { country: savedCountry, region: "Ontario", phoneCountry: "KR" });
    assert.equal(memory.getItem(CHECKOUT_DRAFT_KEY), before, "Reading must not rewrite saved metadata");
  }
});

await check("sensitive and unrelated fields never survive a write or a legacy-profile read", () => {
  const unsafe = {
    email: "test@example.invalid", address: "Synthetic address", contactMethod: "email",
    password: "PASSWORD-MARKER", token: "TOKEN-MARKER", cardNumber: "CARD-MARKER",
    paypalOrderId: "PAYMENT-MARKER", paypalCaptureId: "CAPTURE-MARKER", accessToken: "ACCESS-MARKER",
    termsAccepted: true, termsVersion: "CONSENT-MARKER", acknowledgedTerms: { agree: "private" },
    couponCode: "COUPON-MARKER", discountUsd: 10, cart: [{ productId: "private" }],
  };
  const safe = { email: unsafe.email, address: unsafe.address, contactMethod: "email" };
  const memory = storage();
  writeCheckoutDraft(memory, unsafe);
  assert.deepEqual(readCheckoutDraft(memory, "US"), safe);
  assert.doesNotMatch(memory.getItem(CHECKOUT_DRAFT_KEY), /MARKER|password|token|cardNumber|paypal|terms|coupon|discount|cart/i);
  memory.setItem(LEGACY_CHECKOUT_PROFILE_KEY, JSON.stringify(unsafe));
  assert.deepEqual(readLegacyCheckoutProfile(memory, "US"), safe);
});

await check("invalid JSON, non-object payloads and wrong field types are handled without poisoning usable fields", () => {
  const memory = storage();
  for (const raw of ["{broken", "null", "[]", "true", "123", '"text"']) {
    memory.setItem(CHECKOUT_DRAFT_KEY, raw);
    assert.equal(readCheckoutDraft(memory, "US"), null, raw);
  }
  const bad = { email: [], firstName: 123, phone: null, address: { line: "private" },
    contactMethod: "sms", country: false, region: ["CA"], lastName: "Valid name" };
  memory.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(bad));
  assert.deepEqual(readCheckoutDraft(memory, "US"), { lastName: "Valid name" });
  writeCheckoutDraft(memory, bad);
  assert.deepEqual(readCheckoutDraft(memory, "US"), { lastName: "Valid name" });
});

await check("unavailable or full storage never interrupts checkout and clearing only removes the draft key", () => {
  const blocked = {
    getItem: () => { throw Error("STORAGE_DISABLED"); },
    setItem: () => { throw Error("QUOTA_EXCEEDED"); },
    removeItem: () => { throw Error("STORAGE_DISABLED"); },
  };
  assert.equal(readCheckoutDraft(blocked, "JP"), null);
  assert.equal(readLegacyCheckoutProfile(blocked, "JP"), null);
  assert.doesNotThrow(() => writeCheckoutDraft(blocked, { email: "test@example.invalid" }));
  assert.doesNotThrow(() => clearCheckoutDraft(blocked));
  const memory = storage();
  memory.setItem("unrelated-setting", "retain-me");
  memory.setItem(LEGACY_CHECKOUT_PROFILE_KEY, '{"email":"legacy@example.invalid"}');
  writeCheckoutDraft(memory, { email: "draft@example.invalid" });
  clearCheckoutDraft(memory);
  assert.equal(memory.getItem("unrelated-setting"), "retain-me");
  assert.equal(memory.getItem(LEGACY_CHECKOUT_PROFILE_KEY), '{"email":"legacy@example.invalid"}');
  assert.equal(readCheckoutDraft(memory, "JP"), null);
});

console.log(`${count} isolated checkout draft scenarios passed; no browser, DB or outbound requests.`);

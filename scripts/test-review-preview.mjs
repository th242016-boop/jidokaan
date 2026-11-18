import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/lib/review-preview.ts", import.meta.url), "utf8");
let forwarded = 0;
const nativeFetch = async () => {forwarded++; return new Response("asset");};
globalThis.location = new URL("https://review.example/checkout");
globalThis.window = {fetch: nativeFetch};
globalThis.document = {addEventListener() {}};
Object.defineProperty(globalThis, "navigator", {configurable:true,value:{sendBeacon:()=>true}});
async function load(flag) {
  const js = ts.transpileModule(source.replace("import.meta.env.VITE_REVIEW_PREVIEW", JSON.stringify(flag)), {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
}
const production = await load("false");
assert.equal(window.fetch, nativeFetch, "Production fetch must remain unchanged");
assert.equal(production.REVIEW_ORDER_ID, "", "Production has no demo order identifier");
assert.equal(production.REVIEW_EMAIL, "", "Production has no demo contact");
assert.equal(production.REVIEW_DEMO_ORDER, null, "Production has no synthetic order");
assert.throws(() => production.getReviewOrder(), /REVIEW_PREVIEW_DISABLED/);
const preview = await load("true");
for (const [url, method] of [["/api/paypal/create", "POST"], ["/api/orders", "POST"], ["/api/auth/get-session", "GET"], ["/api/analytics", "POST"], ["https://jidokaan.com/api/orders", "GET"], ["https://paypal.com/example.js", "GET"], ["/api/private.json", "GET"]]) {
  const response = await window.fetch(url, {method});
  assert.equal(response.status, 403, `${method} ${url} must be blocked`);
}
assert.equal(forwarded, 0, "No API or cross-origin request may leave preview");
assert.equal(navigator.sendBeacon("/api/analytics", "x"), false);
const valid = await window.fetch(`/api/orders?id=${preview.REVIEW_ORDER_ID}&email=${preview.REVIEW_EMAIL}`);
assert.equal(valid.status, 200);
assert.equal((await valid.json()).order.id, "PREVIEW-ONLY-001");
assert.equal((await window.fetch(`/api/orders?id=${preview.REVIEW_ORDER_ID}&email=someone@example.com`)).status, 404);
const lookup = (id, email) => window.fetch("/api/orders", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({action:"lookup",id,email})});
assert.equal((await lookup(preview.REVIEW_ORDER_ID, preview.REVIEW_EMAIL)).status, 200);
assert.equal((await lookup("WRONG-ORDER", preview.REVIEW_EMAIL)).status, 404);
assert.equal((await lookup(preview.REVIEW_ORDER_ID, "wrong@example.invalid")).status, 404);
assert.equal(forwarded, 0, "Synthetic POST lookup never forwards to a server");
assert.equal((await window.fetch("/homepage/assets/white-gold.webp")).status, 200);
assert.equal(forwarded, 1, "Only static same-origin asset fetch may be forwarded");
console.log("Preview isolation: production unchanged; 7 network blocks, synthetic lookup match/mismatch, beacon block and asset access passed.");

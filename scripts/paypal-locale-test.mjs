// Fake DOM only. Never fetch or execute PayPal SDK, create orders, or capture payments.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
globalThis.fetch = async () => { throw Error("OUTBOUND_NETWORK_BLOCKED"); };
const code = stripTypeScriptTypes(await readFile(new URL("../src/lib/paypal-sdk.ts", import.meta.url), "utf8"));
const {loadPaypalSdk,paypalLocale,paypalLocaleNotice} = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
const scripts = [];
const win = {paypal: {Buttons() {throw Error("STALE_GLOBAL_MUST_NOT_BE_USED");}}};
const doc = {
  createElement(type) {
    assert.equal(type,"script");
    return { attributes:{}, setAttribute(name,value) {this.attributes[name]=value;}, remove() {this.removed=true;} };
  },
  body: {appendChild(script) {scripts.push(script);}},
};
const env = {window:win,document:doc,timeoutMs:1000};
const finish = (script,label) => {
  const api={label,Buttons(){return {render:async()=>{}};}};
  win[script.attributes["data-namespace"]]=api;
  script.onload();
  return api;
};
let count=0;
async function check(name,fn) {await fn();count++;console.log(`PASS ${name}`);}
await check("13 documented languages map explicitly; unsupported Hindi/Uzbek explain English fallback",()=>{
  for(const [locale,expected] of Object.entries({en:"en_US",ko:"ko_KR",ja:"ja_JP",zh:"zh_CN",es:"es_ES",fr:"fr_FR",de:"de_DE",it:"it_IT",pt:"pt_BR",ru:"ru_RU",tr:"tr_TR",th:"th_TH",tl:"tl_PH"})) {
    assert.equal(paypalLocale(locale),expected);assert.equal(paypalLocaleNotice(locale),"");
  }
  for(const locale of ["hi","uz"]){assert.equal(paypalLocale(locale),"en_US");assert.ok(paypalLocaleNotice(locale));}
});
await check("duplicate locale requests share one script; legacy English global is ignored",async()=>{
  const one=loadPaypalSdk("TEST-ONLY&client", "ja", env);
  const two=loadPaypalSdk("TEST-ONLY&client", "ja", env);
  assert.equal(one,two);assert.equal(scripts.length,1);
  const script=scripts.at(-1),url=new URL(script.src);
  assert.equal(url.origin,"https://www.paypal.com");assert.equal(url.pathname,"/sdk/js");
  assert.equal(url.searchParams.get("client-id"),"TEST-ONLY&client");
  assert.equal(url.searchParams.get("locale"),"ja_JP");assert.equal(url.searchParams.get("currency"),"USD");
  assert.equal(url.searchParams.has("buyer-country"),false);
  const api=finish(script,"ja");assert.equal(await one,api);assert.equal(await two,api);
});
await check("out-of-order language loads resolve isolated namespaces; merchant config cannot reuse stale SDK",async()=>{
  const fr=loadPaypalSdk("TEST-ONLY&client","fr",env),frScript=scripts.at(-1);
  const ko=loadPaypalSdk("TEST-ONLY&client","ko",env),koScript=scripts.at(-1);
  assert.notEqual(frScript.attributes["data-namespace"],koScript.attributes["data-namespace"]);
  const koApi=finish(koScript,"ko");const frApi=finish(frScript,"fr");
  assert.equal(await ko,koApi);assert.equal(await fr,frApi);
  const other=loadPaypalSdk("OTHER-TEST-CLIENT","fr",env),otherScript=scripts.at(-1);
  assert.notEqual(otherScript.attributes["data-namespace"],frScript.attributes["data-namespace"]);
  const otherApi=finish(otherScript,"other-client");assert.equal(await other,otherApi);
});
await check("JPY and USD use independent SDK instances, even when country changes under the same language",async()=>{
  const usd=loadPaypalSdk("CURRENCY-TEST","en",env,"USD"),usdScript=scripts.at(-1);
  const jpy=loadPaypalSdk("CURRENCY-TEST","en",env,"JPY"),jpyScript=scripts.at(-1);
  assert.notEqual(usd,jpy);
  assert.notEqual(usdScript.attributes["data-namespace"],jpyScript.attributes["data-namespace"]);
  assert.equal(new URL(jpyScript.src).searchParams.get("currency"),"JPY");
  assert.equal(new URL(jpyScript.src).searchParams.get("locale"),"en_US");
  const yenApi=finish(jpyScript,"yen");const dollarApi=finish(usdScript,"dollar");
  assert.equal(await jpy,yenApi);assert.equal(await usd,dollarApi);
  assert.equal(loadPaypalSdk("CURRENCY-TEST","en",env,"JPY"),jpy);
  assert.equal(loadPaypalSdk("CURRENCY-TEST","en",env,"USD"),usd);
});
await check("load errors evict failed cache entry and permit clean retry",async()=>{
  const failed=loadPaypalSdk("ERROR-TEST","en",env),script=scripts.at(-1);
  script.onerror();await assert.rejects(failed,/PAYPAL_SDK_UNAVAILABLE/);assert.equal(script.removed,true);
  const retry=loadPaypalSdk("ERROR-TEST","en",env),next=scripts.at(-1);
  assert.notEqual(next.attributes["data-namespace"],script.attributes["data-namespace"]);
  const api=finish(next,"retry");assert.equal(await retry,api);
});
await check("timeout and missing namespace fail closed without accepting window.paypal",async()=>{
  const timeout=loadPaypalSdk("TIMEOUT-TEST","en",{...env,timeoutMs:5});
  await assert.rejects(timeout,/PAYPAL_SDK_UNAVAILABLE/);
  const missing=loadPaypalSdk("MISSING-TEST","en",env);scripts.at(-1).onload();
  await assert.rejects(missing,/PAYPAL_SDK_UNAVAILABLE/);
});
console.log(`${count} PayPal locale/loader checks passed; no external SDK or payment calls.`);

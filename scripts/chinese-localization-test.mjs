// Chinese purchasing and locale preservation regression; no network/payment/customer data.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => { throw new Error('OUTBOUND_NETWORK_BLOCKED'); };
const server = await createServer({configFile:false,root,resolve:{alias:{'@':resolve(root,'src')}},server:{middlewareMode:true},appType:'custom'});
try {
 const {LOCALES,DICT,COUNTRIES,countryName,detectVisitorMarketFrom,HTML_LANG} = await server.ssrLoadModule('/src/lib/i18n.ts');
 const {requestedLocale} = await server.ssrLoadModule('/src/lib/locale-preference.ts');
 const {CHECKOUT_COPY,checkoutCopy} = await server.ssrLoadModule('/src/lib/checkout-copy.ts');
 const {countryImportExtraCopy} = await server.ssrLoadModule('/src/lib/country-import-extra-copy.ts');
 const {paypalLocale} = await server.ssrLoadModule('/src/lib/paypal-sdk.ts');
 const {customerOrderCopy} = await server.ssrLoadModule('/src/lib/customer-order-copy.ts');
 assert.ok(LOCALES.some(x=>x.id==='zh-Hant'));
 for(const tag of ['zh-HK','zh_TW','zh-Hant','zh-Hant-HK','zh-MO']) {
  assert.equal(requestedLocale(tag),'zh-Hant');
  assert.equal(detectVisitorMarketFrom(tag,'Asia/Shanghai').locale,'zh-Hant');
 }
 assert.equal(requestedLocale('zh-CN'),'zh');
 assert.equal(requestedLocale('zh-Hans'),'zh');
 assert.equal(detectVisitorMarketFrom('zh-CN','Asia/Hong_Kong').locale,'zh');
 assert.equal(detectVisitorMarketFrom('en-GB','Asia/Hong_Kong').locale,'en');
 assert.equal(HTML_LANG['zh-Hant'],'zh-Hant');
 assert.equal(paypalLocale('zh-Hant'),'zh_HK');
 const allowed = new Set(['brand','brandEn','domain','checkout.payKakao','checkout.payNaver','checkout.payPaypal','footer.instagram','login.kakao','login.naver']);
 function assertNoEnglishFallback(en,copy,path='') {
  for(const key in en) {
   const field=path+key;
   if(typeof en[key]==='string'&&/[a-zA-Z]{3}/.test(en[key])&&!allowed.has(field))assert.notEqual(copy[key],en[key],field+' English fallback');
   else if(en[key]&&typeof en[key]==='object')assertNoEnglishFallback(en[key],copy[key],field+'.');
  }
 }
 for(const locale of ['zh','zh-Hant']) {
  assertNoEnglishFallback(DICT.en,DICT[locale]);
  assert.ok(Object.hasOwn(CHECKOUT_COPY,locale),'server quote accepts locale');
  for(const code of ['KR','US','CA','AU','CN','HK','JP','SG','TH','PH','GB','CH','MX']) {
   const label=countryName(COUNTRIES.find(x=>x.code===code),locale);
   assert.match(label,/\p{Script=Han}/u,code+' localized country name');
  }
  assert.notEqual(customerOrderCopy(locale).lookupTitle,customerOrderCopy('en').lookupTitle);
 }
 assert.match(checkoutCopy('zh').shipping,/订单/);
 assert.match(checkoutCopy('zh-Hant').shipping,/訂單/);
 assert.match(checkoutCopy('zh-Hant').contactHelp,/私訊/);
 assert.doesNotMatch(checkoutCopy('zh-Hant').usDuty,/发货|关税|订单/);
 assert.equal(countryImportExtraCopy('zh-Hant').locale,'zh-Hant');
 assert.equal(countryImportExtraCopy('zh-HK').locale,'zh-Hant');
 assert.match(countryImportExtraCopy('zh-Hant').copy.hongKong,/聯絡|進口/);
 console.log('PASS Chinese/Traditional Chinese country names, all dictionary fallback checks, locale aliases, destination independence, server locale, PayPal and checkout copy');
} finally { globalThis.fetch=originalFetch;await server.close(); }

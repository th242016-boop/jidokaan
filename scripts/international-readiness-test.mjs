// Run: node --experimental-vm-modules scripts/international-readiness-test.mjs
// Real quote, phone, address, locale, design and shipping modules. Synthetic catalog;
// database/payment providers are not imported, and all network requests are blocked.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SourceTextModule, SyntheticModule } from "node:vm";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
globalThis.fetch = async () => { throw Error("OUTBOUND_NETWORK_BLOCKED"); };
const modules = new Map();
let catalog;
const stubs = {
  "catalog.server": {readCatalog:async()=>catalog,isBlockedEmail:async()=>false},
  "orders.server": {countOrdersByEmail:async()=>0},
};
async function synthetic(id,exports) {
  const module = new SyntheticModule(Object.keys(exports),function(){for(const [name,value] of Object.entries(exports)) this.setExport(name,value);},{identifier:id});
  modules.set(id,module);await module.link(()=>{throw Error("UNEXPECTED_SYNTHETIC_IMPORT");});return module;
}
async function load(path) {
  if(modules.has(path))return modules.get(path);
  if(path==="libphonenumber-js/max")return synthetic(path,await import(path));
  const key=path.split("/").at(-1).replace(/\.ts$/,"");
  if(stubs[key])return synthetic(path,stubs[key]);
  const module=new SourceTextModule(stripTypeScriptTypes(await readFile(path,"utf8")),{identifier:path});
  modules.set(path,module);
  await module.link(specifier=>{
    if(specifier==="libphonenumber-js/max")return load(specifier);
    if(!specifier.startsWith("."))throw Error(`UNEXPECTED_DEPENDENCY:${specifier}`);
    return load(resolve(dirname(path),`${specifier}.ts`));
  });
  return module;
}
async function api(name){const module=await load(resolve(root,"src/lib",`${name}.ts`));if(module.status!=="evaluated")await module.evaluate();return module.namespace;}
const shipping=await api("shipping"), rates=await api("ems-rates"), rules=await api("country-import-policy");
const terms=await api("design-order"), quoteApi=await api("checkout-quote.server");
const copyApi=await api("checkout-copy");
const addressApi=await api("address-validation"), phoneApi=await api("phone");
const baseProduct={name:{ko:"TEST ONLY",en:"TEST ONLY"},priceUsd:25000,priceKrw:288000,inStock:true,visible:true,customizable:false};
catalog={shipping:shipping.DEFAULT_SHIPPING,coupons:[],products:[
  {...baseProduct,id:"test-shoe",category:"custom"},
  {...baseProduct,id:"test-accessory",category:"gear",priceUsd:2500,priceKrw:30000},
  {...baseProduct,id:"test-custom",category:"custom",customizable:true},
]};
const postcodes={US:"10001",CA:"K1A 0B1",AU:"2000",CN:"100000",HK:"",JP:"100-0001",SG:"018956",TH:"10100",PH:"1000",FR:"75001",DE:"10115",GB:"SW1A 1AA",ES:"28001",RU:"101000",BR:"01001-000",MX:"06000",AR:"C1000ABC",EG:"11511",AE:"",SA:"12345",UZ:"100000",TR:"34000",CH:"8001",NL:"1012 AB",SE:"111 22",IN:"110001",IT:"00100",ZA:"0001"};
const makeInput=(country="US",patch={})=>({
  country,pay:"paypal",email:"buyer@example.invalid",name:"Synthetic Buyer",phone:country==="CN"?"+8613812345678":"+12025550123",
  address:"Test Road 7",city:"Test City",region:country==="US"?"NY":country==="CA"?"ON":"TEST REGION",postal:postcodes[country]??"00000",
  contactMethod:"email",termsAccepted:true,termsVersion:terms.ORDER_TERMS_VERSION,importPolicyVersion:rules.IMPORT_POLICY_VERSION,
  checkoutLocale:"en",items:[{productId:"test-shoe",qty:1}],...patch,
});
const quote=(country,patch)=>quoteApi.quoteCheckout(makeInput(country,patch));
let count=0;
async function check(label,fn){await fn();count++;console.log(`PASS ${label}`);}
const excluded=new Set(["EG","SA","BR","IN","DE","NL","SE","TR","RU","UZ","AR","AE","FR","ES","CN"]);
await check("26 historical tariffs preserve 11 active foreign destinations and exclude 15 from new sales",async()=>{
  const countries=Object.keys(rates.EMS_RATES_KRW);assert.equal(countries.length,26);
  for(const country of countries){
    const policy=rules.countryImportPolicy(country,true);
    assert.equal(policy.salesAvailable,!excluded.has(country),country);
    assert.equal(policy.consultationRequired,false,country);
    if(excluded.has(country)){
      for(const pay of ["paypal","transfer"])await assert.rejects(quote(country,{pay}),/DESTINATION_SALES_UNAVAILABLE/,`${country}/${pay}`);
    }else{
      const result=await quote(country);
      assert.equal(result.country,country);assert.equal(result.currency,"USD");assert.ok(result.shippingUsd>0,country);
      assert.equal(result.totalUsd,250+result.shippingUsd,country);
      assert.equal(result.acknowledgedTerms.destination,rules.countryImportNotice(country,"en",true),`${country} saved destination notice`);
    }
  }
});
await check("excluded destinations reject accessories and mixed baskets as well as footwear",async()=>{
  for(const country of excluded){
    assert.equal(rules.countryImportPolicy(country,false).salesAvailable,false);
    for(const items of [[{productId:"test-accessory",qty:1}],[{productId:"test-shoe",qty:1},{productId:"test-accessory",qty:1}]]){
      for(const pay of ["paypal","transfer"])await assert.rejects(quote(country,{items,pay}),/DESTINATION_SALES_UNAVAILABLE/,`${country}/${pay}`);
    }
  }
});
await check("US $335, HK $281 and Mexico $310 stay authoritative; 2 pairs use separate boxes",async()=>{
  const us=await quote("US"), hk=await quote("HK"), mx=await quote("MX");
  assert.equal(us.shippingUsd,85);assert.equal(us.totalUsd,335);assert.equal(us.dutyTerms,"PREPAID_BEFORE_DISPATCH");
  assert.equal(hk.shippingUsd,31);assert.equal(hk.totalUsd,281);assert.equal(hk.postal,"");
  assert.equal(hk.dutyTerms,"DESTINATION_RULES");
  assert.equal(mx.shippingUsd,60);assert.equal(mx.totalUsd,310);assert.equal(mx.dutyTerms,"DESTINATION_RULES");
  assert.equal(rules.countryImportPolicy("MX").consultationRequired,false);
  const two=await quote("US",{items:[{productId:"test-shoe",qty:2}]});assert.equal(two.shippingUsd,170);assert.equal(two.totalUsd,670);
  const twoHk=await quote("HK",{items:[{productId:"test-shoe",qty:2}]});assert.equal(twoHk.shippingUsd,62);assert.equal(twoHk.totalUsd,562);
  const twoMx=await quote("MX",{items:[{productId:"test-shoe",qty:2}]});assert.equal(twoMx.shippingUsd,120);assert.equal(twoMx.totalUsd,620);
});
await check("Mexico fixed freight overrides stored rates and minimums without changing other countries or historical cost",()=>{
  for(const rate of [{krw:87500,usd:77},{krw:87500,usd:120,minimumUsd:120},{usd:1,minimumUsd:999},undefined]){
    const settings=structuredClone(shipping.DEFAULT_SHIPPING);
    if(rate)settings.countryRates.MX=rate;else delete settings.countryRates.MX;
    const before=structuredClone(settings), normalized=shipping.applyEmsPolicy(settings);
    assert.deepEqual(settings,before,"normalization must not mutate saved settings");
    assert.equal(normalized.countryRates.MX.usd,60);
    assert.equal(normalized.countryRates.MX.krw,87500);
    assert.equal(normalized.countryRates.MX.minimumUsd,undefined);
    for(const [country,saved] of Object.entries(settings.countryRates))if(country!=="MX")assert.deepEqual(normalized.countryRates[country],saved,country);
    assert.deepEqual(shipping.applyEmsPolicy(normalized),normalized,"normalization is idempotent");
    assert.equal(shipping.quoteShipping({country:"MX",method:"standard",subtotalKrw:288000,subtotalUsd:250,qty:1,settings}).usd,60);
  }
  assert.equal(rates.EMS_RATES_KRW.MX,87500,"recorded carrier cost is not repriced");
});
await check("accessory-only and mixed baskets require an actual parcel quote instead of charging shoe-box rates",async()=>{
  for(const country of ["US","HK","MX"]){
    for(const items of [[{productId:"test-accessory",qty:2}],[{productId:"test-shoe",qty:1},{productId:"test-accessory",qty:1}]]){
      await assert.rejects(quote(country,{items}),/SHIPPING_QUOTE_REQUIRED/);
      const quoteItems=items.map(item=>({...catalog.products.find(p=>p.id===item.productId),qty:item.qty}));
      const result=shipping.quoteShipping({country,method:"standard",subtotalKrw:1,subtotalUsd:1,qty:3,items:quoteItems});
      assert.equal(result.available,false);assert.equal(result.reason,"parcel_quote");assert.equal(result.free,false);
    }
  }
});
await check("missing/unsupported destinations never become zero-freight paid orders",async()=>{
  for(const country of ["","KR","TW"])await assert.rejects(quote(country),/SHIPPING_COUNTRY/);
  for(const country of ["IT","ZA"])await assert.rejects(quote(country),/DESTINATION_SALES_UNAVAILABLE/);
});
await check("telephone numbering plan is independent of destination and invalid or bare numbers are refused",async()=>{
  assert.equal(phoneApi.validatePhoneNumber("09012345678","JP").e164,"+819012345678");
  assert.equal(phoneApi.validatePhoneNumber("07400123456","GB").e164,"+447400123456");
  assert.equal((await quote("HK",{phone:"+12025550123"})).phone,"+12025550123");
  assert.equal((await quote("JP",{phone:"+44 7400 123456"})).phone,"+447400123456");
  for(const phone of ["+1","abc","2025550123","+852 +12025550123"])await assert.rejects(quote("US",{phone}),/PHONE_INVALID/);
});
await check("postal/state checks and postcode exceptions follow the destination",async()=>{
  await assert.rejects(quote("US",{postal:"123"}),/ADDRESS_INVALID/);
  await assert.rejects(quote("US",{region:"not-a-state"}),/ADDRESS_INVALID/);
  await assert.rejects(quote("CA",{postal:"10001"}),/ADDRESS_INVALID/);
  await assert.rejects(quote("MX",{postal:"1234"}),/ADDRESS_INVALID/);
  await assert.rejects(quote("MX",{region:""}),/REGION_REQUIRED/);
  await assert.rejects(quote("SG",{postal:""}),/POSTAL_REQUIRED/);
  assert.equal((await quote("HK",{postal:""})).postal,"");
  await assert.rejects(quote("AE",{postal:""}),/DESTINATION_SALES_UNAVAILABLE/);
  assert.equal(addressApi.validPostalAddress("US","10001-1234","New York"),true);
});
await check("stale China destinations reject new orders before phone or payment choices can bypass the sales exclusion",async()=>{
  for(const country of ["CN"," cn "])for(const pay of ["paypal","transfer"]){
    for(const phone of ["+8613812345678","+12025550123","+861012345678"]){
      await assert.rejects(quote(country,{pay,phone}),/DESTINATION_SALES_UNAVAILABLE/);
    }
  }
});
await check("guest email route works; required contact and explicit current acknowledgements cannot be skipped",async()=>{
  assert.equal((await quote("US")).contactMethod,"email");
  await assert.rejects(quote("US",{contactMethod:"instagram",instagram:""}),/CONTACT_REQUIRED/);
  await assert.rejects(quote("US",{termsAccepted:false}),/TERMS_REQUIRED/);
  await assert.rejects(quote("US",{termsVersion:"outdated"}),/TERMS_REQUIRED/);
  await assert.rejects(quote("US",{importPolicyVersion:"outdated"}),/IMPORT_POLICY|TERMS_REQUIRED/);
  await assert.rejects(quote("US",{importPolicyVersion:undefined}),/IMPORT_POLICY|TERMS_REQUIRED/);
});
await check("client price/shipping/currency tampering cannot lower the authoritative quote",async()=>{
  const result=await quote("US",{totalUsd:1,shippingUsd:0,currency:"KRW",items:[{productId:"test-shoe",qty:1,priceUsd:1,priceKrw:1,extraUsd:-24900}]});
  assert.equal(result.currency,"USD");assert.equal(result.items[0].priceUsd,250);assert.equal(result.shippingUsd,85);assert.equal(result.totalUsd,335);
  await assert.rejects(quote("US",{items:[{productId:"test-custom",qty:1,size:"265"}]}),/DESIGN_REQUIRED/);
});
await check("all 16 checkout languages persist the exact duty and destination guidance shown to the customer",async()=>{
  for(const locale of ["en","ko","ja","zh","zh-Hant","es","fr","de","it","pt","ru","tr","uz","th","hi","tl"]){
    for(const country of ["US","JP","HK","MX"]){
      const result=await quote(country,{checkoutLocale:locale});
      assert.equal(result.checkoutLocale,locale);assert.equal(result.importPolicyVersion,rules.IMPORT_POLICY_VERSION);
      assert.equal(result.acknowledgedTerms.duty,country==="US"?copyApi.checkoutCopy(locale).usDuty:copyApi.checkoutCopy(locale).duty);
      assert.equal(result.acknowledgedTerms.destination,rules.countryImportNotice(country,locale,true));
      assert.ok(result.acknowledgedTerms.destination.length>20);assert.ok(result.termsAcceptedAt);
    }
  }
});
console.log(`${count} international readiness scenarios passed (26 historical destinations, 16 languages); no DB, payments or network.`);

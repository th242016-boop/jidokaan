// Synthetic catalog, payment provider and SQL only. No outbound requests or customer writes.
// Run: node --experimental-vm-modules scripts/japan-yen-checkout-test.mjs
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SourceTextModule, SyntheticModule } from "node:vm";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const modules = new Map();
const loading = new Map();
let catalog, draft, paymentCurrency = "JPY", paymentValue = "43000", providerPosts = [], storedOrders = [];
let captureTimeout = false;
const captureKeys = [];
const sql = { query: async (query, params = []) => {
  if (query.startsWith("insert into paypal_checkout_drafts")) draft = JSON.parse(params[1]);
  if (query.startsWith("select payload")) return draft ? [{ payload: structuredClone(draft) }] : [];
  return [];
} };
const stubs = {
  db: { getSql: async () => sql },
  "catalog.server": { readCatalog: async () => catalog, isBlockedEmail: async () => false },
  "orders.server": { countOrdersByEmail: async () => 0, placeOrder: async payload => { storedOrders.push(payload); return {...payload,id:"TEST-JPY-ORDER"}; } },
  "admin-auth.server": { assertSession: async () => {} },
};
async function synthetic(id, exports) {
  const module = new SyntheticModule(Object.keys(exports), function () { for (const [name, value] of Object.entries(exports)) this.setExport(name, value); }, { identifier: id });
  modules.set(id, module); return module;
}
async function load(path) {
  if (modules.has(path)) return modules.get(path);
  if (loading.has(path)) return loading.get(path);
  const pending=(async()=>{
    if (path === "libphonenumber-js/max" || path === "node:crypto") return synthetic(path, await import(path));
    const key = path.split("/").at(-1).replace(/\.ts$/, "");
    if (stubs[key]) return synthetic(path, stubs[key]);
    const module = new SourceTextModule(stripTypeScriptTypes(await readFile(path, "utf8")), { identifier: path });
    modules.set(path, module); return module;
  })();
  loading.set(path,pending);return pending;
}
async function api(name) {
  const module=await load(resolve(root,"src/lib",`${name}.ts`));
  if(module.status==="unlinked")await module.link((specifier,referrer)=>specifier.startsWith(".")?load(resolve(dirname(referrer.identifier),`${specifier}.ts`)):load(specifier));
  if(module.status!=="evaluated")await module.evaluate();return module.namespace;
}
const money = await api("order-money"), quote = await api("checkout-quote.server"), paypal = await api("paypal.server");
const checkout = await api("paypal-checkout.server"), shipping = await api("shipping"), design = await api("design-order");
const policy = await api("country-import-policy"), orderTypes = await api("order-types"), sim = await api("simulator-config");
const product = {id:"drone-custom",name:{ko:"TEST",en:"TEST"},category:"custom",customizable:true,priceUsd:25000,priceKrw:288000,inStock:true,visible:true};
catalog={shipping:shipping.DEFAULT_SHIPPING,coupons:[],products:[product,{...product,id:"drone-mid"},{...product,id:"special-test",priceUsd:28000},{...product,id:"custom-price-test",priceUsd:30000}]};
const names={...sim.PHOTO_NATIVE};
const item={productId:"drone-custom",qty:1,size:"265",partNames:names,designKey:design.designKey(names),designVersion:design.DESIGN_VERSION,designPreview:"data:image/jpeg;base64,/9j/TEST"};
const input=(patch={})=>({country:"JP",currency:"JPY",pay:"paypal",email:"synthetic@example.invalid",name:"Synthetic Buyer",phone:"+819012345678",address:"Test Road 7",city:"Test City",region:"Tokyo",postal:"100-0001",contactMethod:"email",termsAccepted:true,termsVersion:design.ORDER_TERMS_VERSION,importPolicyVersion:policy.IMPORT_POLICY_VERSION,checkoutLocale:"ja",items:[item],...patch});
const providerResponse=(currency=paymentCurrency,value=paymentValue)=>({id:"TESTPAYPAL001",status:"COMPLETED",purchase_units:[{payments:{captures:[{id:"TESTCAPTURE001",status:"COMPLETED",amount:{currency_code:currency,value},seller_receivable_breakdown:{paypal_fee:{currency_code:currency,value:currency==="JPY"?"1800":"12.00"},net_amount:{currency_code:currency,value:currency==="JPY"?String(Number(value)-1800):(Number(value)-12).toFixed(2)}}}]}}]});
process.env.PAYPAL_CLIENT_ID="TEST-ONLY"; process.env.PAYPAL_CLIENT_SECRET="TEST-ONLY"; process.env.PAYPAL_ENV="sandbox";
globalThis.fetch=async(url,options={})=>{
  assert.ok(String(url).startsWith("https://api-m.sandbox.paypal.com/"),"unexpected network target");
  // This function never forwards requests. Every response is a synthetic in-process fixture.
  if(String(url).endsWith("/oauth2/token"))return Response.json({access_token:"SYNTHETIC"});
  if(String(url).endsWith("/v2/checkout/orders")&&options.method==="POST") {providerPosts.push(JSON.parse(options.body));return Response.json({id:"TESTPAYPAL001"});}
  if(String(url).endsWith("/capture")) {
    captureKeys.push(options.headers["PayPal-Request-Id"]);
    if(captureTimeout)throw Error("SIMULATED_CAPTURE_RESPONSE_TIMEOUT");
    return Response.json(providerResponse());
  }
  if(String(url).endsWith("/TESTPAYPAL001"))return Response.json(providerResponse());
  throw Error("OUTBOUND_NETWORK_BLOCKED");
};
let count=0;async function check(label,fn){await fn();count++;console.log(`PASS ${label}`);}
await check("Japan standard price is 37000+6000 JPY regardless of site language or client amounts",async()=>{
  for(const locale of ["ja","en","ko"]){const result=await quote.quoteCheckout(input({checkoutLocale:locale,totalJpy:1,shippingJpy:0,items:[{...item,priceJpy:1,priceUsd:1}]}));
    assert.equal(result.currency,"JPY");assert.equal(result.totalJpy,43000);assert.equal(result.shippingJpy,6000);assert.equal(result.items[0].priceJpy,37000);
    assert.equal(result.items[0].priceUsd,250);assert.equal(result.totalUsd,285);assert.equal(result.priceVersion,money.JAPAN_PRICE_VERSION);
  }
});
await check("special order option is server-priced once at USD280 or JPY41500",async()=>{
  const specialItem={...item,specialOrder:true,priceUsd:1,priceKrw:1,priceJpy:1,extraUsd:999999};
  const jp=await quote.quoteCheckout(input({items:[specialItem]}));
  assert.equal(jp.items[0].priceUsd,280);assert.equal(jp.items[0].priceKrw,318000);
  assert.equal(jp.items[0].priceJpy,41500);assert.equal(jp.shippingJpy,6000);assert.equal(jp.totalJpy,47500);
  assert.equal(jp.items[0].specialOrder,true);assert.match(jp.items[0].optionLabel,/スペシャル/);
  const mx=await quote.quoteCheckout(input({country:"MX",region:"CDMX",postal:"06000",checkoutLocale:"es",currency:"USD",items:[specialItem]}));
  assert.equal(mx.totalUsd,340);assert.equal(mx.shippingUsd,60);assert.equal(mx.items[0].priceUsd,280);
  const standard=await quote.quoteCheckout(input({items:[{...specialItem,specialOrder:false}]}));
  assert.equal(standard.totalJpy,43000);assert.equal(standard.items[0].priceUsd,250);
});
await check("special option cannot upgrade another product or double-charge an existing priced SKU",async()=>{
  await assert.rejects(quote.quoteCheckout(input({items:[{...item,productId:"special-test",specialOrder:true}]})),/SPECIAL_ORDER_UNAVAILABLE/);
  await assert.rejects(quote.quoteCheckout(input({items:[{...item,specialOrder:"true"}]})),/SPECIAL_ORDER_UNAVAILABLE/);
  const original=catalog.products[0];
  catalog.products[0]={...original,options:{enabled:true,type:"single",groups:[{name:"Type",values:["Special"]}],skus:[{key:"Special",values:["Special"],extraKrw:30000,extraUsd:3000,stock:9,enabled:true}]}};
  try { await assert.rejects(quote.quoteCheckout(input({items:[{...item,optionKey:"Special",specialOrder:true}]})),/SPECIAL_ORDER_UNAVAILABLE/); }
  finally { catalog.products[0]=original; }
});
await check("Mexico standard and special orders charge 60 USD per pair despite saved FX, reserves, minimums or client amounts",async()=>{
  const before=catalog.shipping;
  catalog.shipping={...structuredClone(before),exchangeKrwPerUsd:1000,pricing:{...before.pricing,fxBufferPct:20,settlementReservePct:20,costBufferPct:20,roundUsd:5}};
  catalog.shipping.countryRates.MX={krw:87500,usd:150,minimumUsd:150};
  const saved=structuredClone(catalog.shipping);
  try {
    for(const [specialOrder,qty,total] of [[false,1,310],[true,1,340],[true,2,680]]){
      const result=await quote.quoteCheckout(input({country:"MX",region:"CDMX",postal:"06000",currency:"USD",shippingUsd:1,totalUsd:1,
        items:[{...item,specialOrder,qty,priceUsd:1,extraUsd:0}]}));
      assert.equal(result.items[0].priceUsd,specialOrder?280:250);
      assert.equal(result.shippingUsd,60*qty);
      assert.equal(result.totalUsd,total);
      assert.equal(result.currency,"USD");
    }
    assert.deepEqual(catalog.shipping,saved,"quoting must not rewrite saved catalog settings");
  } finally {catalog.shipping=before;}
});
await check("selected special order reaches mocked PayPal creation and capture at 47500 yen",async()=>{
  await checkout.startPaypalCheckout(input({items:[{...item,specialOrder:true}]}),"47500");
  assert.deepEqual(providerPosts.at(-1).purchase_units[0].amount,{currency_code:"JPY",value:"47500"});
  assert.equal(draft.items[0].specialOrder,true);paymentValue="47500";
  const saved=await checkout.completePaypalCheckout("TESTPAYPAL001",true);
  assert.equal(saved.items[0].priceJpy,41500);assert.equal(saved.totalJpy,47500);assert.equal(saved.items[0].specialOrder,true);
  paymentValue="43000";
});
await check("new policy consent is snapshotted server-side and stale terms cannot create a payment",async()=>{
  const result=await quote.quoteCheckout(input({acknowledgedTerms:{cancellationPolicy:"forged"}}));
  assert.match(result.acknowledgedTerms.cancellationPolicy,/12/);
  assert.match(result.acknowledgedTerms.cancellationPolicy,/5%/);
  assert.match(result.acknowledgedTerms.cancellationPolicy,/PayPal/);
  assert.notEqual(result.acknowledgedTerms.cancellationPolicy,"forged");
  await assert.rejects(quote.quoteCheckout(input({termsVersion:"2026-11-14-international-review-v2"})),/TERMS_REQUIRED/);
  await assert.rejects(quote.quoteCheckout(input({termsVersion:"2026-11-16-international-review-v3"})),/TERMS_REQUIRED/);
});
await check("two standard pairs and high/mid basket charge one approved box per pair",async()=>{
  const result=await quote.quoteCheckout(input({items:[item,{...item,productId:"drone-mid"}]}));
  assert.equal(result.totalJpy,86000);assert.equal(result.shippingJpy,12000);assert.equal(result.items.length,2);
});
await check("catalog-priced special shoes use 41500+6000 JPY and mixed baskets retain each unit price",async()=>{
  const special=await quote.quoteCheckout(input({items:[{...item,productId:"special-test"}]}));
  assert.equal(special.currency,"JPY");assert.equal(special.totalJpy,47500);assert.equal(special.items[0].priceJpy,41500);
  const mixed=await quote.quoteCheckout(input({items:[item,{...item,productId:"special-test"}]}));
  assert.equal(mixed.currency,"JPY");assert.equal(mixed.totalJpy,90500);assert.equal(mixed.shippingJpy,12000);
  assert.deepEqual(mixed.items.map(item=>item.priceJpy),[37000,41500]);
});
await check("the special tier comes from the catalog SKU, not client price or special flags",async()=>{
  const original=catalog.products[0];
  catalog.products[0]={...original,options:{enabled:true,type:"single",groups:[{name:"Type",values:["Standard","Special"]}],skus:[
    {key:"Standard",values:["Standard"],extraKrw:0,extraUsd:0,stock:9,enabled:true},
    {key:"Special",values:["Special"],extraKrw:30000,extraUsd:3000,stock:9,enabled:true},
  ]}};
  try {
    const result=await quote.quoteCheckout(input({items:[{...item,optionKey:"Special",priceUsd:1,priceJpy:1,extraUsd:0}]}));
    assert.equal(result.totalJpy,47500);assert.equal(result.items[0].priceUsd,280);assert.equal(result.items[0].priceJpy,41500);
    const tampered=await quote.quoteCheckout(input({items:[{...item,optionKey:"Standard",priceUsd:280,priceJpy:41500,special:true,extraUsd:3000}]}));
    assert.equal(tampered.totalJpy,43000);assert.equal(tampered.items[0].priceUsd,250);
    await assert.rejects(quote.quoteCheckout(input({items:[{...item,optionKey:"not-real"}]})),/OPTION_UNAVAILABLE/);
    catalog.products[0].options.skus[0].stock=1;
    const separateDesignLines=[{...item,optionKey:"Standard"},{...item,optionKey:"Standard",size:"270"}];
    await assert.rejects(quote.quoteCheckout(input({items:separateDesignLines})),/OPTION_UNAVAILABLE/);
    catalog.products[0].options.skus[0].stock=2;
    assert.equal((await quote.quoteCheckout(input({items:separateDesignLines}))).totalJpy,86000);
  } finally {catalog.products[0]=original;}
});
await check("unapproved prices and accessory metadata cannot acquire an approved yen tier",async()=>{
  const other=await quote.quoteCheckout(input({items:[{...item,productId:"custom-price-test"}]}));
  assert.equal(other.currency,"USD");assert.equal(other.totalUsd,335);assert.equal(other.totalJpy,undefined);
  const mixed=await quote.quoteCheckout(input({items:[item,{...item,productId:"custom-price-test"}]}));
  assert.equal(mixed.currency,"USD");assert.equal(mixed.items.every(item=>item.priceJpy===undefined),true);
  assert.equal(money.japanYenQuote("JP",[{productId:"drone-custom",priceUsd:300,qty:1}]),null);
  assert.equal(money.japanYenQuote("JP",[{productId:"band",priceUsd:250,qty:1}]),null);
  assert.equal(money.japanYenQuote("JP",[{productId:"band",priceUsd:280,qty:1,category:"gear"}]),null);
  assert.equal(money.japanYenQuote("JP",[{productId:"unknown",priceUsd:280,qty:1}]),null);
});
await check("non-Japanese destinations retain USD and ignore injected yen fields",async()=>{
  const result=await quote.quoteCheckout(input({country:"US",region:"NY",postal:"10001",totalJpy:1,items:[{...item,priceJpy:1}]}));
  assert.equal(result.currency,"USD");assert.equal(result.totalUsd,335);assert.equal(result.totalJpy,undefined);assert.equal(result.items[0].priceJpy,undefined);
});
await check("yen cannot be sent to the legacy bank-transfer instructions",async()=>{
  await assert.rejects(quote.quoteCheckout(input({pay:"transfer"})),/JPY_PAYPAL_REQUIRED/);
  await assert.rejects(quote.quoteCheckout(input({pay:"transfer",items:[{...item,productId:"special-test"}]})),/JPY_PAYPAL_REQUIRED/);
  const other=await quote.quoteCheckout(input({pay:"transfer",items:[{...item,productId:"custom-price-test"}]}));
  assert.equal(other.currency,"USD");
});
await check("coupons retain proportional savings in whole yen",()=>{
  const result=money.japanYenQuote("JP",[{productId:"drone-custom",priceUsd:250,qty:1}],25);
  assert.equal(result.discountJpy,3700);assert.equal(result.totalJpy,39300);
  const capped=money.japanYenQuote("JP",[{productId:"drone-custom",priceUsd:250,qty:1}],999);
  assert.equal(capped.discountJpy,37000);assert.equal(capped.totalJpy,6000);
  const mixed=money.japanYenQuote("JP",[{productId:"drone-custom",priceUsd:250,qty:1},{productId:"drone-mid",priceUsd:280,qty:1}],53);
  assert.equal(mixed.discountJpy,7850);assert.equal(mixed.totalJpy,82650);assert.deepEqual(mixed.unitPricesJpy,[37000,41500]);
});
await check("mixed standard/special PayPal create and capture use 90500 yen and preserve item amounts",async()=>{
  await checkout.startPaypalCheckout(input({items:[item,{...item,productId:"special-test"}]}),"90500");
  assert.deepEqual(providerPosts.at(-1).purchase_units[0].amount,{currency_code:"JPY",value:"90500"});
  assert.deepEqual(draft.items.map(item=>item.priceJpy),[37000,41500]);
  paymentValue="90500";
  const result=await checkout.completePaypalCheckout("TESTPAYPAL001",true);
  assert.equal(result.paypalGrossAmount,90500);assert.deepEqual(result.items.map(item=>item.priceJpy),[37000,41500]);
  assert.equal(result.paypalNetAmount,88700);paymentValue="43000";
});
await check("PayPal create receives integer JPY currency and the server-authoritative 43000 amount",async()=>{
  const id=await checkout.startPaypalCheckout(input(),"43000");assert.equal(id,"TESTPAYPAL001");
  const amount=providerPosts.at(-1).purchase_units[0].amount;assert.deepEqual(amount,{currency_code:"JPY",value:"43000"});
  assert.equal(draft.totalJpy,43000);assert.equal(draft.currency,"JPY");
});
await check("stale USD quote, currency mismatch and fractional yen fail before payment creation",async()=>{
  const before=providerPosts.length;
  await assert.rejects(checkout.startPaypalCheckout(input(),"285.00"),/QUOTE_CHANGED/);
  await assert.rejects(checkout.startPaypalCheckout(input({currency:"USD"}),"43000"),/QUOTE_CHANGED/);
  await assert.rejects(checkout.startPaypalCheckout(input(),"43000.50"),/PAYPAL_AMOUNT/);
  assert.equal(providerPosts.length,before);
});
await check("capture verifies savedJPY amount/currency and keeps yen settlement out of USD fields",async()=>{
  const result=await checkout.completePaypalCheckout("TESTPAYPAL001",true);
  assert.equal(result.currency,"JPY");assert.equal(result.paypalGrossAmount,43000);assert.equal(result.paypalFeeAmount,1800);
  assert.equal(result.paypalNetAmount,41200);assert.equal(result.paypalGrossUsd,undefined);assert.equal(result.paypalCurrency,"JPY");
  assert.equal(orderTypes.customerOrder(result).paypalGrossAmount,undefined);
});
await check("mismatched currency, amount or fractional yen cannot mark a payment as paid",()=>{
  for(const [currency,value] of [["USD","43000"],["JPY","42999"],["JPY","43000.1"]])
    assert.throws(()=>paypal.verifiedPayment(providerResponse(currency,value),"TESTPAYPAL001",43000,"JPY"),/AMOUNT_MISMATCH/);
});
await check("historic Japanese USD drafts recover in their saved currency without conversion",async()=>{
  draft={...draft,currency:"USD",totalUsd:285,shippingUsd:35,totalJpy:undefined,shippingJpy:undefined,discountJpy:undefined,items:draft.items.map(({priceJpy,...item})=>item)};
  paymentCurrency="USD";paymentValue="285.00";
  const result=await checkout.completePaypalCheckout("TESTPAYPAL001",false);
  assert.equal(result.currency,"USD");assert.equal(result.totalUsd,285);assert.equal(result.totalJpy,undefined);assert.equal(result.paypalGrossUsd,285);
  assert.equal(money.orderPaymentMoney(result).total,285);
});
await check("historic JPY draft recovers the saved special price without current repricing",async()=>{
  draft={...draft,currency:"JPY",totalJpy:47000,shippingJpy:6000,discountJpy:0,priceVersion:"HISTORICAL-FIXTURE",items:[{...draft.items[0],priceUsd:280,priceJpy:41000}]};
  paymentCurrency="JPY";paymentValue="47000";
  const result=await checkout.completePaypalCheckout("TESTPAYPAL001",false);
  assert.equal(result.totalJpy,47000);assert.equal(result.items[0].priceJpy,41000);assert.equal(result.priceVersion,"HISTORICAL-FIXTURE");
  assert.equal(result.paypalGrossAmount,47000);assert.equal(money.orderPaymentMoney(result).total,47000);
});
await check("missing yen facts fail rather than displaying or declaring a USD number as yen",()=>{
  assert.throws(()=>money.orderPaymentMoney({currency:"JPY",totalUsd:285,shippingUsd:35}),/JPY_ORDER_AMOUNT_MISSING/);
  assert.throws(()=>money.orderItemUnitAmount({currency:"JPY"},{priceUsd:250}),/JPY_ITEM_AMOUNT_MISSING/);
});
await check("all 11 foreign destinations and 16 languages keep standard/special authoritative prices",async()=>{
  const addresses={
    US:["NY","10001",85],CA:["ON","K1A 0B1",60],AU:["NSW","2000",59],
    HK:["","",31],JP:["Tokyo","100-0001",6000],SG:["","018956",27],TH:["Bangkok","10100",27],
    PH:["Manila","1000",33],GB:["","SW1A 1AA",63],CH:["Zurich","8001",61],MX:["Ciudad de Mexico","06000",60],
  };
  for(const [country,[region,postal,freight]] of Object.entries(addresses)){
    for(const locale of ["en","ko","ja","zh","zh-Hant","es","fr","de","it","pt","ru","tr","uz","th","hi","tl"]){
      for(const [productId,usd,jpy] of [["drone-custom",250,37000],["special-test",280,41500]]){
        const result=await quote.quoteCheckout(input({country,region,postal,checkoutLocale:locale,phone:country==="CN"?"+8613812345678":"+12025550123",currency:"USD",totalUsd:1,shippingUsd:0,items:[{...item,productId,priceUsd:1,priceJpy:1}]}));
        assert.equal(result.items[0].priceUsd,usd,`${country}/${locale}/${productId}`);
        assert.equal(result.currency,country==="JP"?"JPY":"USD");
        assert.equal(country==="JP"?result.shippingJpy:result.shippingUsd,freight);
        assert.equal(country==="JP"?result.totalJpy:result.totalUsd,(country==="JP"?jpy:usd)+freight);
        assert.equal(result.acknowledgedTerms.destination,policy.countryImportNotice(country,locale,true));
      }
    }
  }
});
await check("Mexico full-price PayPal create/capture preserves its shipping address, design and private guidance boundary",async()=>{
  const mexicoInput=input({country:"MX",region:"Ciudad de Mexico",postal:"06000",phone:"+525555001234",currency:"USD",checkoutLocale:"es"});
  assert.equal(policy.countryImportPolicy("MX").consultationRequired,false);
  const expected=await quote.quoteCheckout(mexicoInput);
  assert.equal(expected.totalUsd,310);assert.equal(expected.shippingUsd,60);assert.equal(expected.items[0].priceUsd,250);
  await checkout.startPaypalCheckout(mexicoInput,"310.00");
  const request=providerPosts.at(-1);
  assert.deepEqual(request.purchase_units[0].amount,{currency_code:"USD",value:"310.00"});
  assert.equal(request.purchase_units[0].shipping.address.country_code,"MX");
  assert.equal(request.purchase_units[0].shipping.address.admin_area_1,"Ciudad de Mexico");
  assert.equal(request.purchase_units[0].shipping.address.postal_code,"06000");
  assert.equal(draft.items[0].designKey,item.designKey);assert.equal(draft.items[0].designPreview,item.designPreview);
  assert.equal(draft.adminShippingGuidance,undefined);
  paymentCurrency="USD";paymentValue="310.00";
  const result=await checkout.completePaypalCheckout("TESTPAYPAL001",true);
  assert.equal(result.totalUsd,310);assert.equal(result.paypalGrossAmount,310);assert.equal(result.country,"MX");
  assert.equal(result.items[0].priceUsd,250);assert.equal(result.items[0].designKey,item.designKey);
});
await check("Mexico capture timeout verifies payment and retries reuse the same provider idempotency key",async()=>{
  const before=storedOrders.length;
  captureTimeout=true;
  const recovered=await checkout.completePaypalCheckout("TESTPAYPAL001",true);
  captureTimeout=false;
  assert.equal(recovered.paypalGrossAmount,310);assert.equal(storedOrders.length,before+1);
  await checkout.completePaypalCheckout("TESTPAYPAL001",true);
  assert.ok(captureKeys.at(-1));assert.equal(captureKeys.at(-1),captureKeys.at(-2));
  const calls=captureKeys.length;
  await checkout.completePaypalCheckout("TESTPAYPAL001",false);
  assert.equal(captureKeys.length,calls,"read-only recovery must not capture");
});
await check("previously paid Mexico orders recover their saved 327 USD total and 77 USD freight unchanged",async()=>{
  draft={...draft,totalUsd:327,shippingUsd:77,importPolicyVersion:"HISTORICAL-MEXICO-FIXTURE"};
  paymentCurrency="USD";paymentValue="327.00";
  const calls=captureKeys.length;
  const recovered=await checkout.completePaypalCheckout("TESTPAYPAL001",false);
  assert.equal(recovered.country,"MX");
  assert.equal(recovered.totalUsd,327);assert.equal(recovered.shippingUsd,77);
  assert.equal(recovered.paypalGrossAmount,327);
  assert.equal(recovered.importPolicyVersion,"HISTORICAL-MEXICO-FIXTURE");
  assert.equal(captureKeys.length,calls,"historical recovery never creates another capture");
});
await check("saved production catalog prices and shipping settings reproduce all 11 approved foreign standard totals", async () => {
  const live = JSON.parse(await readFile(resolve(root, "scripts/fixtures/public-catalog-20261115.json"), "utf8"));
  const before = catalog;
  catalog = { ...catalog, shipping: live.shipping, products: catalog.products.map(product => {
    const saved = live.products.find(candidate => candidate.id === product.id);
    return saved ? { ...product, priceUsd: saved.priceUsd, priceKrw: saved.priceKrw } : product;
  }) };
  try {
    const addresses = {
      US:["NY","10001",85], CA:["ON","K1A 0B1",60], AU:["NSW","2000",59],
      HK:["","",31], JP:["Tokyo","100-0001",6000], SG:["","018956",27], TH:["Bangkok","10100",27],
      PH:["Manila","1000",33], GB:["","SW1A 1AA",63], CH:["Zurich","8001",61], MX:["Ciudad de Mexico","06000",60],
    };
    for (const [country, [region, postal, freight]] of Object.entries(addresses)) {
      for (const productId of ["drone-custom", "drone-mid"]) {
        const result = await quote.quoteCheckout(input({ country, region, postal, phone: country === "CN" ? "+8613812345678" : "+12025550123", items: [{ ...item, productId }] }));
        assert.equal(result.items[0].priceUsd, 250);
        assert.equal(result.currency, country === "JP" ? "JPY" : "USD");
        assert.equal(country === "JP" ? result.shippingJpy : result.shippingUsd, freight);
        assert.equal(country === "JP" ? result.totalJpy : result.totalUsd, (country === "JP" ? 37000 : 250) + freight);
      }
    }
  } finally { catalog = before; }
});
console.log(`${count} yen/international/PayPal scenarios passed, including 352 country-language-tier quotes; no real DB, payments, mail or network.`);

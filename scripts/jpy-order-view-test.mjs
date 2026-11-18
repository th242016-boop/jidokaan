// Synthetic receipts, notifications and customs values only. No API/database writes.
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createServer } from "vite";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
globalThis.fetch = async () => { throw Error("OUTBOUND_NETWORK_BLOCKED"); };
const server = await createServer({configFile:false,root,resolve:{alias:{"@":resolve(root,"src")}},esbuild:{jsx:"automatic"},server:{middlewareMode:true},appType:"custom"});
let checks=0;
function check(name, run) { run(); checks++; console.log(`PASS ${name}`); }
try {
  const { customerOrder } = await server.ssrLoadModule("/src/lib/order-types.ts");
  const { customerOrderAmounts, orderMoney } = await server.ssrLoadModule("/src/lib/customer-order-view.ts");
  const { CustomerOrderDetails } = await server.ssrLoadModule("/src/components/store/customer-order-details.tsx");
  const { orderNotificationText } = await server.ssrLoadModule("/src/lib/order-notification.ts");
  const { orderEmailPayload, canConfirmPaidOrder } = await server.ssrLoadModule("/src/lib/customer-order-email.ts");
  const { itemPaidValues, prepareEms, emsAllocationIssues } = await server.ssrLoadModule("/src/lib/ems-workflow.ts");
  const { adminCountryNotice, adminOrderWithGuidance } = await server.ssrLoadModule("/src/lib/admin-shipping-guidance.server.ts");
  const { AdminCountryNotice } = await server.ssrLoadModule("/src/components/admin/country-notice.tsx");
  const order={id:"JPY-TEST",createdAt:"2026-11-14T00:00:00Z",email:"synthetic@example.invalid",phone:"+819012345678",name:"Synthetic Buyer",address:"Example address",city:"Tokyo",region:"Tokyo",postal:"1000001",country:"JP",currency:"JPY",pay:"paypal",paypalCaptureId:"SECRET-CAPTURE",status:"paid",shipMethod:"standard",totalUsd:285,shippingUsd:35,totalKrw:0,shippingKrw:0,totalJpy:43000,shippingJpy:6000,discountJpy:0,checkoutLocale:"ja",note:"SECRET-NOTE",paypalCurrency:"JPY",paypalGrossAmount:43000,paypalFeeAmount:1500,paypalNetAmount:41500,items:[{productId:"drone-custom",name:"Test boots",qty:1,priceUsd:250,priceKrw:288000,priceJpy:37000,size:"265"}]};
  const safe=customerOrder(order);
  check("JPY receipt preserves yen totals without exposing merchant notes or settlement data",()=>{
    assert.deepEqual(customerOrderAmounts(safe),{subtotal:37000,discount:0,shipping:6000,total:43000});
    const html=renderToStaticMarkup(createElement(CustomerOrderDetails,{order:safe,locale:"ja"}));
    assert.ok(html.includes("43,000"));assert.ok(html.includes("37,000"));assert.ok(html.includes("6,000"));
    assert.ok(html.includes("JPY"));assert.ok(!html.includes("USD"));assert.ok(!JSON.stringify(safe).includes("SECRET"));
    for(const key of ["paypalCurrency","paypalGrossAmount","paypalFeeAmount","paypalNetAmount"])assert.equal(safe[key],undefined);
  });
  check("historical Japan USD orders retain original payment currency and values",()=>{
    const old={...order,currency:"USD",totalJpy:undefined,shippingJpy:undefined,discountJpy:undefined};
    assert.equal(customerOrderAmounts(old).total,285);
    assert.match(orderMoney(old,285,"ja"),/USD.*285\.00/);
    assert.deepEqual(itemPaidValues(old),[250]);
  });
  check("JPY customer email and Telegram use actual payment currency without sending anything",()=>{
    assert.equal(canConfirmPaidOrder(order),true);
    const email=orderEmailPayload(order,{from:"test@example.invalid",apiKey:"TEST",startAt:"2026-11-14T00:00:00Z"});
    assert.ok(email.text.includes("JPY 43,000"));assert.ok(!email.text.includes("USD 285"));assert.ok(!email.text.includes("SECRET"));
    const telegram=orderNotificationText(order);assert.match(telegram,/JPY.*43,000/);assert.ok(!telegram.includes("285"));
    assert.equal(canConfirmPaidOrder({...order,totalJpy:undefined}),false);
  });
  check("EMS declaration starts at actual JPY goods amount, excluding freight",()=>{
    assert.deepEqual(itemPaidValues(order),[37000]);
    const prepared=prepareEms(order);
    const item=prepared.fulfillment.packages[0].items[0];
    assert.equal(item.currency,"JPY");assert.equal(item.declaredValue,37000);
    item.declaredValue=50;
    assert.ok(emsAllocationIssues(prepared).some(issue=>issue.message.includes("37000 JPY")));
    item.declaredValue=37000.5;
    assert.ok(emsAllocationIssues(prepared).length>0);
  });
  check("discounted multi-item JPY allocation remains whole-yen and conserves actual paid goods",()=>{
    const discounted={...order,totalJpy:85001,shippingJpy:12000,discountJpy:999,items:[{...order.items[0]},{...order.items[0],productId:"drone-mid"}]};
    const amounts=itemPaidValues(discounted);assert.ok(amounts.every(Number.isInteger));assert.equal(amounts.reduce((a,b)=>a+b,0),73001);
  });
  check("special and standard receipt, email and EMS keep distinct paid yen goods amounts",()=>{
    const mixed={...order,totalJpy:82650,shippingJpy:12000,discountJpy:7850,items:[order.items[0],{...order.items[0],name:"Test special boots",priceUsd:280,priceJpy:41500}]};
    assert.deepEqual(customerOrderAmounts(mixed),{subtotal:78500,discount:7850,shipping:12000,total:82650});
    const html=renderToStaticMarkup(createElement(CustomerOrderDetails,{order:customerOrder(mixed),locale:"ja"}));
    assert.ok(html.includes("41,500"));assert.ok(html.includes("37,000"));assert.ok(html.includes("82,650"));
    assert.deepEqual(itemPaidValues(mixed),[33300,37350]);
    const email=orderEmailPayload(mixed,{from:"test@example.invalid",apiKey:"TEST",startAt:"2026-11-14T00:00:00Z"});
    assert.ok(email.text.includes("JPY 82,650"));assert.ok(!email.text.includes("USD 285"));
  });
  check("MX customs reminder stays private to admin and does not alter order facts",()=>{
    const admin=renderToStaticMarkup(createElement(AdminCountryNotice,{notice:adminCountryNotice("MX")}));
    assert.ok(admin.includes("멕시코 · 발송 전 통관 확인"));assert.ok(admin.includes("수입허가"));
    const original={...order,country:"MX"};
    const before=JSON.stringify(original);
    const withGuidance=adminOrderWithGuidance(original);
    assert.equal(JSON.stringify(original),before);
    assert.deepEqual({...withGuidance,adminShippingGuidance:undefined},{...original,adminShippingGuidance:undefined});
    const customer=renderToStaticMarkup(createElement(CustomerOrderDetails,{order:customerOrder(adminOrderWithGuidance({...order,country:"MX"})),locale:"ko"}));
    assert.equal(customerOrder(adminOrderWithGuidance({...order,country:"MX"})).adminShippingGuidance,undefined);
    assert.ok(!customer.includes("50달러"));assert.ok(!customer.includes("관리자 전용"));assert.ok(!customer.includes("수입허가"));
    const customerEmail=orderEmailPayload(withGuidance,{from:"test@example.invalid",apiKey:"TEST",startAt:"2026-11-14T00:00:00Z"});
    assert.ok(!JSON.stringify(customerEmail).includes("adminShippingGuidance"));assert.ok(!JSON.stringify(customerEmail).includes("수입허가"));
    assert.equal(renderToStaticMarkup(createElement(AdminCountryNotice,{notice:adminCountryNotice("US")})),"");
  });
  console.log(`${checks} JPY receipt/notification/customs/privacy checks passed; no external requests.`);
} finally {await server.close();}

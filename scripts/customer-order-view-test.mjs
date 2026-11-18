// Customer receipt and privacy regression checks. Synthetic data only; network blocked.
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createServer } from "vite";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
globalThis.fetch = async () => { throw Error("OUTBOUND_NETWORK_BLOCKED"); };
const server = await createServer({ configFile: false, root, resolve: { alias: { "@": resolve(root, "src") } },
  esbuild: { jsx: "automatic" }, server: { middlewareMode: true }, appType: "custom" });
let count = 0;
const check = (name, fn) => { fn(); console.log(`PASS ${name}`); count++; };
try {
  const { customerOrder } = await server.ssrLoadModule("/src/lib/order-types.ts");
  const { confirmationCredentials, matchesCustomerOrder, customerOrderAmounts, customerOrderItemName } = await server.ssrLoadModule("/src/lib/customer-order-view.ts");
  const { PRODUCTS } = await server.ssrLoadModule("/src/lib/products.ts");
  const { getCatalogCache, setCatalogCache } = await server.ssrLoadModule("/src/lib/catalog-cache.ts");
  const { catalogProductCopy } = await server.ssrLoadModule("/src/lib/catalog-product-copy.ts");
  const { CustomerOrderDetails } = await server.ssrLoadModule("/src/components/store/customer-order-details.tsx");
  const { customerOrderDetailCopy } = await server.ssrLoadModule("/src/lib/customer-order-detail-copy.ts");
  const raw = {
    id: "TEST-ONLY-001", email: "buyer@example.invalid", name: "Synthetic Buyer", address: "Test Street 7",
    city: "Test City", region: "Test Region", postal: "00000", country: "US", phone: "+1 2025550100",
    currency: "USD", status: "shipped", totalUsd: 655, shippingUsd: 170, discountUsd: 25,
    totalKrw: 0, shippingKrw: 0, pay: "paypal", createdAt: "2026-11-14T00:00:00Z", shipMethod: "standard",
    note: "SECRET_ADMIN_NOTE", paypalFeeUsd: 14, paypalNetUsd: 641, paypalGrossUsd: 655,
    paypalCaptureId: "SECRET_CAPTURE", paypalOrderId: "SECRET_PROVIDER_ORDER", paypalShipping: {name:"SECRET_PROVIDER_NAME"},
    claimAdminNote: "SECRET_CLAIM", shippingBasis: "SECRET_PRICING",
    acknowledgedTerms: { duty: "US duty is separate before dispatch.", destination: "Contact required before dispatch." },
    items: [{ productId: "test-product", name: "Test shoe <script>unsafe</script>", qty: 2, size: "265", sizeFit: "women",
      designPreview: "data:image/png;base64,TESTONLY", priceUsd: 255, priceKrw: 0 }],
    fulfillment: {recipient: {taxId: "SECRET_TAX_ID"}, audit: [{message: "SECRET_AUDIT"}], packages: [
      {id:"parcel-1",state:"delivered",tracking:"TEST-TRACK-1",manualDelivery:{source:"admin_confirmation"},registrationNote:"SECRET_NOTE",items:[]},
      {id:"parcel-2",state:"customs_delay",tracking:"TEST-TRACK-2",trackingCheck:{outcome:"unavailable",message:"SECRET_RAW_ERROR"},items:[]},
    ]},
  };
  const publicOrder = customerOrder(raw);
  check("customer projection preserves receipt/design but excludes merchant, tax and audit data", () => {
    assert.equal(JSON.stringify(publicOrder).includes("SECRET"), false);
    assert.equal(publicOrder.items[0].designPreview, raw.items[0].designPreview);
    assert.equal(publicOrder.address, raw.address);
    assert.equal(publicOrder.fulfillment, undefined);
    assert.equal(raw.fulfillment.recipient.taxId, "SECRET_TAX_ID", "projection must not mutate source");
    assert.equal(publicOrder.customerParcels.length, 2);
    assert.deepEqual(publicOrder.customerParcels.map(p => p.state), ["delivered", "customs_delay"]);
    assert.equal(publicOrder.status, "shipped", "one delivered parcel cannot finish the entire order");
    assert.equal(publicOrder.customerParcels[0].manuallyConfirmed, true);
    assert.equal(publicOrder.customerParcels[1].trackingUnavailable, true);
  });
  check("forged/empty/mismatched session cannot become order proof; authorized response must match both inputs", () => {
    for (const [id, rawSession] of [[undefined, null], [raw.id, "invalid"], [raw.id, JSON.stringify({orderId:"OTHER",email:raw.email})], [raw.id, JSON.stringify({orderId:raw.id,email:"invalid"})]]) {
      assert.equal(confirmationCredentials(id, rawSession), null);
    }
    const credentials = confirmationCredentials(raw.id, JSON.stringify({orderId:raw.id,email:raw.email,pay:"transfer"}));
    assert.deepEqual(credentials, {id:raw.id,email:raw.email});
    assert.equal(matchesCustomerOrder(publicOrder, "OTHER", raw.email), false);
    assert.equal(matchesCustomerOrder(publicOrder, raw.id, "someone@example.invalid"), false);
    assert.equal(matchesCustomerOrder(publicOrder, raw.id, raw.email.toUpperCase()), true);
  });
  check("saved option prices, discount, freight and total remain authoritative in receipt", () => {
    assert.deepEqual(customerOrderAmounts(publicOrder), {subtotal:510,discount:25,shipping:170,total:655});
  });
  check("receipt renders confirmed image, size/fit, address, totals and separate parcels with escaped text", () => {
    const html = renderToStaticMarkup(createElement(CustomerOrderDetails, {order:publicOrder,locale:"en"}));
    for (const text of ["data:image/png;base64,TESTONLY", "265", "Women", "Test Street 7", "655.00", "TEST-TRACK-1", "TEST-TRACK-2", "Customs delay", "Delivery confirmed by the store", "Tracking is temporarily unavailable", "US duty is separate before dispatch."]) assert.ok(html.includes(text), text);
    assert.equal(html.includes("<script>unsafe</script>"), false);
    assert.equal(html.includes("SECRET"), false);
  });
  check("receipt handles historical orders with no saved preview or parcel projection", () => {
    const historical = {...publicOrder, tracking:"LEGACY-TRACK", customerParcels:undefined, items:[{...publicOrder.items[0],designPreview:undefined}]};
    const html = renderToStaticMarkup(createElement(CustomerOrderDetails, {order:historical,locale:"ja"}));
    assert.ok(html.includes("LEGACY-TRACK"));
    assert.ok(html.includes("保存されたデザイン画像"));
  });
  check("legacy Korean size suffix is localized once and duplicate duty text appears once", () => {
    const receipt = {...publicOrder, items:[{...publicOrder.items[0],size:"265 (남성)",sizeFit:"men"}],
      acknowledgedTerms:{duty:"US duty is separate before dispatch.",destination:"  US duty is separate before dispatch.  "}};
    const html = renderToStaticMarkup(createElement(CustomerOrderDetails, {order:receipt,locale:"en"}));
    assert.ok(html.includes("265 mm · Men"));
    assert.equal(html.includes("남성"), false);
    assert.equal(html.split("US duty is separate before dispatch.").length - 1, 1);
    assert.equal(receipt.items[0].size, "265 (남성)", "display must not rewrite the saved specification");
    const oldReceipt = {...receipt,items:[{...receipt.items[0],size:"240 (여성)",sizeFit:undefined}]};
    const oldHtml = renderToStaticMarkup(createElement(CustomerOrderDetails, {order:oldReceipt,locale:"en"}));
    assert.ok(oldHtml.includes("240 mm · Women"));
  });
  check("all 15 customer locales have complete detail and parcel labels", () => {
    const keys = Object.keys(customerOrderDetailCopy("en"));
    for (const locale of ["en","ko","ja","zh","es","fr","de","it","pt","ru","tr","uz","th","hi","tl"]) {
      const copy = customerOrderDetailCopy(locale);
      assert.deepEqual(Object.keys(copy), keys);
      for (const key of keys) assert.ok(typeof copy[key] === "string" && copy[key].trim(), `${locale}.${key}`);
    }
  });
  check("changing display language labels original accepted terms without rewriting historical agreement", () => {
    const receipt = {...publicOrder, checkoutLocale:"ko", acknowledgedTerms:{duty:"저장된 원본 관세 안내",destination:"저장된 원본 배송 안내"}};
    const html = renderToStaticMarkup(createElement(CustomerOrderDetails, {order:receipt,locale:"en"}));
    assert.ok(html.includes(customerOrderDetailCopy("en").originalTerms));
    assert.ok(html.includes('lang="ko"'));
    assert.doesNotMatch(html, /<details[^>]*\sopen(?:=|>|\s)/);
    assert.ok(html.includes(receipt.acknowledgedTerms.duty));
    assert.equal(receipt.acknowledgedTerms.duty, "저장된 원본 관세 안내");
    const korean = renderToStaticMarkup(createElement(CustomerOrderDetails, {order:receipt,locale:"ko"}));
    assert.match(korean, /<details[^>]*\sopen(?:=|>|\s)/);
  });
  check("all 15 languages render saved model, fit, country and totals without Korean UI leakage", () => {
    const receipt = {...publicOrder, acknowledgedTerms:undefined, items:[{...publicOrder.items[0],name:"Synthetic shoe",size:"265 (남성)",sizeFit:"men",optionLabel:"장목"}]};
    for (const locale of ["en","ko","ja","zh","es","fr","de","it","pt","ru","tr","uz","th","hi","tl"]) {
      const html = renderToStaticMarkup(createElement(CustomerOrderDetails, {order:receipt,locale}));
      const copy = customerOrderDetailCopy(locale);
      assert.ok(html.includes(copy.details));
      assert.ok(html.includes(copy.men));
      assert.ok(html.includes(copy.customs_delay));
      assert.ok(html.includes("USD"), "saved USD currency must not change with display language");
      if (locale !== "ko") assert.doesNotMatch(html, /[가-힣]/u, locale);
    }
    assert.equal(receipt.items[0].optionLabel,"장목");
  });
  check("removed original products retain translated receipt names and embedded options; custom records stay intact", () => {
    const savedCache = getCatalogCache();
    setCatalogCache([]);
    try {
      const original = PRODUCTS.find(product => product.id === "viper-band");
      const item = {productId:original.id,name:`${original.name.ko} (블랙)`};
      for (const locale of ["en","ko","ja","zh","es","fr","de","it","pt","ru","tr","uz","th","hi","tl"]) {
        const display = customerOrderItemName(item,locale);
        const expectedName = locale === "ko" ? original.name.ko : catalogProductCopy(original.id,locale).name;
        assert.ok(display.startsWith(expectedName), `${locale}: preserve the Korean source name and localize other display names`);
        assert.ok(display.endsWith(")"),"historical embedded option must remain visible");
        if (locale !== "ko") assert.doesNotMatch(display,/[가-힣]/u,locale);
      }
      assert.equal(item.name,`${original.name.ko} (블랙)`);
      const custom = {...item,name:"CUSTOM BRAND 고객 특별 문구"};
      assert.equal(customerOrderItemName(custom,"ja"),custom.name);
      assert.equal(customerOrderItemName({...custom,productId:"removed-custom-product"},"en"),custom.name);
    } finally { setCatalogCache(savedCache); }
  });
  console.log(`${count} customer receipt/privacy checks passed; no external requests or writes.`);
} finally { await server.close(); }

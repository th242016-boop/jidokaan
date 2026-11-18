// Static customer-policy and historical-receipt regression tests. No network or writes.
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { createServer } from "vite";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

globalThis.fetch = async () => { throw new Error("OUTBOUND_NETWORK_BLOCKED"); };
const server = await createServer({configFile:false,root:process.cwd(),resolve:{alias:{"@":resolve("src")}},
  esbuild:{jsx:"automatic"},server:{middlewareMode:true},appType:"custom"});
let checks = 0;
const check = (name, fn) => { fn(); checks++; console.log(`PASS ${name}`); };
try {
  const { internationalOrderPolicy, internationalOrderPolicyHtml, isInternationalDestination } = await server.ssrLoadModule("/src/lib/international-order-policy.ts");
  const { internationalHomeCopy } = await server.ssrLoadModule("/src/components/home/international-copy.js");
  const { faqPageCopy } = await server.ssrLoadModule("/src/lib/faq-page-copy.js");
  const { customerOrder } = await server.ssrLoadModule("/src/lib/order-types.ts");
  const { CustomerOrderDetails } = await server.ssrLoadModule("/src/components/store/customer-order-details.tsx");
  const { orderEmailPayload } = await server.ssrLoadModule("/src/lib/customer-order-email.ts");
  const { ORDER_TERMS_VERSION } = await server.ssrLoadModule("/src/lib/design-order.ts");
  const locales = ["ko","en","ja","zh","zh-Hant","es","fr","de","it","pt","ru","tr","uz","th","hi","tl"];
  check("16 translated policies include the merchant's 12-hour cancellation window and 5% PayPal refund deduction", () => {
    const english = internationalOrderPolicy("en");
    for (const locale of locales) {
      const copy = internationalOrderPolicy(locale);
      for (const key of Object.keys(english)) {
        assert.ok(copy[key]?.trim(), `${locale}.${key}`);
        if (locale !== "en") assert.notEqual(copy[key], english[key], `${locale}.${key}: English fallback`);
      }
      assert.match(copy.cancellation,/12/);
      assert.doesNotMatch(copy.acknowledgement,/24/);
      assert.match(copy.paypalFee,/(?:5\s*%|%\s*5)/);
      assert.match(copy.paypalFee,/PayPal/);
      assert.ok(!copy.cancellation.includes("Instagram"), "cancellation must not require Instagram exclusively");
      assert.doesNotMatch(copy.paypalFee,/8\s*%/, "the displayed deduction must match the merchant's 5% policy");
      assert.equal(copy.acknowledgement, [copy.returns,copy.cancellation,copy.paypalFee].join(" "));
    }
    assert.match(english.paypalFee,/our refund policy/);
    assert.match(english.paypalFee,/total amount paid/);
    assert.equal(ORDER_TERMS_VERSION,"2026-11-16-international-review-v4");
  });
  check("delivery destination selects overseas policy independently of display language", () => {
    for (const country of ["KR"," kr ","",null,undefined]) assert.equal(isInternationalDestination(country),false);
    for (const country of ["US","HK","CN","JP","MX"," th "]) assert.equal(isInternationalDestination(country),true);
    for (const locale of locales) {
      for (const country of ["US","CA","AU","CN","HK","JP","SG","TH","PH","GB","CH","MX"]) {
        const expected = internationalOrderPolicyHtml(locale);
        assert.equal(internationalHomeCopy(locale,country).faqA4,expected,`${locale}/${country}: home`);
        assert.equal(faqPageCopy(locale,country).items[3].answerHtml,expected,`${locale}/${country}: FAQ`);
      }
      assert.equal(internationalHomeCopy(locale,"KR").faqA4,undefined,"domestic FAQ is not overridden");
      assert.notEqual(faqPageCopy(locale,"KR").items[3].answerHtml,internationalOrderPolicyHtml(locale));
    }
  });
  const raw = {
    id:"POLICY-TEST-ONLY",createdAt:"2026-11-16T00:00:00Z",email:"test@example.invalid",phone:"+12025550100",
    name:"Synthetic Buyer",address:"Test Street",city:"Test City",region:"CA",postal:"90210",country:"US",
    currency:"USD",pay:"paypal",status:"paid",shipMethod:"standard",totalUsd:335,shippingUsd:85,totalKrw:0,shippingKrw:0,
    checkoutLocale:"en",termsVersion:ORDER_TERMS_VERSION,
    acknowledgedTerms:{shipping:"Saved shipping",duty:"Saved duty",design:"Saved design",production:"Saved production",agree:"Saved consent",cancellationPolicy:internationalOrderPolicy("en").acknowledgement},
    items:[{productId:"drone-custom",name:"Synthetic boot",qty:1,size:"265",priceUsd:250,priceKrw:288000}],
  };
  const emailConfig = {from:"test@example.invalid",apiKey:"TEST",startAt:"2026-11-16T00:00:00Z"};
  check("new receipt and email carry the exact policy accepted at purchase", () => {
    const before = JSON.stringify(raw);
    const publicOrder = customerOrder(raw);
    const html = renderToStaticMarkup(createElement(CustomerOrderDetails,{order:publicOrder,locale:"zh-Hant"}));
    assert.ok(html.includes(raw.acknowledgedTerms.cancellationPolicy));
    assert.ok(orderEmailPayload(raw,emailConfig).text.includes(raw.acknowledgedTerms.cancellationPolicy));
    assert.equal(JSON.stringify(raw),before);
  });
  check("historical orders without policy snapshot do not acquire today's cancellation restriction", () => {
    const legacy = structuredClone(raw);
    legacy.termsVersion="2026-11-14-international-review-v2";
    delete legacy.acknowledgedTerms.cancellationPolicy;
    const before = JSON.stringify(legacy);
    const html = renderToStaticMarkup(createElement(CustomerOrderDetails,{order:customerOrder(legacy),locale:"en"}));
    assert.ok(!html.includes(internationalOrderPolicy("en").cancellation));
    assert.ok(!orderEmailPayload(legacy,emailConfig).text.includes(internationalOrderPolicy("en").cancellation));
    assert.equal(JSON.stringify(legacy),before);
  });
  check("saved earlier/custom policy text remains original and is HTML-escaped", () => {
    const earlier = structuredClone(raw);
    earlier.acknowledgedTerms.cancellationPolicy="Original accepted policy <script>never-run</script>";
    const html = renderToStaticMarkup(createElement(CustomerOrderDetails,{order:customerOrder(earlier),locale:"ja"}));
    assert.ok(html.includes("Original accepted policy &lt;script&gt;never-run&lt;/script&gt;"));
    assert.ok(!html.includes("<script>never-run</script>"));
    assert.ok(orderEmailPayload(earlier,emailConfig).text.includes(earlier.acknowledgedTerms.cancellationPolicy));
    assert.ok(!html.includes(internationalOrderPolicy("ja").cancellation));
  });
  check("historical orders preserve their saved production estimate and display the previous 24-hour refund policy", () => {
    const earlier = structuredClone(raw);
    earlier.termsVersion = "2026-11-16-international-review-v3";
    earlier.acknowledgedTerms.production = "Production takes an average of 20–30 days.";
    earlier.acknowledgedTerms.cancellationPolicy = "Cancellation requests within 24 hours; only actual unreturned PayPal fees may be deducted.";
    const before = JSON.stringify(earlier);
    const projected = customerOrder(earlier);
    assert.equal(projected.acknowledgedTerms.production,earlier.acknowledgedTerms.production);
    const html = renderToStaticMarkup(createElement(CustomerOrderDetails,{order:projected,locale:"en"}));
    const email = orderEmailPayload(earlier,emailConfig).text;
    for (const output of [html,email]) {
      assert.ok(output.includes(earlier.acknowledgedTerms.cancellationPolicy));
      assert.ok(!output.includes(internationalOrderPolicy("en").paypalFee));
      assert.ok(!output.includes(internationalOrderPolicy("en").cancellation));
    }
    assert.equal(JSON.stringify(earlier),before);
  });
  console.log(`${checks} policy checks passed (16 languages, 11 active foreign destinations plus historical CN, receipt/email preservation).`);
} finally { await server.close(); }

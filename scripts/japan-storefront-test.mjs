// Local pricing/display tests only. No SDK, payment, customer or shipping calls.
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { createServer } from "vite";

globalThis.fetch = async () => { throw Error("OUTBOUND_NETWORK_BLOCKED"); };
const server = await createServer({configFile:false, root:process.cwd(),
  resolve:{alias:{"@":resolve("src")}},server:{middlewareMode:true},appType:"custom"});
try {
  const {japanYenQuote} = await server.ssrLoadModule("/src/lib/order-money.ts");
  const {formatYen, storefrontProductPrice, storefrontProductCompare, paymentCurrencyNotice} = await server.ssrLoadModule("/src/lib/storefront-money.ts");
  const {LOCALES} = await server.ssrLoadModule("/src/lib/i18n.ts");
  const {PRODUCTS} = await server.ssrLoadModule("/src/lib/products.ts");
  const standard = PRODUCTS.find(p=>p.id==="drone-custom");
  const item = {productId:standard.id,qty:1,priceUsd:standard.priceUsd/100};
  const special={...standard,id:"synthetic-special",priceUsd:28000};
  assert.equal(item.priceUsd,250);
  for (const {id:locale} of LOCALES) {
    const japan=japanYenQuote("JP",[item]);
    assert.equal(japan.totalJpy,43000);
    assert.equal(storefrontProductPrice(standard,"USD","JP",locale),formatYen(37000,locale));
    assert.equal(storefrontProductPrice(special,"USD","JP",locale),formatYen(41500,locale));
    assert.ok(paymentCurrencyNotice(locale,"JPY").includes("JPY"));
    if(locale!=="en") assert.notEqual(paymentCurrencyNotice(locale,"JPY"),paymentCurrencyNotice("en","JPY"));
    assert.notEqual(paymentCurrencyNotice(locale,"JPY"),paymentCurrencyNotice(locale,"USD"));
    assert.ok(storefrontProductPrice(standard,"USD","US",locale).includes("250"));
    assert.equal(storefrontProductCompare({...standard,compareAtUsd:30000},"USD","JP"),null);
  }
  // The same component input changes currency immediately on destination or cart change.
  assert.equal(japanYenQuote("JP",[item]).currency,"JPY");
  assert.equal(japanYenQuote("US",[item]),null);
  assert.equal(japanYenQuote("JP",[item,{productId:"glove-strap",qty:1,priceUsd:20}]),null);
  assert.equal(japanYenQuote("JP",[{...item,priceUsd:280}]).totalJpy,47500);
  assert.equal(japanYenQuote("JP",[{...item,priceUsd:300}]),null);
  assert.equal(japanYenQuote("JP",[item]).totalJpy,43000);
  assert.equal(japanYenQuote("JP",[{...item,qty:2}]).totalJpy,86000);
  assert.equal(japanYenQuote("JP",[item],25).totalJpy,39300);
  assert.equal(storefrontProductPrice({...standard,priceUsd:28000},"USD","JP","ja"),formatYen(41500,"ja"));
  const mixed=japanYenQuote("JP",[item,{productId:special.id,qty:1,priceUsd:280,category:special.category,customizable:special.customizable}]);
  assert.equal(mixed.totalJpy,90500);assert.deepEqual(mixed.unitPricesJpy,[37000,41500]);
  assert.ok(formatYen(43000,"ja").includes("43,000"));
  assert.ok(!formatYen(43000,"ja").includes(".00"));
  console.log(`PASS Japan storefront: ${LOCALES.length} localized JPY notices/prices; standard 37,000, special 41,500, shipping 6,000; mixed shoe prices, USD unsupported prices/accessories; quantity and coupon; no fractional yen.`);
} finally { await server.close(); }

// Local translation/runtime checks. No browser, customer data, payment or network.
import assert from "node:assert/strict";
import { createServer } from "vite";
import { resolve } from "node:path";
const server = await createServer({configFile:false, root:process.cwd(),
  resolve:{alias:{"@":resolve("src")}}, server:{middlewareMode:true}, appType:"custom"});
const originals = {document:globalThis.document, fetch:globalThis.fetch};
globalThis.document = {createElement: () => ({})};
globalThis.fetch = async () => { throw Error("OUTBOUND_NETWORK_BLOCKED"); };
try {
  const {LOCALES} = await server.ssrLoadModule("/src/lib/i18n.ts");
  const {JAPAN_SPECIAL_PRICE_JPY} = await server.ssrLoadModule("/src/lib/order-money.ts");
  const {specialOrderCopy, specialOrderContactHref} = await server.ssrLoadModule("/src/lib/special-order-copy.ts");
  const {specialOrderHomeCopy} = await server.ssrLoadModule("/src/components/home/international-copy.js");
  const {createHomeLocale} = await server.ssrLoadModule("/src/components/home/locale.js");
  const keys = ["specialGalleryDescription", "specialDescription"];
  const nodes = keys.map(key => ({dataset:{i18n:key}, innerHTML:"Original fallback USD 280"}));
  const contactLinks = [{href:"", setAttribute(name,value){this[name]=value;}}];
  const select = {value:"ko", replaceChildren(){}, addEventListener(){}, removeEventListener(){}};
  const toggle = {getAttribute:()=>"false", setAttribute(){}};
  const root = {dataset:{}, querySelector:selector=>selector==="#site-language"?select:toggle,
    querySelectorAll:selector=>selector==="[data-i18n]"?nodes:selector==='[data-i18n="specialContact"]'?contactLinks:[], dispatchEvent(){}};
  const runtime = createHomeLocale(root, () => {});
  const yen = new Intl.NumberFormat("en-US").format(JAPAN_SPECIAL_PRICE_JPY);
  for (const {id:locale} of LOCALES) {
    const jp = specialOrderHomeCopy(locale, "JP");
    for (const key of keys) {
      assert.ok(jp[key].includes(`JPY ${yen}`),`${locale}/${key}: missing yen price`);
      assert.ok(jp[key].includes("Instagram"),`${locale}/${key}: overseas consultation lost`);
      assert.doesNotMatch(jp[key], /Naver|네이버/);
      assert.doesNotMatch(jp[key], /USD|280|undefined|NaN/);
      if(locale!=="en") assert.notEqual(jp[key], specialOrderHomeCopy("en","JP")[key]);
    }
    // Exercise the real merge order: destination changes replace stale earlier copy.
    for (const country of ["US", "JP", "KR", "HK", " jp ", " kr ", ""]) {
      const destination = country.trim().toUpperCase();
      const domestic = destination === "KR";
      const copy = specialOrderCopy(locale,country);
      assert.match(copy.notice, domestic ? /Naver|네이버/ : /Instagram/);
      assert.doesNotMatch(copy.notice, domestic ? /Instagram/ : /Naver|네이버/);
      assert.notEqual(copy.specialTotalNote, specialOrderCopy(locale, domestic ? "US" : "KR").specialTotalNote);
      runtime.applyLanguage(locale, country);
      const expectedHref = domestic ? `/contact?lang=${encodeURIComponent(locale)}` : "https://ig.me/m/jidokaan";
      assert.equal(specialOrderContactHref(locale,country),expectedHref);
      assert.equal(runtime.specialContactHref,expectedHref);
      assert.equal(contactLinks[0].href,expectedHref);
      for (const node of nodes) {
        const expected = specialOrderHomeCopy(locale,country)[node.dataset.i18n];
        assert.equal(node.innerHTML,expected,`${locale}/${country}: stale home text`);
        assert.equal(runtime.t(node.dataset.i18n),expected);
        assert.ok(node.innerHTML.includes(copy.notice));
        if(destination !== "JP") {
          assert.match(node.innerHTML, domestic ? /KRW 318,000/ : /USD 280/);
          assert.doesNotMatch(node.innerHTML,/JPY/);
        }
        if(domestic) assert.doesNotMatch(node.innerHTML,/USD/);
      }
    }
  }
  runtime.destroy();
  console.log(`PASS ${LOCALES.length} languages: special base JPY ${yen}/KRW 318,000/USD 280, regional consultation and live contact links, total-note and locale merge.`);
} finally {
  for(const [key,value] of Object.entries(originals)) {
    if(value===undefined) delete globalThis[key]; else globalThis[key]=value;
  }
  await server.close();
}

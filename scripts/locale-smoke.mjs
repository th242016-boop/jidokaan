// Isolated locale persistence/navigation checks. No browser, network or payment.
import assert from "node:assert/strict";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const server = await createServer({
  configFile: false,
  root,
  resolve: { alias: { "@": resolve(root, "src") } },
  server: { middlewareMode: true },
  appType: "custom",
});
const originals = {
  window: globalThis.window,
  sessionStorage: globalThis.sessionStorage,
  fetch: globalThis.fetch,
};
const persisted = new Map([
  [
    "jidokaan-store-v32",
    JSON.stringify({ state: { locale: "en", localePicked: true, currency: "USD" }, version: 0 }),
  ],
]);
const session = new Map([["jidokaan-ship-country", "US"]]);
const storage = (map) => ({
  getItem: (key) => map.get(key) ?? null,
  setItem: (key, value) => map.set(key, value),
  removeItem: (key) => map.delete(key),
});
globalThis.window = { localStorage: storage(persisted) };
globalThis.sessionStorage = storage(session);
globalThis.fetch = async () => {
  throw new Error("OUTBOUND_NETWORK_BLOCKED");
};
let count = 0;
async function check(label, fn) {
  await fn();
  count++;
  console.log(`PASS ${label}`);
}
try {
  const { useStore } = await server.ssrLoadModule("/src/lib/store.ts");
  const { syncLocalePreference, requestedLocale } = await server.ssrLoadModule(
    "/src/lib/locale-preference.ts",
  );
  const { LOCALES, t } = await server.ssrLoadModule("/src/lib/i18n.ts");
  const koreanMarket = { locale: "ko", currency: "KRW", code: "kr" };
  let detections = 0;
  const detectKorea = () => {
    detections++;
    return koreanMarket;
  };
  await check(
    "persisted English survives the Korean hydration snapshot and Korean location",
    () => {
      assert.equal(useStore.getInitialState().locale, "ko");
      assert.equal(useStore.getInitialState().localePicked, false);
      assert.equal(useStore.getState().locale, "en");
      syncLocalePreference(undefined, detectKorea);
      assert.equal(detections, 0);
      assert.equal(useStore.getState().locale, "en");
      assert.equal(JSON.parse(persisted.get("jidokaan-store-v32")).state.locale, "en");
      assert.equal(session.get("jidokaan-ship-country"), "US");
    },
  );
  await check("all manually selected languages outrank automatic detection", () => {
    for (const { id } of LOCALES) {
      useStore.getState().setLocale(id);
      syncLocalePreference(undefined, detectKorea);
      assert.equal(useStore.getState().locale, id);
    }
    assert.equal(detections, 0);
  });
  await check(
    "explicit simulator language works without saved preferences and preserves the design",
    () => {
      useStore.setState({ locale: "ko", localePicked: false, currency: "KRW" });
      session.set("jidokaan-ship-country", "KR");
      const before = useStore.getState();
      syncLocalePreference(requestedLocale("en"), detectKorea);
      const after = useStore.getState();
      assert.equal(after.locale, "en");
      assert.equal(after.localePicked, true);
      assert.equal(after.currency, "KRW");
      assert.equal(session.get("jidokaan-ship-country"), "KR");
      assert.equal(after.cart, before.cart);
      assert.equal(after.draftParts, before.draftParts);
      assert.equal(after.draftPartNames, before.draftPartNames);
      assert.equal(after.draftSize, before.draftSize);
      // A subsequent checkout page mount cannot replace the selection.
      syncLocalePreference(undefined, detectKorea);
      assert.equal(useStore.getState().locale, "en");
      assert.equal(detections, 0);
    },
  );
  await check("first-time visitors still receive automatic market selection", () => {
    useStore.setState({ locale: "ko", localePicked: false });
    syncLocalePreference(undefined, detectKorea);
    assert.equal(detections, 1);
    assert.equal(useStore.getState().locale, "ko");
    assert.equal(useStore.getState().localePicked, true);
    assert.equal(session.get("jidokaan-ship-country"), "KR");
    syncLocalePreference(undefined, detectKorea);
    assert.equal(detections, 1);
  });
  await check("unsupported or malformed URL languages cannot overwrite preferences", () => {
    for (const value of [null, undefined, {}, ["en"], "EN", "xx", "en<script>", "ar"])
      assert.equal(requestedLocale(value), undefined);
    useStore.getState().setLocale("en");
    syncLocalePreference(requestedLocale("xx"), detectKorea);
    assert.equal(useStore.getState().locale, "en");
    assert.equal(detections, 1);
  });
  await check("English simulator actions and order instructions contain no Korean", () => {
    const en = t("en");
    assert.equal(en.custom.lockOrder, "Lock design · Order");
    assert.equal(en.product.addToCart, "Add to cart");
    for (const text of Object.values(en.custom)) {
      if (typeof text === "string") assert.doesNotMatch(text, /[가-힣]/);
    }
    assert.notEqual(en.custom.lockOrder, t("ko").custom.lockOrder);
  });
  await check(
    "home entry links pass every home language across a full-page navigation",
    async () => {
      const { createHomeLocale } = await server.ssrLoadModule("/src/components/home/locale.js");
      const anchors = ["/customize", "/customize?source=gallery#preview", "/shop", "/shop?sort=price-asc#products"].map((href) => ({
        originalPath: new URL(href, "https://jidokaan.com").pathname,
        href,
        getAttribute() {
          return this.href;
        },
        setAttribute(_key, value) {
          this.href = value;
        },
      }));
      const select = { value: "ko", addEventListener() {}, removeEventListener() {} };
      const toggle = { getAttribute: () => "false", setAttribute() {} };
      const fakeRoot = {
        querySelector: (selector) => (selector === "#site-language" ? select : toggle),
        querySelectorAll: (selector) => (selector.startsWith("a[") ? anchors : []),
        dispatchEvent() {},
      };
      const runtime = createHomeLocale(fakeRoot, () => {});
      for (const lang of ["en", "ja", "zh", "es", "ko"]) {
        runtime.applyLanguage(lang);
        for (const anchor of anchors) {
          const url = new URL(anchor.href, "https://jidokaan.com");
          assert.equal(requestedLocale(url.searchParams.get("lang")), lang);
          assert.equal(url.pathname, anchor.originalPath);
        }
        assert.equal(
          new URL(anchors[1].href, "https://jidokaan.com").searchParams.get("source"),
          "gallery",
        );
        assert.ok(anchors[1].href.endsWith("#preview"));
        assert.equal(new URL(anchors[3].href, "https://jidokaan.com").searchParams.get("sort"), "price-asc");
        assert.ok(anchors[3].href.endsWith("#products"));
      }
      runtime.destroy();
    },
  );
  console.log(`${count} locale regression checks passed.`);
} finally {
  for (const [key, value] of Object.entries(originals)) {
    if (value === undefined) delete globalThis[key];
    else globalThis[key] = value;
  }
  await server.close();
}

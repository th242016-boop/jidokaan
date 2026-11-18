// Read-only state/quote regressions: no browser, database, credentials or network.
import assert from "node:assert/strict";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const server = await createServer({ configFile: false, root, resolve: { alias: { "@": resolve(root, "src") } }, server: { middlewareMode: true }, appType: "custom" });
const originals = Object.fromEntries(["window", "localStorage", "sessionStorage", "fetch"].map(key => [key, globalThis[key]]));
const memory = () => {
  const map = new Map();
  return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)), removeItem: key => map.delete(key), clear: () => map.clear() };
};
globalThis.localStorage = memory();
globalThis.sessionStorage = memory();
globalThis.window = { localStorage: globalThis.localStorage };
globalThis.fetch = async () => { throw new Error("NETWORK_DISABLED_FOR_TEST"); };

let count = 0;
const check = (name, test) => { test(); count++; console.log(`PASS ${name}`); };
try {
  const { useStore } = await server.ssrLoadModule("/src/lib/store.ts");
  const { syncLocalePreference } = await server.ssrLoadModule("/src/lib/locale-preference.ts");
  const { detectVisitorMarketFrom, FLAG_MARKETS, LOCALES } = await server.ssrLoadModule("/src/lib/i18n.ts");
  const { EMS_RATES_KRW } = await server.ssrLoadModule("/src/lib/ems-rates.ts");
  const { quoteShipping } = await server.ssrLoadModule("/src/lib/shipping.ts");
  const fresh = () => {
    sessionStorage.clear();
    useStore.setState({ locale: "en", localePicked: false, shippingCountry: "", shippingCountryInitialized: false, currency: "USD" });
  };

  check("unknown international visitors get English/USD with no guessed country", () => {
    for (const [language, zone] of [["en", "UTC"], ["pl-PL", "Europe/Warsaw"], ["", ""]]) {
      fresh();
      syncLocalePreference(undefined, () => detectVisitorMarketFrom(language, zone));
      assert.equal(useStore.getState().locale, "en");
      assert.equal(useStore.getState().shippingCountry, "");
      assert.equal(useStore.getState().currency, "USD");
    }
  });
  check("Hong Kong stays separate from mainland China; region does not select language", () => {
    for (const [language, zone, locale, country] of [
      ["zh-HK", "Asia/Hong_Kong", "zh", "hk"], ["zh-Hant-HK", "UTC", "zh", "hk"],
      ["en-HK", "Asia/Hong_Kong", "en", "hk"], ["en", "Europe/Zurich", "en", "ch"],
      ["fr-CA", "America/Toronto", "fr", "ca"], ["en-GB", "Europe/London", "en", "gb"],
      ["ko", "Asia/Seoul", "ko", "kr"], ["en-SG", "Asia/Singapore", "en", "sg"],
    ]) {
      const result = detectVisitorMarketFrom(language, zone);
      assert.equal(result.locale, locale);
      assert.equal(result.code, country);
    }
  });
  check("all language changes preserve country, quote, cart and finalized design", () => {
    fresh();
    useStore.getState().setShippingCountry("HK");
    useStore.getState().addCustomBoot(1, false);
    const before = useStore.getState();
    const quote = country => quoteShipping({ country, method: "standard", subtotalUsd: 250, subtotalKrw: 288000, qty: 1 });
    assert.equal(quote("HK").usd, 31);
    for (const { id } of LOCALES) {
      useStore.getState().setLocale(id);
      syncLocalePreference();
      const after = useStore.getState();
      assert.equal(after.shippingCountry, "HK");
      assert.equal(after.currency, "USD");
      assert.equal(quote(after.shippingCountry).usd, 31);
      assert.equal(after.cart, before.cart);
      assert.equal(after.draftParts, before.draftParts);
      assert.equal(after.draftPartNames, before.draftPartNames);
    }
  });
  check("changing destination preserves language and currency follows destination", () => {
    useStore.getState().setLocale("en");
    for (const [country, currency] of [["KR", "KRW"], ["US", "USD"], ["HK", "USD"], ["", "USD"]]) {
      useStore.getState().setShippingCountry(country);
      const state = useStore.getState();
      assert.equal(state.locale, "en");
      assert.equal(state.currency, currency);
      assert.equal(state.shippingCountry, country);
      assert.equal(sessionStorage.getItem("jidokaan-ship-country") || "", country);
    }
  });
  check("cleared destination stays empty on navigation; no automatic US or KR reset", () => {
    useStore.getState().setShippingCountry("");
    syncLocalePreference(undefined, () => detectVisitorMarketFrom("ko-KR", "Asia/Seoul"));
    assert.equal(useStore.getState().shippingCountry, "");
    assert.equal(useStore.getState().currency, "USD");
  });
  check("persisted destination survives new tab and cannot be overwritten by stale session", () => {
    useStore.getState().setShippingCountry("HK");
    sessionStorage.setItem("jidokaan-ship-country", "CN");
    syncLocalePreference();
    assert.equal(sessionStorage.getItem("jidokaan-ship-country"), "HK");
    assert.equal(JSON.parse(localStorage.getItem("jidokaan-store-v32")).state.shippingCountry, "HK");
  });
  check("rehydration derives currency from destination even if old persisted currency disagrees", () => {
    const persisted = JSON.parse(localStorage.getItem("jidokaan-store-v32"));
    persisted.state.currency = "KRW";
    persisted.state.shippingCountry = "HK";
    localStorage.setItem("jidokaan-store-v32", JSON.stringify(persisted));
    useStore.persist.rehydrate();
    assert.equal(useStore.getState().shippingCountry, "HK");
    assert.equal(useStore.getState().currency, "USD");
  });
  check("blocked session storage cannot change the in-memory destination or checkout currency", () => {
    const saved = globalThis.sessionStorage;
    globalThis.sessionStorage = { getItem() { throw new Error("storage blocked"); }, setItem() { throw new Error("storage blocked"); }, removeItem() { throw new Error("storage blocked"); } };
    try {
      useStore.getState().setShippingCountry("KR");
      useStore.getState().setLocale("en");
      syncLocalePreference();
      assert.equal(useStore.getState().shippingCountry, "KR");
      assert.equal(useStore.getState().currency, "KRW");
      assert.equal(useStore.getState().locale, "en");
    } finally { globalThis.sessionStorage = saved; }
  });
  check("existing session destination migrates without discarding cart or saved language", () => {
    fresh();
    useStore.getState().setLocale("ja");
    const cart = useStore.getState().cart;
    sessionStorage.setItem("jidokaan-ship-country", "US");
    syncLocalePreference(undefined, () => detectVisitorMarketFrom("ko", "Asia/Seoul"));
    assert.equal(useStore.getState().locale, "ja");
    assert.equal(useStore.getState().shippingCountry, "US");
    assert.equal(useStore.getState().cart, cart);
  });
  check("displayed destination flags exactly match domestic plus configured EMS rates", () => {
    assert.deepEqual(FLAG_MARKETS.map(m => m.code.toUpperCase()).sort(), ["KR", ...Object.keys(EMS_RATES_KRW)].sort());
    for (const country of ["", "IT", "ZA"]) assert.equal(quoteShipping({ country, method: "standard", subtotalUsd: 250, subtotalKrw: 288000, qty: 1 }).available, false);
  });
  console.log(`${count} international market regression checks passed.`);
} finally {
  for (const [key, value] of Object.entries(originals)) {
    if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
  }
  await server.close();
}

/** PayPal v5 supported component locales, verified against the official SDK configuration.
 * https://developer.paypal.com/sdk/js/v5/configuration#locale
 * data-namespace: https://developer.paypal.com/v5/pay-later/reference/
 * Locale selects display language only; it never changes destination, currency or eligibility.
 */
const locales: Record<string, string> = {
  en: "en_US", ko: "ko_KR", ja: "ja_JP", zh: "zh_CN", "zh-Hant": "zh_HK", es: "es_ES", fr: "fr_FR",
  de: "de_DE", it: "it_IT", pt: "pt_BR", ru: "ru_RU", tr: "tr_TR", th: "th_TH", tl: "tl_PH",
};
export function paypalLocale(locale: string) { return locales[locale] ?? "en_US"; }
export function paypalLocaleNotice(locale: string) {
  if (locales[locale]) return "";
  if (locale === "hi") return "PayPal के भुगतान बटन अंग्रेज़ी में दिखेंगे; हिंदी अभी समर्थित नहीं है। वेबसाइट की भाषा नहीं बदलेगी।";
  if (locale === "uz") return "PayPal to‘lov tugmalari ingliz tilida ko‘rsatiladi; o‘zbek tili hozircha qo‘llab-quvvatlanmaydi. Sayt tili o‘zgarmaydi.";
  return "PayPal’s payment buttons will appear in English; this language is not currently supported there. Your site language will stay the same.";
}
export type PaypalSdk = {
  Buttons: (options: Record<string, unknown>) => {
    render: (element: HTMLElement) => Promise<void>;
    close?: () => void | Promise<void>;
  };
};
type Registry = { sequence: number; loads: Map<string, Promise<PaypalSdk>> };
const registries = new WeakMap<Document, Registry>();

/** Per-client/per-locale/per-currency instances prevent an old window.paypal from silently winning.
 * The SDK remains on PayPal's official host; only loader code is bundled locally.
 */
export function loadPaypalSdk(clientId: string, locale: string, environment = {
  window: window as unknown as Record<string, unknown>, document, timeoutMs: 20000,
}, currency: "USD" | "JPY" = "USD"): Promise<PaypalSdk> {
  if (!clientId.trim()) return Promise.reject(new Error("PAYPAL_CLIENT_REQUIRED"));
  const { document: doc, window: win, timeoutMs } = environment;
  let registry = registries.get(doc);
  if (!registry) { registry = { sequence: 0, loads: new Map() }; registries.set(doc, registry); }
  const sdkLocale = paypalLocale(locale);
  const key = JSON.stringify([clientId, sdkLocale, currency]);
  const existing = registry.loads.get(key);
  if (existing) return existing;
  const namespace = `jidokaanPaypal_${sdkLocale}_${currency}_${++registry.sequence}`;
  const script = doc.createElement("script");
  const params = new URLSearchParams({ "client-id": clientId, currency, intent: "capture", components: "buttons", locale: sdkLocale });
  script.src = `https://www.paypal.com/sdk/js?${params}`;
  script.async = true;
  script.setAttribute("data-namespace", namespace);
  script.setAttribute("data-jidokaan-paypal", sdkLocale);
  const promise = new Promise<PaypalSdk>((resolve, reject) => {
    let settled = false;
    const fail = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      script.onload = script.onerror = null;
      script.remove();
      registry!.loads.delete(key);
      reject(new Error("PAYPAL_SDK_UNAVAILABLE"));
    };
    const timer = setTimeout(fail, timeoutMs);
    script.onerror = fail;
    script.onload = () => {
      const sdk = win[namespace] as PaypalSdk | undefined;
      if (!sdk || typeof sdk.Buttons !== "function") { fail(); return; }
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      script.onload = script.onerror = null;
      resolve(sdk);
    };
    try { doc.body.appendChild(script); } catch { fail(); }
  });
  registry.loads.set(key, promise);
  // Also evict if insertion failed synchronously, before the cache entry existed.
  void promise.catch(() => { if (registry!.loads.get(key) === promise) registry!.loads.delete(key); });
  return promise;
}

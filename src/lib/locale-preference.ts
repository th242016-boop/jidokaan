import { detectVisitorMarket, LOCALES, type Locale } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { readLegacyShippingCountry, writeShippingCountrySession } from "./shipping-destination";

export function requestedLocale(value: unknown): Locale | undefined {
  if (typeof value !== "string") return undefined;
  const tag = value.replace(/_/g, "-").toLowerCase();
  if (/^zh-(hant|hk|tw|mo)(-|$)/.test(tag)) return "zh-Hant";
  if (/^zh-(hans|cn|sg)(-|$)/.test(tag)) return "zh";
  return LOCALES.find((entry) => entry.id === value)?.id;
}

/** Read the live persisted state, not React's initial server/hydration snapshot. */
export function syncLocalePreference(explicitLocale?: Locale, detectMarket = detectVisitorMarket) {
  const state = useStore.getState();
  // A destination is a separate preference. Migrate legacy session data once;
  // later language switches must never overwrite it, including an empty choice.
  if (!state.shippingCountryInitialized) {
    const legacyCountry = readLegacyShippingCountry();
    if (legacyCountry) state.setShippingCountry(legacyCountry);
    // Browser language/time zone only choose a language. Delivery country is
    // chosen by the customer and is never inferred from an IP address.
  } else {
    writeShippingCountrySession(state.shippingCountry);
  }
  if (explicitLocale && requestedLocale(explicitLocale)) {
    // Language is independent of the customer's delivery country and currency.
    if (state.locale !== explicitLocale || !state.localePicked) state.setLocale(explicitLocale);
    return;
  }
  if (state.locale === "ar") {
    state.setLocale("en");
    return;
  }
  if (state.localePicked) return;
  const market = detectMarket();
  state.setLocale(market?.locale ?? "en");
}

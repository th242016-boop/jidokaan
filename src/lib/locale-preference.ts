import { detectVisitorMarket, LOCALES, type Locale } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export function requestedLocale(value: unknown): Locale | undefined {
  return LOCALES.find((entry) => entry.id === value)?.id;
}

/** Read the live persisted state, not React's initial server/hydration snapshot. */
export function syncLocalePreference(explicitLocale?: Locale, detectMarket = detectVisitorMarket) {
  const state = useStore.getState();
  if (explicitLocale && requestedLocale(explicitLocale)) {
    // Language is independent of the customer's delivery country and currency.
    if (state.locale !== explicitLocale || !state.localePicked) state.setLocale(explicitLocale);
    return;
  }
  if (state.locale === "ar") {
    state.applyMarket("en", "USD", true);
    return;
  }
  if (state.localePicked) return;
  const market = detectMarket();
  if (!market) return;
  state.applyMarket(market.locale, market.currency, true);
  try {
    sessionStorage.setItem("jidokaan-ship-country", market.code.toUpperCase());
  } catch {
    // Storage can be unavailable in private browsing.
  }
}

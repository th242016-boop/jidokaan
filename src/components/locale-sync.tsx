import { useEffect } from "react";
import { detectVisitorMarket, HTML_LANG } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export function LocaleSync() {
  const locale = useStore((s) => s.locale);
  const localePicked = useStore((s) => s.localePicked);
  const applyMarket = useStore((s) => s.applyMarket);

  useEffect(() => {
    if (localePicked) return;
    const market = detectVisitorMarket();
    if (!market) return;
    applyMarket(market.locale, market.currency, true);
    try {
      sessionStorage.setItem("jidokaan-ship-country", market.code.toUpperCase());
    } catch {
      /* ignore */
    }
  }, [localePicked, applyMarket]);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale] ?? "ko";
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  return null;
}

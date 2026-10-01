import { useEffect } from "react";
import { HTML_LANG, type Locale } from "@/lib/i18n";
import { syncLocalePreference } from "@/lib/locale-preference";
import { useStore } from "@/lib/store";

export function LocaleSync({ requestedLocale }: { requestedLocale?: Locale }) {
  const locale = useStore((s) => s.locale);

  useEffect(() => {
    syncLocalePreference(requestedLocale);
  }, [requestedLocale]);

  useEffect(() => {
    const currentLocale = useStore.getState().locale;
    document.documentElement.lang =
      currentLocale === "ar" ? "en" : (HTML_LANG[currentLocale] ?? "ko");
    document.documentElement.dir = "ltr";
  }, [locale]);

  return null;
}

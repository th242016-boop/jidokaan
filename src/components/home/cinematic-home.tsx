import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ShoppingBag, UserRound, LogOut } from "lucide-react";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { LocaleSync } from "@/components/locale-sync";
import { SeoTags } from "@/components/seo-tags";
import { CartDrawer } from "@/components/store/cart-drawer";
import { authEnabled, signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { FLAG_MARKETS, t, type Locale } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";
import { DEFAULT_COMPANY, DEFAULT_SUPPORT, type InfoRow } from "@/lib/site-defaults";
import { createHomeLocale, type HomeLocale } from "./locale.js";
import { mountHomeMotion } from "./motion.js";
import approvedMarkup from "./page.html?raw";

const markup = { __html: approvedMarkup };
const homeLanguages = new Set(["ko", "en", "ja", "zh", "es"]);

function pickLocale(next: string) {
  if (!homeLanguages.has(next)) return;
  const market = FLAG_MARKETS.find((entry) => entry.locale === next);
  useStore.getState().applyMarket(next as Locale, next === "ko" ? "KRW" : "USD", true);
  try {
    sessionStorage.setItem("jidokaan-ship-country", (next === "ko" ? "KR" : (market?.code ?? "us")).toUpperCase());
  } catch { /* Storage may be unavailable in private browsing. */ }
}

// Keep the existing administrator's company/support settings live on the new home.
// Values are inserted as text; only the approved fixed copy contains markup.
function updateInfoRows(root: HTMLElement, selector: string, rows: InfoRow[], defaults: InfoRow[], labels: string[], values: (string | null)[], copy: HomeLocale) {
  const list = root.querySelector(selector);
  if (!list) return;
  const fragment = document.createDocumentFragment();
  for (const row of rows.length ? rows : defaults) {
    const index = defaults.findIndex((item) => item.label === row.label);
    const entry = document.createElement("div");
    const label = document.createElement("dt");
    label.textContent = index >= 0 ? copy.t(labels[index]) : row.label;
    const value = document.createElement("dd");
    const key = index >= 0 ? values[index] : null;
    const text = key && row.value === defaults[index].value ? copy.t(key) : row.value;
    if (row.href && /^(https?:|mailto:|tel:|\/(?!\/))/.test(row.href)) {
      const link = document.createElement("a");
      link.href = row.href;
      link.textContent = text;
      value.append(link);
    } else value.textContent = text;
    entry.append(label, value);
    fragment.append(entry);
  }
  list.replaceChildren(fragment);
}

export function CinematicHome() {
  const rootRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<{copy: HomeLocale; motion: ReturnType<typeof mountHomeMotion>} | null>(null);
  const [accountSlot, setAccountSlot] = useState<HTMLElement | null>(null);
  const locale = useStore((state) => state.locale);
  const cartCount = useStore((state) => state.cartCount());
  const setCartOpen = useStore((state) => state.setCartOpen);
  const { user, isPending } = useCurrentUserState();
  const { catalog } = useCatalog();
  const dict = t(locale);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const requested = new URLSearchParams(location.search).get("lang");
    if (requested && homeLanguages.has(requested)) pickLocale(requested);
    const copy = createHomeLocale(root, pickLocale);
    const motion = mountHomeMotion(root, copy);
    runtimeRef.current = {copy, motion};
    setAccountSlot(root.querySelector<HTMLElement>("[data-account-tools]"));
    return () => {
      motion.destroy();
      copy.destroy();
      runtimeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const runtime = runtimeRef.current;
    if (!root || !runtime) return;
    runtime.copy.applyLanguage(locale);
    updateInfoRows(root, "[data-company-rows]", catalog.company, DEFAULT_COMPANY,
      ["companyNameLabel", "ownerLabel", "addressLabel", "phoneLabel", "businessLabel", "commerceLabel"],
      ["companyName", "owner", "address", null, null, "commerce"], runtime.copy);
    updateInfoRows(root, "[data-support-rows]", catalog.support, DEFAULT_SUPPORT,
      ["emailLabel", "contactPhoneLabel", "hoursLabel", "closedLabel"],
      [null, null, "hours", "closed"], runtime.copy);
    const notice = root.querySelector<HTMLElement>("[data-store-notice]");
    if (notice) {
      notice.textContent = catalog.notice.text;
      notice.hidden = !catalog.notice.enabled || !catalog.notice.text;
    }
    runtime.motion.measure();
  }, [locale, catalog]);

  return <>
    <LocaleSync />
    <AnalyticsTracker />
    <SeoTags title={catalog.seo.title} description={catalog.seo.description} keywords={catalog.seo.keywords} />
    <div id="cinematic-home" ref={rootRef} dangerouslySetInnerHTML={markup} />
    {accountSlot && createPortal(<>
      <button type="button" onClick={() => setCartOpen(true)} aria-label={dict.nav.cart} title={dict.nav.cart}>
        <ShoppingBag size={19} strokeWidth={1.4} />
        {cartCount > 0 && <span className="home-cart-count">{cartCount}</span>}
      </button>
      {user && authEnabled ? <button type="button" onClick={() => void signOut()} disabled={isPending} aria-label={locale === "ko" ? "로그아웃" : "Log out"} title={locale === "ko" ? "로그아웃" : "Log out"}><LogOut size={19} strokeWidth={1.4} /></button>
        : <a href="/login" aria-label={dict.nav.signIn} title={dict.nav.signIn}><UserRound size={19} strokeWidth={1.4} /></a>}
    </>, accountSlot)}
    <CartDrawer />
  </>;
}

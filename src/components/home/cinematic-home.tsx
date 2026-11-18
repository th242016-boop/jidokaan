import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ShoppingBag, UserRound, LogOut } from "lucide-react";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { LocaleSync } from "@/components/locale-sync";
import { SeoTags } from "@/components/seo-tags";
import { CartDrawer } from "@/components/store/cart-drawer";
import { authEnabled, signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { LOCALES, t, type Locale } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";
import { DEFAULT_COMPANY, DEFAULT_SUPPORT, type InfoRow } from "@/lib/site-defaults";
import { createHomeLocale, type HomeLocale } from "./locale.js";
import { mountHomeMotion } from "./motion.js";
import { HomeShop } from "./home-shop";
import { HomeRegionSelect } from "./region-select";
import { PurchaseGuide } from "./purchase-guide";
import approvedMarkup from "./page.html?raw";

const markup = { __html: approvedMarkup };
const homeLanguages = new Set<string>(LOCALES.map(l => l.id));

function pickLocale(next: string) {
  if (!homeLanguages.has(next)) return;
  useStore.getState().setLocale(next as Locale);
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
    let text = key && row.value === defaults[index].value ? copy.t(key) : row.value;
    let href = row.href;
    // Catalog rows are rendered after locale.applyLanguage, so normalize here too.
    if (copy.locale !== "ko" && href?.startsWith("tel:")) {
      const number = href.slice(4).replace(/[\s()-]/g, "");
      if (number === "01034815598" || number === "+821034815598") {
        href = "tel:+821034815598";
        text = "+82 10 3481 5598";
      }
    }
    if (href && /^(https?:|mailto:|tel:|\/(?!\/))/.test(href)) {
      const link = document.createElement("a");
      link.href = href;
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
  const [regionSlot, setRegionSlot] = useState<HTMLElement | null>(null);
  const [accountSlot, setAccountSlot] = useState<HTMLElement | null>(null);
  const [purchaseSlot, setPurchaseSlot] = useState<HTMLElement | null>(null);
  const [shopSlot, setShopSlot] = useState<HTMLElement | null>(null);
  const locale = useStore((state) => state.locale);
  const shippingCountry = useStore((state) => state.shippingCountry);
  const currency = useStore((state) => state.currency);
  const cartCount = useStore((state) => state.cartCount());
  const setCartOpen = useStore((state) => state.setCartOpen);
  const { user, isPending } = useCurrentUserState();
  const { catalog, ready } = useCatalog();
  const dict = t(locale);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const requested = new URLSearchParams(location.search).get("lang");
    if (requested && homeLanguages.has(requested)) pickLocale(requested);
    const language = root.querySelector<HTMLSelectElement>("#site-language");
    if (language) language.replaceChildren(...LOCALES.map(l => { const option = document.createElement("option"); option.value = l.id; option.lang = l.id; option.textContent = l.native; return option; }));
    const copy = createHomeLocale(root, pickLocale);
    const motion = mountHomeMotion(root, copy);
    runtimeRef.current = {copy, motion};
    setRegionSlot(root.querySelector<HTMLElement>("[data-home-region]"));
    setAccountSlot(root.querySelector<HTMLElement>("[data-account-tools]"));
    setShopSlot(root.querySelector<HTMLElement>("[data-home-shop]"));
    setPurchaseSlot(root.querySelector<HTMLElement>("[data-purchase-guide]"));
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
    runtime.copy.applyLanguage(locale, shippingCountry);
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
  }, [locale, shippingCountry, catalog]);

  return <>
    <LocaleSync />
    <AnalyticsTracker />
    <SeoTags title={catalog.seo.title} description={catalog.seo.description} keywords={catalog.seo.keywords} />
    <div id="cinematic-home" className="shopping-first" ref={rootRef} dangerouslySetInnerHTML={markup} />
    {regionSlot && createPortal(<HomeRegionSelect />, regionSlot)}
    {purchaseSlot && createPortal(<PurchaseGuide />, purchaseSlot)}
    {shopSlot && createPortal(<HomeShop products={catalog.products} ready={ready} locale={locale} currency={currency} />, shopSlot)}
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

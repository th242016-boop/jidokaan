import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { japanYenQuote } from "@/lib/order-money";
import { isActiveSalesCountry } from "@/lib/active-sales-policy";
import { ArrowUpRight, Check, ChevronDown, Globe2 } from "lucide-react";
import { LOCALES, t } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";
import { quoteShipping } from "@/lib/shipping";
import { internationalShoppingCopy } from "@/lib/international-shopping-copy";
import { checkoutEnhancementsCopy } from "@/lib/checkout-enhancements-copy";
import { countryImportPolicy, countryImportNotice } from "@/lib/country-import-policy";
import { specialOrderCopy, specialOrderContactHref } from "@/lib/special-order-copy";
import { specialOrderProduct } from "@/lib/special-order";
import { internationalOrderPolicy } from "@/lib/international-order-policy";
import { JAPAN_SPECIAL_PRICE_JPY, JAPAN_STANDARD_PRICE_JPY } from "@/lib/order-money";

/** The same catalog, selected order tier and quote calculator used by checkout. */
export function PurchaseGuide() {
  const locale = useStore((s) => s.locale);
  const setLocale = useStore((s) => s.setLocale);
  const country = useStore((s) => s.shippingCountry);
  const setCountry = useStore((s) => s.setShippingCountry);
  // Each home visit starts at the standard tier, independently of a saved draft.
  // Country/language changes on this page retain the customer's current choice.
  const [specialOrder, setSelectedSpecialOrder] = useState(false);
  const setDraftSpecialOrder = useStore((s) => s.setDraftSpecialOrder);
  const setSpecialOrder = (selected: boolean) => {
    setSelectedSpecialOrder(selected);
    setDraftSpecialOrder(selected);
  };
  useEffect(() => {
    setDraftSpecialOrder(false);
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      setSelectedSpecialOrder(false);
      setDraftSpecialOrder(false);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [setDraftSpecialOrder]);
  const { catalog } = useCatalog();
  const copy = internationalShoppingCopy(locale);
  const guidance = checkoutEnhancementsCopy(locale);
  const orderPolicy = internationalOrderPolicy(locale);
  const policy = countryImportPolicy(country);
  const baseProduct = catalog.products.find((p) => p.id === "drone-custom");
  const product = baseProduct ? specialOrderProduct(baseProduct, specialOrder) : undefined;
  const domestic = country === "KR";
  const specialCopy = specialOrderCopy(locale, country);
  const specialExtra = domestic ? "+₩30,000" : country === "JP"
    ? `+¥${(JAPAN_SPECIAL_PRICE_JPY - JAPAN_STANDARD_PRICE_JPY).toLocaleString("en-US")}` : "+US$30";
  const countryNames = new Intl.DisplayNames([locale === "tl" ? "fil" : locale], {
    type: "region",
  });
  const countries = ["KR", ...Object.keys(catalog.shipping.countryRates ?? {})]
    .filter((value, index, values) => values.indexOf(value) === index && isActiveSalesCountry(value))
    .sort((a, b) => (countryNames.of(a) ?? a).localeCompare(countryNames.of(b) ?? b, locale));
  const quote = quoteShipping({
    country,
    method: "standard",
    subtotalKrw: product?.priceKrw ?? 0,
    subtotalUsd: (product?.priceUsd ?? 0) / 100,
    qty: 1,
    items: product ? [{ ...product, qty: 1 }] : undefined,
    settings: catalog.shipping,
  });
  const yen = japanYenQuote(country, product ? [{productId: product.id, qty: 1, priceUsd: product.priceUsd / 100}] : []);
  const needsConsultation = !domestic && policy.consultationRequired;
  const hasQuote = Boolean(country && product && quote.available && !needsConsultation);
  const amount = (value: number) =>
    new Intl.NumberFormat(locale === "tl" ? "fil" : locale, {
      style: "currency",
      currency: domestic ? "KRW" : yen ? "JPY" : "USD",
      currencyDisplay: "code",
      minimumFractionDigits: domestic || yen ? 0 : 2,
      maximumFractionDigits: domestic || yen ? 0 : 2,
    }).format(value);
  const itemPrice = domestic ? product?.priceKrw : yen ? yen.unitPricesJpy[0] : (product?.priceUsd ?? 0) / 100;
  const shippingPrice = domestic ? quote.krw : yen ? yen.shippingJpy : quote.usd;
  return (
    <>
      <div className="purchase-guide" aria-label={copy.title}>
        <div className="purchase-guide-selectors">
          <label>
            <span>
              <Globe2 size={15} aria-hidden="true" />
              {copy.language}
            </span>
            <select
              value={locale}
              onChange={(event) => setLocale(event.target.value as typeof locale)}
            >
              {LOCALES.map((language) => (
                <option key={language.id} value={language.id}>
                  {language.native}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{copy.shipTo}</span>
            <select value={isActiveSalesCountry(country) ? country : ""} onChange={(event) => setCountry(event.target.value)}>
              <option value="">{copy.chooseCountry}</option>
              {countries.map((code) => (
                <option key={code} value={code}>
                  {countryNames.of(code) ?? code}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="purchase-guide-order-type" role="group" aria-label={specialCopy.special}>
          <button type="button" aria-pressed={!specialOrder} onClick={() => setSpecialOrder(false)}>
            {specialCopy.standard}
          </button>
          <button type="button" aria-pressed={specialOrder} onClick={() => setSpecialOrder(true)}>
            {specialCopy.special} <span>({specialExtra})</span>
          </button>
        </div>
        <div className="purchase-guide-total" aria-live="polite" aria-atomic="true">
          <span>{copy.total}</span>
          <strong>{hasQuote ? amount((itemPrice ?? 0) + shippingPrice) : "—"}</strong>
        </div>
        <dl className="purchase-guide-breakdown">
          <div>
            <dt>{copy.item}{specialOrder ? ` · ${specialCopy.special}` : ""}</dt>
            <dd>{product && itemPrice != null ? amount(itemPrice) : "—"}</dd>
          </div>
          <div>
            <dt>{domestic ? t(locale).cart.shipping : copy.shipping}</dt>
            <dd>{hasQuote ? amount(shippingPrice) : "—"}</dd>
          </div>
        </dl>
        <p className="purchase-guide-note">
          {country && !policy.salesAvailable
            ? guidance.salesUnavailable
            : needsConsultation
            ? guidance.consult
            : country && !quote.available
              ? copy.unknownCountry
              : country
                ? specialOrder ? specialCopy.specialTotalNote : domestic ? `${specialCopy.standard} · ${copy.item}` : copy.totalNote
                : copy.chooseCountry}
        </p>
        {specialOrder && (
          <div className="purchase-guide-special-notice" data-special-order-notice>
            <p role="status">{specialCopy.notice}</p>
            {domestic ? (
              <Link className="purchase-guide-consult" to="/contact" search={{ lang: locale, country }}>
                {specialCopy.contactLabel}
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            ) : (
              <a className="purchase-guide-consult" href={specialOrderContactHref(locale, country)} target="_blank" rel="noopener noreferrer">
                {specialCopy.contactLabel}
                <ArrowUpRight size={17} aria-hidden="true" />
              </a>
            )}
          </div>
        )}
        <div className="purchase-guide-actions">
          <Link
            className="purchase-guide-start"
            to="/customize"
            search={{ lang: locale }}
            onClick={() => setDraftSpecialOrder(specialOrder)}
          >
            {copy.startDesign}
            <ArrowUpRight size={19} aria-hidden="true" />
          </Link>
        </div>
        <p className="purchase-guide-guest">
          <Check size={16} aria-hidden="true" />
          <span>{domestic ? `${copy.domestic} ${copy.domesticFollowup}` : copy.guest}</span>
        </p>
        <p className="purchase-guide-production">
          <span>{copy.productionLabel}</span>
          <strong>{copy.production}</strong>
        </p>
        <aside className="purchase-guide-order-policy" aria-label={orderPolicy.title}>
          <strong>{orderPolicy.title}</strong>
          <ul>
            <li>{orderPolicy.returns}</li>
            <li>{orderPolicy.cancellation}</li>
            <li>{orderPolicy.paypalFee}</li>
          </ul>
        </aside>
        {needsConsultation && (
          <aside className="purchase-guide-country-advisory" aria-live="polite">
            <strong>{guidance.noticeTitle}</strong>
            <p>{countryImportNotice(country, locale)}</p>
            <a href={`/contact?lang=${encodeURIComponent(locale)}&country=${encodeURIComponent(country)}`}>
              {guidance.consult}
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </aside>
        )}
        <details className="purchase-guide-details">
          <summary>
            {copy.help}
            <ChevronDown size={17} aria-hidden="true" />
          </summary>
          <div className="purchase-guide-expanded">
            {!domestic && (
              <>
                <p>{guidance.guestNote}</p>
                <p>{copy.transit}</p>
                {country ? <p>{countryImportNotice(country, locale)}</p> : <p>{copy.duties}</p>}
              </>
            )}
            {domestic && <p>{copy.domesticFollowup}</p>}
            {!["ko", "en", "ja", "zh", "zh-Hant", "es"].includes(locale) && <p>{copy.otherSectionsEnglish}</p>}
            <a href="#atelier">
              {copy.help}
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </details>
      </div>
      <div className="purchase-guide-mobile-visual" aria-hidden="true">
        <img src="/homepage/assets/hero-portrait.webp" alt="" width="1408" height="1408" />
      </div>
    </>
  );
}

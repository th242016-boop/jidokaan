import { activeSalesCountries, isActiveSalesCountry } from "@/lib/active-sales-policy";
import { COUNTRIES, t } from "@/lib/i18n";
import { internationalShoppingCopy } from "@/lib/international-shopping-copy";
import { useStore } from "@/lib/store";

/** Compact manual override remains reachable on the domestic brand homepage. */
export function HomeRegionSelect() {
  const locale = useStore(state => state.locale);
  const country = useStore(state => state.shippingCountry);
  const setCountry = useStore(state => state.setShippingCountry);
  const names = new Intl.DisplayNames([locale === "tl" ? "fil" : locale], { type: "region" });
  const label = t(locale).checkout.country;
  return <label className="home-region-control" title={label}>
    <span className="visually-hidden">{label}</span>
    <span className="home-region-value" aria-hidden="true">{isActiveSalesCountry(country) ? country : "🌐"}<span>⌄</span></span>
    <select aria-label={label} value={isActiveSalesCountry(country) ? country : ""} onChange={event => setCountry(event.target.value)}>
      <option value="">🌐 · {internationalShoppingCopy(locale).chooseCountry}</option>
      {activeSalesCountries(COUNTRIES).map(entry => <option key={entry.code} value={entry.code}>{entry.code} · {names.of(entry.code) ?? entry.en}</option>)}
    </select>
  </label>;
}

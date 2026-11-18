import { useId } from "react";
import { activeSalesCountries, isActiveSalesCountry } from "@/lib/active-sales-policy";
import { checkoutCopy } from "@/lib/checkout-copy";
import { checkoutEnhancementsCopy } from "@/lib/checkout-enhancements-copy";
import { COUNTRIES, t } from "@/lib/i18n";
import { useStore } from "@/lib/store";

/** Shared delivery selector; phone numbering countries are deliberately separate. */
export function ShippingCountrySelect() {
  const id = useId();
  const locale = useStore((s) => s.locale);
  const country = useStore((s) => s.shippingCountry);
  const setCountry = useStore((s) => s.setShippingCountry);
  const active = isActiveSalesCountry(country);
  const names = new Intl.DisplayNames([locale === "tl" ? "fil" : locale], { type: "region" });
  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">{t(locale).checkout.country}</label>
      <select
        id={id}
        value={active ? country : ""}
        onChange={(event) => setCountry(event.target.value)}
        className="min-h-11 w-full min-w-0 max-w-full rounded-lg border border-neutral-300 bg-white px-3 text-base text-neutral-950"
      >
        <option value="">{checkoutCopy(locale).selectCountry}</option>
        {activeSalesCountries(COUNTRIES).map((entry) => (
          <option key={entry.code} value={entry.code}>{names.of(entry.code) ?? entry.en}</option>
        ))}
      </select>
      {country && !active ? (
        <p role="alert" className="text-sm leading-relaxed text-red-700">{checkoutEnhancementsCopy(locale).salesUnavailable}</p>
      ) : null}
    </div>
  );
}

import { japanYenQuote } from "@/lib/order-money";
import { formatYen } from "@/lib/storefront-money";
import { activeSalesCountries } from "@/lib/active-sales-policy";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/store/site-shell";
import { t, COUNTRIES, countryName } from "@/lib/i18n";
import { checkoutCopy } from "@/lib/checkout-copy";
import { DEFAULT_SHIPPING, shipCopy, applyEmsPolicy } from "@/lib/shipping";
import { useStore } from "@/lib/store";
import { internationalShoppingCopy } from "@/lib/international-shopping-copy";
import { useCatalog } from "@/lib/use-catalog";
import { countryImportPolicy, countryImportNotice } from "@/lib/country-import-policy";
import { checkoutEnhancementsCopy } from "@/lib/checkout-enhancements-copy";
import { internationalOrderPolicy, isInternationalDestination } from "@/lib/international-order-policy";

export const Route = createFileRoute("/shipping")({
  component: ShippingPage,
});

function ShippingPage() {
  const locale = useStore((s) => s.locale);
  const shippingCountry = useStore((s) => s.shippingCountry);
  const international = isInternationalDestination(shippingCountry);
  const orderPolicy = internationalOrderPolicy(locale);
  const dict = t(locale);
  const { catalog } = useCatalog();
  const copy = shipCopy(locale);
  const settings = applyEmsPolicy(catalog.shipping ?? DEFAULT_SHIPPING);
  const review = checkoutCopy(locale);
  const shopping = internationalShoppingCopy(locale);
  const improvement = checkoutEnhancementsCopy(locale);
  const standardProduct = catalog.products.find(product => product.id === "drone-custom");
  const japan = japanYenQuote("JP", standardProduct ? [{productId: standardProduct.id,qty:1,priceUsd:standardProduct.priceUsd / 100}] : []);

  return (
    <SiteShell>
      <div className="container-page py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {dict.shippingPage.title}
          </h1>
          <p className="mt-4 text-lg text-muted">{copy.production}</p>
          <p className="mt-4 text-sm leading-relaxed text-muted">{improvement.declaration}</p>

          <h2 className="mt-12 text-xl font-semibold">{shopping.shipping}</h2>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-surface-muted text-xs uppercase tracking-wide text-subtle">
                <tr>
                  <th className="px-4 py-3">{dict.checkout.country}</th>
                  <th className="px-4 py-3">EMS</th>
                </tr>
              </thead>
              <tbody>
                {activeSalesCountries(COUNTRIES).filter((c) => c.code !== "KR" && settings.countryRates?.[c.code]).map((c) => {
                  const r = settings.countryRates?.[c.code];
                  const policy = countryImportPolicy(c.code);
                  return (
                    <tr key={c.code} className="border-t border-border">
                      <td className="px-4 py-3">
                        <p className="font-medium">{new Intl.DisplayNames([locale === "tl" ? "fil" : locale], { type: "region" }).of(c.code) ?? countryName(c, locale)}</p>
                        <details className="mt-2 max-w-xl leading-relaxed"><summary className="min-h-11 cursor-pointer py-2 text-sm underline">{policy.consultationRequired ? improvement.consult : improvement.noticeTitle}</summary><p className="mb-3">{countryImportNotice(c.code, locale)}</p>{policy.consultationRequired ? <a href={`/contact?lang=${encodeURIComponent(locale)}&country=${c.code}`} className="inline-flex min-h-11 items-center font-semibold underline">{improvement.consult} ↗</a> : null}</details>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {policy.consultationRequired ? "—" : c.code === "JP" && japan ? formatYen(japan.shippingJpy, locale) : r ? `USD ${r.usd.toFixed(2)}` : review.unavailable}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-muted">{shopping.totalNote}</p>
          <p className="mt-3 text-sm text-muted">{copy.extra}</p>

          <div className="mt-10 rounded-3xl border border-border bg-surface-muted/50 p-6 sm:p-8">
            <h2 className="text-xl font-semibold">{review.notIncluded}</h2>
            <p className="mt-3 leading-relaxed text-muted">{copy.dutyBody}</p>
            <p className="mt-3 leading-relaxed text-muted">{review.usDuty}</p>
          </div>

          <div className="mt-6 rounded-3xl border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-xl font-semibold">{international ? orderPolicy.title : dict.shippingPage.returns}</h2>
            {international ? <div className="mt-3 space-y-3 leading-relaxed text-muted">
              <p>{orderPolicy.returns}</p>
              <p>{orderPolicy.cancellation}</p>
              <p>{orderPolicy.paypalFee}</p>
            </div> : <p className="mt-3 leading-relaxed text-muted">{dict.shippingPage.returnsBody}</p>}
            <p className="mt-4">
              <Link to="/orders" className="text-sm font-medium underline-offset-4 hover:underline">
                {dict.nav.orders}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}

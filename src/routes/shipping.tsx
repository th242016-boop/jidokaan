import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/store/site-shell";
import { t, COUNTRIES, countryName } from "@/lib/i18n";
import { checkoutCopy } from "@/lib/checkout-copy";
import { DEFAULT_SHIPPING, shipCopy, applyEmsPolicy } from "@/lib/shipping";
import { useStore } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";

export const Route = createFileRoute("/shipping")({
  component: ShippingPage,
});

function ShippingPage() {
  const locale = useStore((s) => s.locale);
  const dict = t(locale);
  const { catalog } = useCatalog();
  const copy = shipCopy(locale);
  const settings = applyEmsPolicy(catalog.shipping ?? DEFAULT_SHIPPING);
  const review = checkoutCopy(locale);
  const ko = locale === "ko";

  return (
    <SiteShell>
      <div className="container-page py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {dict.shippingPage.title}
          </h1>
          <p className="mt-4 text-lg text-muted">{copy.production}</p>

          <h2 className="mt-12 text-xl font-semibold">{ko ? "배송 요금" : "Shipping rates"}</h2>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-surface-muted text-xs uppercase tracking-wide text-subtle">
                <tr>
                  <th className="px-4 py-3">{dict.checkout.country}</th>
                  <th className="px-4 py-3">EMS · USD</th>
                </tr>
              </thead>
              <tbody>
                {COUNTRIES.filter((c) => c.code !== "KR").map((c) => {
                  const r = settings.countryRates?.[c.code];
                  return (
                    <tr key={c.code} className="border-t border-border">
                      <td className="px-4 py-3">
                        <p className="font-medium">{countryName(c, locale)}</p>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {r ? `$${r.usd.toFixed(2)}` : review.unavailable}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-muted">{copy.extra}</p>

          <div className="mt-10 rounded-3xl border border-border bg-surface-muted/50 p-6 sm:p-8">
            <h2 className="text-xl font-semibold">{copy.dutyTitle}</h2>
            <p className="mt-3 leading-relaxed text-muted">{copy.dutyBody}</p>
            <p className="mt-3 leading-relaxed text-muted">{review.usDuty}</p>
          </div>

          <div className="mt-6 rounded-3xl border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-xl font-semibold">{dict.shippingPage.returns}</h2>
            <p className="mt-3 leading-relaxed text-muted">{dict.shippingPage.returnsBody}</p>
            <p className="mt-4">
              <Link to="/orders" className="text-sm font-medium underline-offset-4 hover:underline">
                {ko ? "주문번호로 교환·반품 접수" : "Request exchange or return"}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}

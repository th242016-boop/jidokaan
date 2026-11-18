import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/store/site-shell";
import { DEFAULT_COMPANY, DEFAULT_SUPPORT } from "@/lib/site-defaults";
import { t } from "@/lib/i18n";
import { legalPageCopy, localizedCompanyRows } from "@/lib/legal-page-copy";
import { useCatalog } from "@/lib/use-catalog";
import { useStore } from "@/lib/store";
import { internationalOrderPolicy, isInternationalDestination } from "@/lib/international-order-policy";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
  const locale = useStore((s) => s.locale);
  const shippingCountry = useStore((s) => s.shippingCountry);
  const international = isInternationalDestination(shippingCountry);
  const orderPolicy = internationalOrderPolicy(locale);
  const dict = t(locale);
  const { catalog } = useCatalog();
  const company = catalog.company.length ? catalog.company : DEFAULT_COMPANY;
  const support = catalog.support.length ? catalog.support : DEFAULT_SUPPORT;
  const copy = legalPageCopy(locale);
  const sellerRows = localizedCompanyRows(locale, [...company, ...support]);

  return (
    <SiteShell>
      <div className="container-page py-12">
        <h1 className="text-3xl font-semibold">{dict.footer.terms}</h1>
        <div className="mt-4 max-w-2xl space-y-3 text-muted">
          {international ? <section className="space-y-3">
            <h2 className="font-semibold text-foreground">{orderPolicy.title}</h2>
            <p>{orderPolicy.returns}</p>
            <p>{orderPolicy.cancellation}</p>
            <p>{orderPolicy.paypalFee}</p>
            <p className="text-sm">{orderPolicy.statutoryRights}</p>
          </section> : <p>{copy.domesticTerms}</p>}
          <p>{copy.leatherTerms}</p>
        </div>
        <section className="mt-10 max-w-2xl">
          <h2 className="text-lg font-semibold">{copy.seller}</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {sellerRows.map((row) => (
              <div key={`${row.label}-${row.value}`} className="flex flex-wrap gap-x-3">
                <dt className="font-medium">{row.label}</dt>
                <dd className="text-muted">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </SiteShell>
  );
}

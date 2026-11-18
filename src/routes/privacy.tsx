import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/store/site-shell";
import { DEFAULT_COMPANY, DEFAULT_SUPPORT } from "@/lib/site-defaults";
import { t } from "@/lib/i18n";
import { legalPageCopy, localizedCompanyRows } from "@/lib/legal-page-copy";
import { useCatalog } from "@/lib/use-catalog";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  const locale = useStore((s) => s.locale);
  const dict = t(locale);
  const { catalog } = useCatalog();
  const company = catalog.company.length ? catalog.company : DEFAULT_COMPANY;
  const support = catalog.support.length ? catalog.support : DEFAULT_SUPPORT;
  const copy = legalPageCopy(locale);

  return (
    <SiteShell>
      <div className="container-page py-12">
        <h1 className="text-3xl font-semibold">{dict.footer.privacy}</h1>
        <p className="mt-4 max-w-2xl text-muted">{copy.privacyOrders}</p>
        <p className="mt-4 max-w-2xl text-muted">{copy.privacyAnalytics}</p>
        <CompanyBlock title={copy.company} rows={localizedCompanyRows(locale, company)} />
        <CompanyBlock title={copy.support} rows={localizedCompanyRows(locale, support)} />
      </div>
    </SiteShell>
  );
}

function CompanyBlock({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <section className="mt-10 max-w-2xl">
      <h2 className="text-lg font-semibold">{title}</h2>
      <dl className="mt-3 space-y-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-wrap gap-x-3">
            <dt className="font-medium">{row.label}</dt>
            <dd className="text-muted">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

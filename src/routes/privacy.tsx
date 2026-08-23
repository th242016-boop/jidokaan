import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/store/site-shell";
import { DEFAULT_COMPANY, DEFAULT_SUPPORT } from "@/lib/site-defaults";
import { t } from "@/lib/i18n";
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
  const ko = locale === "ko";

  return (
    <SiteShell>
      <div className="container-page py-12">
        <h1 className="text-3xl font-semibold">{dict.footer.privacy}</h1>
        <p className="mt-4 max-w-2xl text-muted">
          {ko
            ? "주문·상담에 필요한 이름, 연락처, 배송지, 결제 정보를 수집합니다. 배송·CS 외 목적으로 넘기지 않습니다."
            : "We collect name, contact, shipping, and payment details needed to fulfill orders and support. We do not share them for other purposes."}
        </p>
        <CompanyBlock title={ko ? "사업자 정보" : "Company"} rows={company} />
        <CompanyBlock title={ko ? "상담" : "Support"} rows={support} />
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

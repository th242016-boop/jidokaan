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
            ? "주문·상담에 필요한 이름, 연락처, 배송지, 결제 정보를 수집합니다. 인스타그램 또는 이메일 중 선택한 연락 방법으로 주문·제작 사양·배송 안내를 드립니다. 배송·CS 외 목적으로 넘기지 않습니다."
            : "We collect name, contact, shipping, and payment details needed to fulfill orders and support. Your selected contact method (Instagram or email) is used for order, design and shipping communication. We do not share these details for other purposes."}
        </p>
        <p className="mt-4 max-w-2xl text-muted">
          {ko
            ? "회원관리와 사이트 이용 분석을 위해 가입방법, 가입 시 기기 유형(PC·모바일·태블릿), 방문 페이지와 유입경로, 전달된 캠페인·검색어 정보를 기록합니다. 유입정보를 가입 과정에 연결하는 자사 쿠키는 최대 24시간 유지됩니다. 검색엔진이 제공하지 않는 검색어는 수집할 수 없으며, 이 분석을 위해 기기 지문을 만들지는 않습니다."
            : "For member management and site analytics, we record signup method, device category (desktop, mobile or tablet), page visits, referral source and any campaign or search terms provided to us. A first-party attribution cookie lasts up to 24 hours and links this context to signup. We cannot collect search terms withheld by search engines, and do not create device fingerprints for this analytics feature."}
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

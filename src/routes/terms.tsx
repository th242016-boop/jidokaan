import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/store/site-shell";
import { DEFAULT_COMPANY, DEFAULT_SUPPORT } from "@/lib/site-defaults";
import { t } from "@/lib/i18n";
import { useCatalog } from "@/lib/use-catalog";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
  const locale = useStore((s) => s.locale);
  const dict = t(locale);
  const { catalog } = useCatalog();
  const company = catalog.company.length ? catalog.company : DEFAULT_COMPANY;
  const support = catalog.support.length ? catalog.support : DEFAULT_SUPPORT;
  const ko = locale === "ko";

  return (
    <SiteShell>
      <div className="container-page py-12">
        <h1 className="text-3xl font-semibold">{dict.footer.terms}</h1>
        <div className="mt-4 max-w-2xl space-y-3 text-muted">
          <p>
            {ko
              ? "주문제작 상품은 제작 전 취소가 가능합니다. 국내 창 벌어짐·마모는 무료 수선·보강이며, 창 교체는 5만원입니다."
              : "Made-to-order items can be cancelled before production starts. In Korea, sole gap/wear repair and reinforcement is free; sole replacement is ₩50,000."}
          </p>
          <p>
            {ko
              ? "가죽 갑피는 무겁고 이염·물빠짐이 있을 수 있습니다. 결제·배송 조건은 결제 화면과 배송 페이지를 따릅니다."
              : "Leather uppers are heavy and may transfer dye or lose color when wet. Payment and shipping follow checkout and the shipping page."}
          </p>
        </div>
        <section className="mt-10 max-w-2xl">
          <h2 className="text-lg font-semibold">{ko ? "상호" : "Seller"}</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {[...company, ...support].map((row) => (
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

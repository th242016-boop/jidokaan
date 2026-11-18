import type { AdminShippingGuidance } from "@/lib/order-types";

/** Server-supplied administrator-only guidance; no country lookup data in this bundle. */
export function AdminCountryNotice({notice}: {notice?: AdminShippingGuidance | null}) {
  if (!notice) return null;
  return <section aria-label="관리자 전용 발송 확인 사항" className="my-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
    <p className="mb-2 text-xs font-semibold">관리자 전용 · 고객 주문조회/이메일에는 표시되지 않음</p>
    <h3 className="font-bold">{notice.title}</h3>
    <ul className="mt-2 list-disc space-y-2 pl-5 leading-relaxed">
      {notice.lines.map(line => <li key={line}>{line}</li>)}
    </ul>
    <p className="mt-3 text-xs">검토 기준: {notice.reviewedAt} · 실제 발송 전 최신 접수 조건 확인</p>
  </section>;
}

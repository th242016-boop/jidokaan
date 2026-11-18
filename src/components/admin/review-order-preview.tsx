import { useState } from "react";
import { AdminCountryNotice } from "./country-notice";
import { OrderDetail } from "./order-detail";
import { IS_REVIEW_PREVIEW } from "@/lib/review-preview";
import { orderPaymentMoney, JAPAN_STANDARD_PRICE_JPY, JAPAN_SPECIAL_PRICE_JPY, JAPAN_SHIPPING_PER_PAIR_JPY } from "@/lib/order-money";
import { customerOrderAmounts, orderMoney } from "@/lib/customer-order-view";
import type { StoreOrder, AdminShippingGuidance } from "@/lib/order-types";

const COUNTRIES = [["MX", "멕시코"], ["JP", "일본"], ["FR", "프랑스"], ["ES", "스페인"], ["DE", "독일"], ["NL", "네덜란드"]] as const;

// Owner-review fixture only. The live component receives guidance from an
// authenticated API; operational guidance is not embedded in the live client.
const fixtureGuidance = (country: string): AdminShippingGuidance => ({
  reviewedAt: "2026-11-14",
  title: country === "MX" ? "멕시코 · 발송 전 통관 확인" : `${COUNTRIES.find(([code]) => code === country)?.[1]} · 관리자 발송 확인 예시`,
  lines: country === "MX" ? [
    "신발 수입허가: 우체국 EMS 안내상 신발은 신발 수입허가서를 보유한 회사만 통관할 수 있습니다.",
    "50달러 기준: 50달러 이하 샘플의 간이통관 안내가 별도로 있습니다. 신발 수입허가 면제 조건으로 명시된 것은 아닙니다.",
    "발송 전 확인: 구매자 또는 현지 통관 담당자와 필요한 수입허가·서류를 확인하고, 협의한 내용을 주문 메모에 남기세요.",
  ] : country === "JP" ? [
    "기본 복싱화: 상품 37,000엔 + 배송비 6,000엔 = 43,000엔. 기존 달러 주문은 저장된 달러 금액 그대로 표시합니다.",
    "스페셜 복싱화: 상품 41,500엔 + 배송비 6,000엔 = 47,500엔. 한 주문에 일반·스페셜을 함께 담아도 각 상품의 가격을 구분합니다.",
    "실제 상품금액·통화로 통관 신고하고 수입 세금은 별도로 확인하세요.",
  ] : [
    "신발 판매금지가 아니라 EU 내 책임자와 제품 식별·안전 안내 등 판매 준비 확인이 필요한 상태입니다.",
    country === "DE" ? "개인 EMS의 45유로 초과 물품은 EMS 프리미엄 등 이용 가능 경로를 확인하세요." : "계약고객용 선납 절차와 개인 창구 발송의 접수 조건을 구분해서 확인하세요.",
  ],
});

/** Compiled review-only fixture. No account, token, order API or save operation. */
export function ReviewAdminOrderPreview() {
  const [country, setCountry] = useState("MX");
  const [japanExample, setJapanExample] = useState("standard");
  const [open, setOpen] = useState(false);
  if (!IS_REVIEW_PREVIEW) return null;
  const jp = country === "JP";
  const standardItem = { productId: "drone-custom", name: "JIDOKAAN DRONE · 일반 금액 표시 예시", qty: 1,
    size: "265", priceKrw: 288000, priceUsd: 250, ...(jp ? { priceJpy: JAPAN_STANDARD_PRICE_JPY } : {}),
    designPreview: "/homepage/assets/white-gold.webp" };
  const specialItem = { ...standardItem, name: "JIDOKAAN DRONE · 스페셜 금액 표시 예시", optionKey: "EXAMPLE-SPECIAL",
    priceUsd: 280, priceJpy: JAPAN_SPECIAL_PRICE_JPY };
  const items = jp && japanExample === "special" ? [specialItem] : jp && japanExample === "mixed" ? [standardItem, specialItem] : [standardItem];
  const shippingJpy = items.length * JAPAN_SHIPPING_PER_PAIR_JPY;
  const order: StoreOrder = {
    id: "ADMIN-PREVIEW-ONLY", createdAt: "2026-11-14T00:00:00.000Z",
    email: "synthetic@example.invalid", phone: "+1 202 555 0100", name: "예시 고객 · 실제 주문 아님",
    address: "Example address — no delivery", city: "Example city", region: "Example region", postal: "00000",
    country, contactMethod: "email", checkoutLocale: "ko", pay: "preview", shipMethod: "standard",
    shippingKrw: 0, shippingUsd: jp ? 35 * items.length : 0, totalKrw: 0, totalUsd: items.reduce((sum,item) => sum + item.priceUsd, 0) + (jp ? 35 * items.length : 0),
    ...(jp ? { totalJpy: items.reduce((sum,item) => sum + (item.priceJpy ?? 0), 0) + shippingJpy, shippingJpy, discountJpy: 0 } : {}),
    currency: jp ? "JPY" : "USD", status: "paid",
    adminShippingGuidance: fixtureGuidance(country),
    items,
  };
  const amounts = customerOrderAmounts(order);
  const value = orderPaymentMoney(order);
  return <main className="admin-ui min-h-screen bg-[#eef0f4] px-4 py-16 text-[#202937] sm:px-8">
    <div className="mx-auto max-w-4xl">
      <p className="mb-2 text-sm font-semibold text-amber-800">관리자 화면 예시 · 실제 주문/계정/고객정보 연결 없음</p>
      <h1 className="text-2xl font-bold">주문 상세의 국가별 발송 확인 사항</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">이 화면의 고객·주문·결제 내역은 모두 가상입니다. 운영 반영 후에는 관리자 인증을 거쳐 기존 주문의 해당 국가 안내를 볼 수 있습니다.</p>
      <label className="mt-6 block text-sm font-semibold">검토할 배송 국가
        <select className="mt-2 block w-full rounded-lg border border-slate-300 bg-white p-3 sm:max-w-xs" value={country} onChange={event => {setCountry(event.target.value);setOpen(false);}}>
          {COUNTRIES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
        </select>
      </label>
      {jp ? <label className="mt-4 block text-sm font-semibold">일본 주문 예시
        <select className="mt-2 block w-full rounded-lg border border-slate-300 bg-white p-3 sm:max-w-xs" value={japanExample} onChange={event => {setJapanExample(event.target.value);setOpen(false);}}>
          <option value="standard">일반 1켤레 · 43,000엔</option><option value="special">스페셜 1켤레 · 47,500엔</option><option value="mixed">일반 + 스페셜 · 90,500엔</option>
        </select>
      </label> : null}
      <AdminCountryNotice notice={order.adminShippingGuidance} />
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-bold">예시 주문 금액 · {value.currency}</h2>
        <dl className="space-y-3 text-sm">
          {(["subtotal", "shipping", "total"] as const).map(key => <div key={key} className="flex justify-between gap-4"><dt>{{subtotal:"상품 금액",shipping:"배송비",total:"합계"}[key]}</dt><dd>{orderMoney(order, amounts[key], "ko")}</dd></div>)}
        </dl>
        {!jp ? <p className="mt-4 text-sm text-amber-800">금액 구조만 보여주는 가상 주문입니다. 이 국가의 신규 판매·배송 견적이 확정된 것은 아닙니다. 예시 배송비 0은 무료배송을 뜻하지 않습니다.</p> : null}
        <button type="button" className="mt-5 rounded-lg bg-slate-800 px-4 py-3 text-sm font-semibold text-white" onClick={() => setOpen(true)}>예시 주문 상세 열기</button>
      </section>
      <a className="mt-5 inline-block text-sm underline" href="/">고객용 테스트 화면으로 돌아가기</a>
    </div>
    {open ? <OrderDetail order={order} onClose={() => setOpen(false)} onSave={async () => false} /> : null}
  </main>;
}

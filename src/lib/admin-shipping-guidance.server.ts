import type { AdminShippingGuidance, StoreOrder } from "./order-types";

/** Attach only after administrator authorization. Never persist on customer order payloads. */
export function adminCountryNotice(country: string): AdminShippingGuidance | null {
  const code = country.trim().toUpperCase();
  if (code === "MX") return {
    reviewedAt: "2026-11-14",
    title: "멕시코 · 발송 전 통관 확인",
    lines: [
      "신발 수입허가: 우체국 EMS 안내상 신발은 신발 수입허가서를 보유한 회사만 통관할 수 있습니다.",
      "50달러 기준: 50달러 이하 샘플의 간이통관 안내가 별도로 있습니다. 신발 수입허가 면제 조건으로 명시된 것은 아닙니다.",
      "발송 전 확인: 구매자 또는 현지 통관 담당자와 필요한 수입허가·서류를 확인하고, 협의한 내용을 주문 메모에 남기세요.",
    ],
  };
  if (["FR", "ES", "DE", "NL"].includes(code)) return {
    reviewedAt: "2026-11-14",
    title: `${({FR:"프랑스",ES:"스페인",DE:"독일",NL:"네덜란드"} as Record<string,string>)[code]} · EU 판매 준비 확인`,
    lines: [
      "신발 자체의 판매금지를 뜻하지 않습니다. EU 내 책임자, 제조자·제품 식별 정보 및 필요한 안전 안내 등 GPSR 판매 요건의 준비 상태를 확인해야 합니다.",
      ({
        FR: "프랑스는 신품 신발의 Refashion REP 가입·판매량 신고·분담금 등 생산자 책임 요건을 확인하세요. 해외 온라인 판매자도 대상에 포함됩니다.",
        ES: "스페인은 포장 생산자 등록과 외국 직판자의 현지 EPR 대리인 요건을 확인하세요. GPSR 책임자와는 별도 제도입니다.",
        DE: "독일은 LUCID 포장등록·재활용 시스템 참여·물량 보고 및 현지 지점 없는 외국 직판자의 포장 EPR 대리인 의무를 확인하세요.",
        NL: "네덜란드는 일반 포장의 연 50,000kg 미만 면제 적용 조건을 확인하세요. 이 포장 면제는 GPSR 등 다른 판매 의무의 면제를 뜻하지 않습니다.",
      } as Record<string, string>)[code],
      code === "DE"
        ? "독일행 개인 EMS는 2026-07-08 우체국 안내상 45유로 초과 물품의 접수 경로를 EMS 프리미엄 등으로 확인해야 합니다. 현재 기본 EMS 요금만으로 발송을 확정하지 마세요."
        : code === "NL"
          ? "계약 EMS의 관부가세 선납 안내와 개인 창구 EMS를 구분하세요. 계약고객용 DDP 안내만으로 모든 개인 발송에 선납이 필수라고 판단하지 마세요."
          : "EU 판매 요건과 실제 우체국 접수 가능 경로를 확인하기 전까지 테스트 버전의 신규 판매는 보류합니다.",
      "배송비와 별도로 수입 VAT·관세·통관 수수료가 발생할 수 있습니다. 실제 판매금액과 통화로 신고하고, 고객에게 필요한 비용·통관 조건은 결제 전에 안내하세요.",
    ],
  };
  if (code === "JP") return {
    reviewedAt: "2026-11-14",
    title: "일본 · 결제 통화와 실제 상품금액 확인",
    lines: [
      "신규 일본 주문은 기본 복싱화 37,000엔, 기존 280달러 스페셜 가격의 신발은 41,500엔이며 배송비는 1켤레당 6,000엔입니다. 기존 주문과 별도 가격 상품은 주문에 저장된 결제 금액·통화를 그대로 확인하세요.",
      "통관 신고에는 주문에 저장된 실제 상품금액과 통화를 사용하세요. 배송비·할인과 일본에서 발생하는 수입 세금은 구분해 확인하세요.",
    ],
  };
  return null;
}


export function adminOrderWithGuidance(order: StoreOrder): StoreOrder {
  const guidance = adminCountryNotice(order.country);
  return { ...order, adminShippingGuidance: guidance ?? undefined };
}

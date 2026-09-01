export type FaqItem = {
  id: string;
  q: string;
  a: string;
  enabled: boolean;
};

export type BlackCustomer = {
  id: string;
  email: string;
  name: string;
  reason: string;
  createdAt: string;
};

export function normalizeCoupon(c: {
  id: string;
  code: string;
  label: string;
  offKrw: number;
  offUsd: number;
  enabled: boolean;
  type?: "amount" | "percent";
  percent?: number;
  minKrw?: number;
  target?: "all" | "first" | "repeat";
  start?: string;
  end?: string;
}) {
  return {
    id: c.id,
    code: c.code,
    label: c.label,
    offKrw: c.offKrw,
    offUsd: c.offUsd,
    enabled: c.enabled !== false,
    type: c.type ?? "amount",
    percent: c.percent ?? 0,
    minKrw: c.minKrw ?? 0,
    target: c.target ?? "all",
    start: c.start ?? "",
    end: c.end ?? "",
  };
}

export const DEFAULT_FAQS: FaqItem[] = [
  {
    id: "lead",
    q: "제작은 얼마나 걸리나요?",
    a: "수제 제작 평균 20~30일 + 배송입니다. 주문 후 제작에 들어갑니다.",
    enabled: true,
  },
  {
    id: "kr-order",
    q: "한국에서 어떻게 주문하나요?",
    a: "커스텀 스튜디오에서 디자인한 뒤, 네이버 스마트스토어에서 주문해 주세요. 화면을 캡쳐해 두시면 제작에 도움이 됩니다.",
    enabled: true,
  },
  {
    id: "intl-order",
    q: "해외 주문은 어떻게 하나요?",
    a: "이 사이트에서 커스텀을 확정한 뒤 USD로 결제합니다. PayPal을 이용할 수 있습니다.",
    enabled: true,
  },
  {
    id: "size",
    q: "사이즈는 어떻게 고르나요?",
    a: "여성 225–245 / 남성 240–300. 여성은 보통 정사이즈, 남성은 일반 운동화보다 한 치수 작게 권장합니다. 발볼이 두꺼우면 정사이즈가 맞을 수 있습니다.",
    enabled: true,
  },
  {
    id: "duty",
    q: "해외 관세는 누가 내나요?",
    a: "DAP입니다. 배송비는 결제 시 표시되고, 도착국 관세·부가세가 있으면 수령인이 부담합니다. PO Box·택배 대행지는 받을 수 없습니다.",
    enabled: true,
  },
];

export const DEFAULT_FAQS_EN: FaqItem[] = [
  {
    id: "lead",
    q: "How long does making take?",
    a: "Handmade production is typically 20–30 days, then shipping. We start after you order.",
    enabled: true,
  },
  {
    id: "kr-order",
    q: "How do I order from Korea?",
    a: "Design in Custom Studio, then order on Naver Smartstore. Save a screenshot of your design.",
    enabled: true,
  },
  {
    id: "intl-order",
    q: "How do international orders work?",
    a: "Lock your custom design on this site and pay in USD. PayPal is available at checkout.",
    enabled: true,
  },
  {
    id: "size",
    q: "How should I pick a size?",
    a: "Women 225–245 / men 240–300. Women usually take true size; men often go one size down vs sneakers. A wide foot may fit true size better.",
    enabled: true,
  },
  {
    id: "duty",
    q: "Who pays import duty?",
    a: "We ship DAP. Shipping is shown at checkout. Import duty/VAT, if charged, is paid by the recipient. PO Boxes and freight-forwarding addresses are not accepted.",
    enabled: true,
  },
];

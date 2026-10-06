import { ORDER_STATUS_LABEL, type StoreOrder } from "./order-types";

export const ORDER_BOT_USERNAME = "jidokaan_bot";
export const ORDER_ADMIN_URL = "https://jidokaan.com/admin";

const clean = (value: unknown, max = 100) =>
  String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .slice(0, max);

export function orderAdminLink(id: string) {
  return `${ORDER_ADMIN_URL}?p=orders&order=${encodeURIComponent(id)}`;
}

/** Plain text only. Do not forward addresses, contact details, or payment IDs. */
export function orderNotificationText(order: StoreOrder) {
  const payment =
    order.status === "paid"
      ? "결제 완료"
      : order.status === "wait"
        ? "입금 대기 · 아직 결제되지 않음"
        : ORDER_STATUS_LABEL[order.status] || "관리자에서 확인";
  let country = clean(order.country, 2).toUpperCase();
  try {
    if (/^[A-Z]{2}$/.test(country)) {
      country = `${new Intl.DisplayNames(["ko"], { type: "region" }).of(country)} (${country})`;
    }
  } catch {
    /* country code remains readable */
  }
  const usd = order.currency === "USD";
  const amount = usd ? order.totalUsd : order.totalKrw;
  const total = Number.isFinite(amount)
    ? new Intl.NumberFormat("ko-KR", { style: "currency", currency: usd ? "USD" : "KRW" }).format(
        amount,
      )
    : "관리자에서 확인";
  const products = (order.items ?? []).slice(0, 10).map((item) => {
    const model = item.partNames
      ? item.partNames.model === "mid"
        ? "중목"
        : "장목"
      : item.optionLabel;
    return (
      `• ${clean(item.name, 80)}${model ? ` / ${clean(model, 30)}` : ""}` +
      `${item.size ? ` / ${clean(item.size, 30)}` : ""} / ${Number(item.qty) || 0}개`
    );
  });
  if (order.items.length > 10) products.push(`외 ${order.items.length - 10}개 항목`);
  return [
    "[지도칸] 새 주문 접수",
    `주문번호: ${clean(order.id)}`,
    `상태: ${payment}`,
    `배송 국가: ${country || "미입력"}`,
    `${order.status === "wait" ? "입금 예정액" : "주문 금액"}: ${total}`,
    "",
    ...products,
    "",
    "확정 디자인·연락처·배송지는 관리자 주문 상세에서 확인하세요.",
  ].join("\n");
}

import type { OrderItem, StoreOrder } from "./order-types";

export type PaymentCurrency = "USD" | "JPY" | "KRW";
export const JAPAN_STANDARD_PRICE_JPY = 37000;
// USD 280 / USD 250 = 1.12; JPY 41,440 rounded up to a whole JPY 100.
export const JAPAN_SPECIAL_PRICE_JPY = 41500;
export const JAPAN_SHIPPING_PER_PAIR_JPY = 6000;
export const JAPAN_PRICE_VERSION = "jp-fixed-2026-11-14-v2";
const STANDARD_IDS = new Set(["drone-custom", "drone-mid"]);

type JapanPriceItem = {
  productId: string;
  priceUsd: number;
  category?: string;
  customizable?: boolean;
};

/** The server passes catalog category and recomputed SKU price, never client flags.
 * Only the approved USD 250 standard / USD 280 special footwear tiers use JPY. */
export function japanYenUnitPrice(item: JapanPriceItem): number | null {
  if (STANDARD_IDS.has(item.productId) && item.priceUsd === 250) return JAPAN_STANDARD_PRICE_JPY;
  const footwear = STANDARD_IDS.has(item.productId) || item.category === "custom" || item.category === "ready" || item.customizable === true;
  return footwear && item.priceUsd === 280 ? JAPAN_SPECIAL_PRICE_JPY : null;
}

/** Fixed merchant prices, not live currency conversion. Other custom-priced items
 * keep their existing USD quote. Unit prices stay aligned with the input lines. */
export function japanYenQuote(
  country: string,
  items: (JapanPriceItem & { qty: number })[],
  discountUsd = 0,
) {
  if (country.trim().toUpperCase() !== "JP" || !items.length) return null;
  const prices = items.map(japanYenUnitPrice);
  if (prices.some(price => price === null) || !items.every(item => Number.isInteger(item.qty) && item.qty > 0)) return null;
  const unitPricesJpy = prices as number[];
  if (!Number.isFinite(discountUsd) || discountUsd < 0) throw new Error("DISCOUNT_INVALID");
  const qty = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotalJpy = items.reduce((sum, item, index) => sum + item.qty * unitPricesJpy[index], 0);
  const subtotalUsd = items.reduce((sum, item) => sum + item.qty * item.priceUsd, 0);
  // Retain a coupon's proportional reduction in the fixed-price Japanese basket.
  const discountJpy = Math.min(subtotalJpy, Math.round(subtotalJpy * discountUsd / subtotalUsd));
  const shippingJpy = qty * JAPAN_SHIPPING_PER_PAIR_JPY;
  return { currency: "JPY" as const, subtotalJpy, shippingJpy, discountJpy,
    totalJpy: subtotalJpy - discountJpy + shippingJpy, unitPricesJpy };
}

/** Currency is a saved payment fact. Never infer it from language or destination. */
export function orderPaymentMoney(order: Pick<StoreOrder,
  "currency" | "totalUsd" | "shippingUsd" | "discountUsd" | "totalKrw" | "shippingKrw" |
  "discountKrw" | "totalJpy" | "shippingJpy" | "discountJpy">) {
  if (order.currency === "JPY") {
    if (![order.totalJpy, order.shippingJpy, order.discountJpy ?? 0].every(value =>
      Number.isSafeInteger(value) && Number(value) >= 0,
    )) throw new Error("JPY_ORDER_AMOUNT_MISSING");
    return { currency: "JPY" as const, total: order.totalJpy!, shipping: order.shippingJpy!, discount: order.discountJpy ?? 0 };
  }
  if (order.currency === "KRW") return { currency: "KRW" as const, total: order.totalKrw, shipping: order.shippingKrw, discount: order.discountKrw ?? 0 };
  return { currency: "USD" as const, total: order.totalUsd, shipping: order.shippingUsd, discount: order.discountUsd ?? 0 };
}

export function orderItemUnitAmount(order: Pick<StoreOrder, "currency">, item: OrderItem) {
  if (order.currency === "JPY") {
    if (!Number.isSafeInteger(item.priceJpy) || Number(item.priceJpy) < 0) throw new Error("JPY_ITEM_AMOUNT_MISSING");
    return item.priceJpy!;
  }
  return order.currency === "KRW" ? item.priceKrw : item.priceUsd;
}

/** PayPal JPY is zero-decimal. Reject fractional values rather than silently rounding. */
export function paypalAmountValue(amount: number, currency: string) {
  if (!Number.isFinite(amount) || amount <= 0 || !["USD", "JPY"].includes(currency)) throw new Error("PAYPAL_AMOUNT");
  if (currency === "JPY") {
    if (!Number.isSafeInteger(amount)) throw new Error("PAYPAL_AMOUNT");
    return amount.toFixed(0);
  }
  return amount.toFixed(2);
}

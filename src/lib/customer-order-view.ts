import type { OrderItem, StoreOrder } from "./order-types";
import { orderPaymentMoney, orderItemUnitAmount } from "./order-money";
import { modelLabel } from "./simulator-config";
import { productOptionLabel } from "./storefront-detail-copy";
import { getProduct, productDisplayName, PRODUCTS } from "./products";

/** Known saved model names can be localized; preserve arbitrary order options verbatim. */
export function customerOptionLabel(option: string | undefined, locale: string) {
  return option?.split(" · ").map(part => part === "중목" || part === "장목"
    ? modelLabel({ model: part === "중목" ? "mid" : "high" }, locale)
    : part.split(" / ").map(value => productOptionLabel(value, locale)).join(" / ")).join(" · ");
}

/** Read-only display fallback for a removed original product; never rename custom records. */
export function customerOrderItemName(item: Pick<OrderItem, "productId" | "name" | "optionLabel">, locale: string) {
  const product = getProduct(item.productId);
  const original = PRODUCTS.find(value => value.id === item.productId);
  const originalName = original && Object.values(original.name).find(name => item.name === name ||
    (item.name.startsWith(`${name} (`) && item.name.endsWith(")")));
  const display = product ? productDisplayName(product, locale)
    : original && originalName ? productDisplayName(original, locale) : item.name;
  // Some old records embedded the SKU solely in the name. Keep that specification.
  if (originalName && !item.optionLabel && item.name !== originalName) {
    const option = item.name.slice(originalName.length + 2, -1);
    return `${display} (${customerOptionLabel(option, locale)})`;
  }
  return display;
}

/** A session hint is only a lookup credential, never proof of payment. */
export function confirmationCredentials(id: string | undefined, raw: string | null) {
  if (!id || !raw) return null;
  try {
    const saved = JSON.parse(raw) as { orderId?: unknown; email?: unknown };
    if (saved.orderId !== id || typeof saved.email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(saved.email)) return null;
    return { id, email: saved.email.trim() };
  } catch { return null; }
}

/** The API must have authorized both the order number and checkout email. */
export function matchesCustomerOrder(order: StoreOrder | undefined, id: string, email: string) {
  return Boolean(order && order.id === id && order.email?.trim().toLowerCase() === email.trim().toLowerCase());
}

export function orderMoney(order: StoreOrder, amount: number, locale: string) {
  const { currency } = orderPaymentMoney(order);
  return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : locale, {
    style: "currency", currency, currencyDisplay: "code",
    minimumFractionDigits: currency === "USD" ? 2 : 0,
    maximumFractionDigits: currency === "USD" ? 2 : 0,
  }).format(amount);
}

export function customerOrderAmounts(order: StoreOrder) {
  const { total, shipping, discount } = orderPaymentMoney(order);
  return {
    subtotal: order.items.reduce((sum, item) => sum + item.qty * orderItemUnitAmount(order, item), 0),
    discount, shipping, total,
  };
}

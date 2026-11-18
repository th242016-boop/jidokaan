import { isActiveSalesCountry } from "./active-sales-policy";
import { orderPaymentMoney } from "./order-money";
import { lookupOrderByPaypalId } from "./orders.server";
import { verifyPaypalPayment } from "./paypal.server";
import type { StoreOrder } from "./order-types";

/** Read-only recovery for old clients without a saved checkout draft.
 * A stored order and a verified capture are required to bypass current sales policy.
 * Never trust client prices or rewrite completed/history records during a retry. */
export async function recoverLegacyPaypalOrder(input: Partial<StoreOrder>): Promise<StoreOrder | null> {
  const id = String(input.paypalOrderId ?? "").trim();
  const existing = await lookupOrderByPaypalId(id, String(input.email ?? "").trim());
  if (existing) {
    const money = orderPaymentMoney(existing);
    await verifyPaypalPayment(id, money.total, money.currency);
    return existing;
  }
  // No authoritative old specification exists. Do not reprice a possibly paid
  // excluded-country order or guess its design; support must reconcile it first.
  if (!isActiveSalesCountry(input.country)) throw new Error("PAYPAL_ORDER_REVIEW_REQUIRED");
  return null;
}

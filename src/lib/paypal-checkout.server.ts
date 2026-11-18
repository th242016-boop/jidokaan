import { randomUUID } from "node:crypto";
import { getSql } from "./db";
import { quoteCheckout, type CheckoutInput } from "./checkout-quote.server";
import { createPaypalOrder, capturePaypalOrder, verifyPaypalPayment } from "./paypal.server";
import { placeOrder } from "./orders.server";
import { assertSession } from "./admin-auth.server";
import type { StoreOrder } from "./order-types";
import { isActiveSalesCountry } from "./active-sales-policy";
import { orderPaymentMoney, paypalAmountValue } from "./order-money";
async function drafts() {
  const sql = await getSql();
  await sql.query(
    `create table if not exists paypal_checkout_drafts (id text primary key, paypal_id text unique, payload jsonb not null, order_id text, created_at timestamptz not null default now())`,
  );
  return sql;
}
export async function startPaypalCheckout(input: Partial<StoreOrder>, expectedValue: string) {
  const payload = await quoteCheckout({ ...input, pay: "paypal" });
  const money = orderPaymentMoney(payload);
  if (paypalAmountValue(money.total, money.currency) !== paypalAmountValue(Number(expectedValue), money.currency) ||
      (input.currency != null && input.currency !== money.currency))
    throw new Error("QUOTE_CHANGED_REFRESH_CHECKOUT");
  const sql = await drafts();
  const id = randomUUID();
  // Persist the production specification BEFORE requesting payment.
  await sql.query("insert into paypal_checkout_drafts (id,payload) values ($1,$2::jsonb)", [
    id,
    JSON.stringify(payload),
  ]);
  const paypalId = await createPaypalOrder(paypalAmountValue(money.total, money.currency), {
    requestId: id,
    order: payload,
  });
  await sql.query("update paypal_checkout_drafts set paypal_id=$2 where id=$1", [id, paypalId]);
  return paypalId;
}
export async function completePaypalCheckout(paypalId: string, capture: boolean) {
  const sql = await drafts();
  const rows = await sql.query<{ payload: CheckoutInput }>(
    "select payload from paypal_checkout_drafts where paypal_id=$1",
    [paypalId],
  );
  if (!rows[0]) return null; // older checkout clients have no draft
  const payload = rows[0].payload;
  const money = orderPaymentMoney(payload);
  let payment: Awaited<ReturnType<typeof verifyPaypalPayment>> | undefined;
  if (capture && !isActiveSalesCountry(payload.country)) {
    // A saved draft is not permission to start a new charge after a sales-policy change.
    // But a previous capture may have succeeded before a timeout: verify read-only
    // and finish recording that already-paid order without attempting another charge.
    try {
      payment = await verifyPaypalPayment(paypalId, money.total, money.currency);
    } catch (cause) {
      throw new Error("DESTINATION_SALES_UNAVAILABLE", { cause });
    }
  } else if (capture) {
    try {
      await capturePaypalOrder(paypalId);
    } catch {
      /* Capture may have succeeded before a network timeout. Verify below. */
    }
  }
  payment ??= await verifyPaypalPayment(paypalId, money.total, money.currency);
  const order = await placeOrder({ ...payload, ...payment }, true);
  await sql.query("update paypal_checkout_drafts set order_id=$2 where paypal_id=$1", [
    paypalId,
    order.id,
  ]);
  return order;
}
export async function pendingPaypalCheckouts(token: string) {
  await assertSession(token);
  const sql = await drafts();
  const rows = await sql.query<{
    paypal_id: string;
    created_at: Date | string;
    payload: CheckoutInput;
  }>(
    `select paypal_id,created_at,payload from paypal_checkout_drafts where order_id is null and paypal_id is not null and created_at > now()-interval '30 days' order by created_at desc limit 100`,
  );
  return rows.map((row) => ({
    paypalOrderId: row.paypal_id,
    createdAt: row.created_at,
    name: row.payload.name,
    email: row.payload.email,
    country: row.payload.country,
    totalUsd: row.payload.totalUsd,
    ...orderPaymentMoney(row.payload),
  }));
}
export async function recoverPaypalCheckout(token: string, id: string) {
  await assertSession(token);
  // Read PayPal status only: this recovery action NEVER charges an approved order.
  const order = await completePaypalCheckout(id, false);
  if (!order) throw new Error("NOT_FOUND");
  return order;
}

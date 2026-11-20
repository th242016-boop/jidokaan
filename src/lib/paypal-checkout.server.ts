import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getSql } from "./db";
import { quoteCheckout, type CheckoutInput } from "./checkout-quote.server";
import { createPaypalOrder, capturePaypalOrder, verifyPaypalPayment } from "./paypal.server";
import { placeOrder } from "./orders.server";
import { assertSession } from "./admin-auth.server";
import type { StoreOrder } from "./order-types";
import { isActiveSalesCountry } from "./active-sales-policy";
import { orderPaymentMoney, paypalAmountValue } from "./order-money";

const safePaymentId = /^[a-zA-Z0-9_-]{1,80}$/;

function cookieName(paypalId: string) {
  if (!safePaymentId.test(paypalId)) throw new Error("CHECKOUT_REFRESH_REQUIRED");
  return `__Host-jk-pay-${paypalId}`;
}

function readProof(request: Request, paypalId: string) {
  const prefix = cookieName(paypalId) + "=";
  const cookie = request.headers.get("cookie")?.split(";").map(value => value.trim()).find(value => value.startsWith(prefix));
  return cookie?.slice(prefix.length) ?? "";
}

function ownerDigest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function openBrowserCheckout(input: Partial<StoreOrder>, value: string) {
  const proof = randomBytes(32).toString("hex");
  const id = await startPaypalCheckout(input, value, proof);
  return { id, cookie: `${cookieName(id)}=${proof}; Path=/; Max-Age=172800; Secure; HttpOnly; SameSite=Lax` };
}

// Pre-upgrade SDKs post the ID alone after approval, then post their original
// form details when asked to finish. This marker only signals that callback:
// it does not authorize a payment or grant access to a new cookie-bound draft.
export function legacyApprovalCookie(request: Request, id: string) {
  const proof = readProof(request, id);
  if (proof && proof !== "confirm") return null;
  return `${cookieName(id)}=confirm; Path=/; Max-Age=300; Secure; HttpOnly; SameSite=Lax`;
}

export async function finishBrowserCheckout(request: Request, id: string, capture: boolean, email = "", phone = "") {
  const proof = readProof(request, id);
  return completePaypalCheckout(id, capture, { proof, email, phone });
}

async function drafts() {
  const sql = await getSql();
  await sql.query(
    `create table if not exists paypal_checkout_drafts (id text primary key, paypal_id text unique, payload jsonb not null, order_id text, created_at timestamptz not null default now())`,
  );
  return sql;
}
export async function startPaypalCheckout(input: Partial<StoreOrder>, expectedValue: string, proof = randomBytes(32).toString("hex")) {
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
    JSON.stringify({ ...payload, checkoutOwnerDigest: ownerDigest(proof) }),
  ]);
  const paypalId = await createPaypalOrder(paypalAmountValue(money.total, money.currency), {
    requestId: id,
    order: payload,
  });
  await sql.query("update paypal_checkout_drafts set paypal_id=$2 where id=$1", [id, paypalId]);
  return paypalId;
}
export async function completePaypalCheckout(paypalId: string, capture: boolean, browser?: { proof: string; email: string; phone: string }) {
  const sql = await drafts();
  const rows = await sql.query<{ payload: CheckoutInput & { checkoutOwnerDigest?: string } }>(
    "select payload from paypal_checkout_drafts where paypal_id=$1",
    [paypalId],
  );
  if (!rows[0]) return null; // older checkout clients have no draft
  const { checkoutOwnerDigest, ...payload } = rows[0].payload;
  if (browser) {
    if (checkoutOwnerDigest !== undefined) {
      if (!/^[a-f0-9]{64}$/.test(browser.proof) || ownerDigest(browser.proof) !== checkoutOwnerDigest)
        throw new Error("CHECKOUT_OWNER_REQUIRED");
    } else {
      // Historical drafts were not bound to cookies. Match the stored checkout
      // email before any capture, reconciliation or receipt disclosure.
      if (!browser.email || browser.email.trim().toLowerCase() !== payload.email.trim().toLowerCase())
        throw new Error("CHECKOUT_OWNER_REQUIRED");
      if (browser.proof === "confirm") {
        if (!browser.phone || browser.phone !== payload.phone)
          throw new Error("CHECKOUT_OWNER_REQUIRED");
        capture = true;
      }
    }
  }
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

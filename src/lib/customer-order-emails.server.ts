import { randomUUID } from "node:crypto";
import { getSql } from "./db";
import { ensureOrderTables } from "./orders.server";
import { canConfirmPaidOrder, orderEmailConfig, orderEmailPayload } from "./customer-order-email";
import type { StoreOrder } from "./order-types";

/** Disabled by default. Only explicit rollout configuration can enqueue/send.
 * Existing inquiry email settings do not activate order confirmations. */
export async function processCustomerOrderEmails() {
  if (import.meta.env.VITE_REVIEW_PREVIEW === "true") return;
  const config = orderEmailConfig(process.env);
  if (!config) return;
  await ensureOrderTables();
  const sql = await getSql();
  const fresh = await sql.query<{
    id: string;
    data: StoreOrder | string;
    status: StoreOrder["status"];
  }>(
    `select o.id, o.data, o.status from store_orders o
     where o.created_at >= $1 and o.status in ('paid','ready','shipped','done','confirmed')
     and not exists (select 1 from customer_order_email_outbox n where n.order_id=o.id)
     order by o.created_at limit 100`,
    [config.startAt],
  );
  for (const row of fresh) {
    const data = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
    const order = { ...data, id: row.id, status: row.status } as StoreOrder;
    const eligible = canConfirmPaidOrder(order);
    // Freeze the recipient, content and sender before sending. A retry with the
    // same idempotency key must never contain a different body.
    await sql.query(
      `insert into customer_order_email_outbox (order_id,locale,payload,state,last_error)
       values ($1,$2,$3::jsonb,$4,$5) on conflict do nothing`,
      [
        row.id,
        order.checkoutLocale || "en",
        JSON.stringify(eligible ? orderEmailPayload(order, config) : {}),
        eligible ? "pending" : "suppressed",
        eligible ? null : "ORDER_NOT_ELIGIBLE",
      ],
    );
  }
  const lease = randomUUID();
  const rows = await sql.query<{
    order_id: string;
    payload: unknown;
    attempts: number;
    first_attempt_at: Date | string;
  }>(
    `with candidate as (
       select order_id from customer_order_email_outbox where state='pending'
       and next_attempt_at <= now() and (locked_until is null or locked_until < now())
       order by created_at limit 1 for update skip locked
     ) update customer_order_email_outbox n set lease_token=$1,
       locked_until=now()+interval '90 seconds', attempts=attempts+1,
       first_attempt_at=coalesce(first_attempt_at,now())
       from candidate c where n.order_id=c.order_id
       returning n.order_id,n.payload,n.attempts,n.first_attempt_at`,
    [lease],
  );
  const item = rows[0];
  if (!item) return;
  // A cancelled/deleted/unpaid order must not acquire a confirmation while it
  // was waiting for its send attempt. The SQL status column is authoritative.
  const current = await sql.query<{
    data: StoreOrder | string;
    status: StoreOrder["status"];
    created_at: Date | string;
  }>("select data,status,created_at from store_orders where id=$1", [item.order_id]);
  const row = current[0];
  const data = row && (typeof row.data === "string" ? JSON.parse(row.data) : row.data);
  if (
    !row ||
    new Date(row.created_at).getTime() < Date.parse(config.startAt) ||
    !canConfirmPaidOrder({ ...data, status: row.status } as StoreOrder)
  ) {
    await sql.query(
      `update customer_order_email_outbox set state='suppressed', last_error='ORDER_NOT_ELIGIBLE',
      lease_token=null,locked_until=null where order_id=$1 and lease_token=$2`,
      [item.order_id, lease],
    );
    return;
  }
  let error = "EMAIL_UNREACHABLE",
    permanent = false;
  let delay = Math.min(3600, 30 * 2 ** Math.min(item.attempts - 1, 7));
  if (Date.now() - new Date(item.first_attempt_at).getTime() >= 23 * 3600000) {
    // Resend keys expire after 24 hours. Stop early and require manual provider
    // verification; never replay an ambiguous send with a new key.
    error = "EMAIL_REVIEW_REQUIRED";
    permanent = true;
  } else {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `order-confirmation-v1-${item.order_id}`,
        },
        body: typeof item.payload === "string" ? item.payload : JSON.stringify(item.payload),
        signal: AbortSignal.timeout(15000),
      });
      if (response.ok) {
        const result = (await response.json()) as { id?: string };
        if (!result.id) throw new Error("INVALID_RESPONSE");
        // "accepted" means provider acceptance, never inbox delivery.
        await sql.query(
          `update customer_order_email_outbox set state='accepted',provider_id=$3,accepted_at=now(),
          lease_token=null,locked_until=null,last_error=null where order_id=$1 and lease_token=$2`,
          [item.order_id, lease, result.id],
        );
        return;
      }
      error = response.status === 429 ? "EMAIL_RATE_LIMIT" : "EMAIL_REJECTED";
      permanent =
        response.status >= 400 &&
        response.status < 500 &&
        ![408, 409, 429].includes(response.status);
      delay = Math.max(delay, Math.min(3600, Number(response.headers.get("retry-after")) || 0));
    } catch {
      // Do not log tokens, recipient details, payloads or provider responses.
    }
  }
  await sql.query(
    `update customer_order_email_outbox set state=$3,last_error=$4,
    next_attempt_at=now()+$5*interval '1 second',lease_token=null,locked_until=null
    where order_id=$1 and lease_token=$2`,
    [item.order_id, lease, permanent || item.attempts >= 8 ? "failed" : "pending", error, delay],
  );
}

export function startCustomerOrderEmailWorker() {
  if (import.meta.env.VITE_REVIEW_PREVIEW === "true" || !orderEmailConfig(process.env))
    return async () => {};
  let stopped = false,
    timer: ReturnType<typeof setTimeout> | undefined;
  let running: Promise<void> = Promise.resolve();
  const tick = () => {
    running = processCustomerOrderEmails()
      .catch(() => console.warn("[customer-order-email] retry scheduled; checkout unaffected"))
      .finally(() => {
        if (!stopped) {
          timer = setTimeout(tick, 30000);
          timer.unref();
        }
      });
  };
  tick();
  return async () => {
    stopped = true;
    clearTimeout(timer);
    await running;
  };
}

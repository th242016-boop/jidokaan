import { randomUUID } from "node:crypto";
import { getSql } from "./db";
import { inboxEmailConfigured } from "./inbox.server";
import { sendConnectedTelegram, TelegramError } from "./telegram-orders.server";

export async function processInboxNotifications() {
  if (!process.env.TELEGRAM_BOT_TOKEN?.trim()) return;
  const sql = await getSql();
  const lease = randomUUID();
  const claimed = await sql.query<{
    event_id: string;
    inbox_id: string;
    chat_id: string;
    bot_id: string;
    message_text: string;
    attempts: number;
  }>(
    `
    with candidate as (
      select n.event_id from telegram_inbox_outbox n, telegram_order_settings s
      where s.id = 1 and s.enabled and n.bot_id = s.bot_id and n.chat_id = s.chat_id
        and n.state = 'pending' and n.next_attempt_at <= now()
        and (n.locked_until is null or n.locked_until < now())
      order by n.created_at limit 1 for update of n skip locked
    ) update telegram_inbox_outbox n set locked_until = now() + interval '90 seconds',
      lease_token = $1, attempts = attempts + 1 from candidate c where n.event_id = c.event_id
    returning n.event_id, n.inbox_id, n.chat_id, n.bot_id, n.message_text, n.attempts`,
    [lease],
  );
  const item = claimed[0];
  if (!item) return;
  try {
    const sent = await sendConnectedTelegram(
      item.chat_id,
      item.bot_id,
      item.message_text,
      `https://jidokaan.com/admin?p=inbox&inquiry=${encodeURIComponent(item.inbox_id)}`,
    );
    await sql.query(
      `update telegram_inbox_outbox set state = 'sent', sent_at = now(),
      telegram_message_id = $3, locked_until = null, lease_token = null, last_error = null
      where event_id = $1 and lease_token = $2`,
      [item.event_id, lease, String(sent.message_id)],
    );
  } catch (error) {
    const code = error instanceof TelegramError ? error.code : "NOTIFICATION_STORAGE_ERROR";
    const delay = Math.max(
      Math.min(3600, 30 * 2 ** Math.min(item.attempts - 1, 7)),
      error instanceof TelegramError ? error.retryAfter : 0,
    );
    await sql.query(
      `update telegram_inbox_outbox set locked_until = null, lease_token = null,
      next_attempt_at = now() + $3 * interval '1 second', last_error = $4
      where event_id = $1 and lease_token = $2`,
      [item.event_id, lease, delay, code],
    );
  }
}

/** Provider acceptance is not proof of inbox delivery. Freeze payload and key,
 * and stop before Resend's 24-hour idempotency retention ends. */
export async function processInboxEmails() {
  if (!inboxEmailConfigured()) return;
  const sql = await getSql();
  const lease = randomUUID();
  const rows = await sql.query<{
    id: string;
    email_payload: unknown;
    email_attempts: number;
    email_first_at: Date | string;
  }>(
    `
    with candidate as (
      select id from inbox_messages where email_state = 'pending' and email_next_at <= now()
        and (email_locked_until is null or email_locked_until < now())
      order by created_at limit 1 for update skip locked
    ) update inbox_messages m set email_locked_until = now() + interval '90 seconds', email_lease = $1,
      email_attempts = email_attempts + 1, email_first_at = coalesce(email_first_at, now())
    from candidate c where m.id = c.id returning m.id, m.email_payload, m.email_attempts, m.email_first_at`,
    [lease],
  );
  const item = rows[0];
  if (!item) return;
  let error = "EMAIL_UNREACHABLE",
    permanent = false,
    delay = Math.min(3600, 30 * 2 ** Math.min(item.email_attempts - 1, 7));
  if (Date.now() - new Date(item.email_first_at).getTime() >= 23 * 3600000) {
    error = "EMAIL_REVIEW_REQUIRED";
    permanent = true;
  } else {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `inquiry-reply-${item.id}`,
        },
        body:
          typeof item.email_payload === "string"
            ? item.email_payload
            : JSON.stringify(item.email_payload),
        signal: AbortSignal.timeout(15000),
      });
      if (response.ok) {
        const result = (await response.json()) as { id?: string };
        if (!result.id) throw new Error("INVALID_RESPONSE");
        await sql.query(
          `update inbox_messages set email_state = 'accepted', email_provider_id = $3,
          email_lease = null, email_locked_until = null, email_error = null where id = $1 and email_lease = $2`,
          [item.id, lease, result.id],
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
      // No credentials, recipient details or provider response bodies in logs.
    }
  }
  await sql.query(
    `update inbox_messages set email_state = $3, email_error = $4,
    email_next_at = now() + $5 * interval '1 second', email_lease = null, email_locked_until = null
    where id = $1 and email_lease = $2`,
    [item.id, lease, permanent || item.email_attempts >= 8 ? "failed" : "pending", error, delay],
  );
}

export function startInboxWorker() {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running: Promise<unknown> = Promise.resolve();
  const tick = () => {
    running = Promise.allSettled([processInboxNotifications(), processInboxEmails()])
      .then((results) => {
        if (results.some((result) => result.status === "rejected"))
          console.warn("[inbox-notifications] retry scheduled");
      })
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

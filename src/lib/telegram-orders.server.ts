import { createHash, randomBytes, randomUUID } from "node:crypto";
import { assertSession } from "./admin-auth.server";
import { getSql } from "./db";
import { ensureOrderTables } from "./orders.server";
import {
  ORDER_ADMIN_URL,
  ORDER_BOT_USERNAME,
  orderAdminLink,
  orderNotificationText,
} from "./order-notification";
import type { StoreOrder } from "./order-types";

type Settings = {
  bot_id: string | null;
  chat_id: string | null;
  chat_label: string | null;
  enabled: boolean;
  enabled_since: string | Date | null;
  pairing_hash: string | null;
  pairing_expires_at: string | Date | null;
};
type Bot = { id: number; username?: string; is_bot: boolean };
type Update = {
  message?: {
    text?: string;
    date: number;
    from?: { id: number; is_bot?: boolean; username?: string; first_name?: string };
    chat: { id: number; type: string };
  };
};

export class TelegramError extends Error {
  constructor(
    public code: string,
    public retryAfter = 0,
  ) {
    super(code);
  }
}
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const botToken = () => process.env.TELEGRAM_BOT_TOKEN?.trim() || "";
let identity: { hash: string; bot: Bot; expires: number } | undefined;

/** Never propagate Telegram URLs, API responses, or tokens into logs/errors. */
async function telegram<T>(method: string, body: Record<string, unknown> = {}): Promise<T> {
  const token = botToken();
  if (!token) throw new TelegramError("TOKEN_MISSING");
  let response: Response;
  let data: { ok: boolean; result: T; error_code?: number; parameters?: { retry_after?: number } };
  try {
    response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    data = await response.json();
  } catch {
    throw new TelegramError("TELEGRAM_UNREACHABLE");
  }
  if (!response.ok || !data.ok) {
    const code = data.error_code || response.status;
    throw new TelegramError(
      code === 401 || code === 404
        ? "TOKEN_INVALID"
        : code === 403
          ? "BOT_BLOCKED"
          : code === 409
            ? "BOT_IN_USE"
            : code === 429
              ? "RATE_LIMIT"
              : "TELEGRAM_REJECTED",
      Math.max(0, Number(data.parameters?.retry_after) || 0),
    );
  }
  return data.result;
}

async function verifyBot() {
  const digest = hash(botToken());
  if (identity?.hash === digest && identity.expires > Date.now()) return identity.bot;
  const bot = await telegram<Bot>("getMe");
  if (!bot.is_bot || bot.username?.toLowerCase() !== ORDER_BOT_USERNAME) {
    throw new TelegramError("WRONG_BOT");
  }
  identity = { hash: digest, bot, expires: Date.now() + 5 * 60000 };
  return bot;
}

async function settings(): Promise<Settings> {
  const sql = await getSql();
  const rows = await sql.query<Settings>("select * from telegram_order_settings where id = 1");
  if (!rows[0]) throw new TelegramError("SETTINGS_MISSING");
  return rows[0];
}

export async function notificationStatus(token: string) {
  await assertSession(token);
  const s = await settings();
  const sql = await getSql();
  const recent = await sql.query<{
    order_id: string;
    state: string;
    attempts: number;
    sent_at: string | null;
    last_error: string | null;
  }>(
    "select order_id, state, attempts, sent_at, last_error from telegram_order_outbox order by created_at desc limit 10",
  );
  return {
    configured: Boolean(botToken()),
    username: ORDER_BOT_USERNAME,
    connected: Boolean(s.chat_id),
    enabled: s.enabled,
    recipient: s.chat_label,
    enabledSince: s.enabled_since,
    recent,
  };
}

export async function beginNotificationPairing(token: string) {
  await assertSession(token);
  const bot = await verifyBot();
  const webhook = await telegram<{ url: string }>("getWebhookInfo");
  if (webhook.url) throw new TelegramError("BOT_IN_USE");
  const code = randomBytes(18).toString("hex");
  const sql = await getSql();
  await sql.query(
    `update telegram_order_settings set pairing_hash = $1,
    pairing_expires_at = now() + interval '10 minutes' where id = 1`,
    [hash(code)],
  );
  return { url: `https://t.me/${bot.username}?start=${code}`, code, expiresIn: 600 };
}

export async function finishNotificationPairing(token: string, code: string) {
  await assertSession(token);
  if (!/^[a-f0-9]{36}$/.test(code)) throw new TelegramError("PAIR_EXPIRED");
  const s = await settings();
  if (
    s.pairing_hash !== hash(code) ||
    !s.pairing_expires_at ||
    new Date(s.pairing_expires_at).getTime() <= Date.now()
  )
    throw new TelegramError("PAIR_EXPIRED");
  const bot = await verifyBot();
  // One-off pairing only: no continuous polling of personal messages, no webhook changes.
  const updates = await telegram<Update[]>("getUpdates", { limit: 100, timeout: 0 });
  const message = updates
    .map((u) => u.message)
    .find(
      (m) =>
        m?.chat.type === "private" &&
        !m.from?.is_bot &&
        m.from?.id === m.chat.id &&
        m.text?.trim() === `/start ${code}` &&
        m.date * 1000 >= new Date(s.pairing_expires_at!).getTime() - 10 * 60000 - 1000,
    );
  if (!message) throw new TelegramError("PAIR_NOT_FOUND");
  const sql = await getSql();
  const rows = await sql.query(
    `update telegram_order_settings set bot_id = $1, chat_id = $2,
    chat_label = $3, enabled = true,
    enabled_since = case when chat_id = $2 and bot_id = $1 then coalesce(enabled_since, now()) else now() end,
    pairing_hash = null, pairing_expires_at = null
    where id = 1 and pairing_hash = $4 and pairing_expires_at > now() returning id`,
    [
      String(bot.id),
      String(message.chat.id),
      (message.from?.username
        ? `@${message.from.username}`
        : message.from?.first_name || "연결된 개인 계정"
      ).slice(0, 100),
      hash(code),
    ],
  );
  if (!rows.length) throw new TelegramError("PAIR_EXPIRED");
  return notificationStatus(token);
}

export async function setNotificationsEnabled(token: string, enabled: boolean) {
  await assertSession(token);
  const s = await settings();
  if (!s.chat_id) throw new TelegramError("NOT_CONNECTED");
  const sql = await getSql();
  await sql.query("update telegram_order_settings set enabled = $1 where id = 1", [enabled]);
  return notificationStatus(token);
}

async function sendText(chatId: string, text: string, url: string) {
  return telegram<{ message_id: number }>("sendMessage", {
    chat_id: chatId,
    text,
    link_preview_options: { is_disabled: true },
    reply_markup: { inline_keyboard: [[{ text: "관리자에서 확인", url }]] },
  });
}

export async function testOrderNotification(token: string) {
  await assertSession(token);
  const s = await settings();
  if (!s.chat_id) throw new TelegramError("NOT_CONNECTED");
  const bot = await verifyBot();
  if (String(bot.id) !== s.bot_id) throw new TelegramError("WRONG_BOT");
  const sql = await getSql();
  const rows = await sql.query(`update telegram_order_settings set last_test_at = now()
    where id = 1 and (last_test_at is null or last_test_at < now() - interval '15 seconds') returning id`);
  if (!rows.length) throw new TelegramError("TEST_TOO_SOON");
  await sendText(
    s.chat_id,
    "[지도칸] 주문 알림 연결 테스트\n\n이 메시지는 테스트입니다. 실제 주문이나 결제가 발생하지 않았습니다.\n새 주문이 접수되면 이 대화방으로 알려드립니다.",
    `${ORDER_ADMIN_URL}?p=orders`,
  );
  return { ok: true };
}

/** Durable discovery: orders remain the source of truth, including across restarts.
 * No Telegram call or notification-table write runs inside checkout/payment.
 */
export async function processOrderNotifications() {
  if (!botToken()) return;
  const s = await settings();
  if (!s.enabled || !s.chat_id || !s.bot_id || !s.enabled_since) return;
  await ensureOrderTables();
  const sql = await getSql();
  const fresh = await sql.query<{ data: StoreOrder | string }>(
    `select o.data from store_orders o
    where o.created_at >= $1 and not exists (select 1 from telegram_order_outbox n where n.order_id = o.id)
    order by o.created_at limit 100`,
    [s.enabled_since],
  );
  for (const row of fresh) {
    const order: StoreOrder = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
    await sql.query(
      `insert into telegram_order_outbox (order_id, bot_id, chat_id, message_text)
      values ($1, $2, $3, $4) on conflict do nothing`,
      [order.id, s.bot_id, s.chat_id, orderNotificationText(order)],
    );
  }
  // A per-order DB lease prevents two workers from delivering the same row.
  // One send per pass keeps normal traffic below Telegram's per-chat limit.
  const lease = randomUUID();
  const claimed = await sql.query<{
    order_id: string;
    message_text: string;
    attempts: number;
    chat_id: string;
    bot_id: string;
  }>(
    `
    with candidate as (
      select n.order_id from telegram_order_outbox n, telegram_order_settings s
      where s.id = 1 and s.enabled and n.bot_id = s.bot_id and n.chat_id = s.chat_id
        and n.state = 'pending' and n.next_attempt_at <= now()
        and (n.locked_until is null or n.locked_until < now())
      order by n.created_at limit 1 for update of n skip locked
    )
    update telegram_order_outbox n set locked_until = now() + interval '90 seconds',
      lease_token = $1, attempts = attempts + 1
    from candidate c where n.order_id = c.order_id
    returning n.order_id, n.message_text, n.attempts, n.chat_id, n.bot_id`,
    [lease],
  );
  const item = claimed[0];
  if (!item) return;
  try {
    const current = await settings();
    if (!current.enabled || current.chat_id !== item.chat_id || current.bot_id !== item.bot_id) {
      await sql.query(
        "update telegram_order_outbox set locked_until = null, lease_token = null where order_id = $1 and lease_token = $2",
        [item.order_id, lease],
      );
      return;
    }
    const bot = await verifyBot();
    if (String(bot.id) !== item.bot_id) throw new TelegramError("WRONG_BOT");
    const sent = await sendText(item.chat_id, item.message_text, orderAdminLink(item.order_id));
    await sql.query(
      `update telegram_order_outbox set state = 'sent', sent_at = now(),
      telegram_message_id = $3, locked_until = null, lease_token = null, last_error = null
      where order_id = $1 and lease_token = $2`,
      [item.order_id, lease, String(sent.message_id)],
    );
  } catch (error) {
    const code = error instanceof TelegramError ? error.code : "NOTIFICATION_STORAGE_ERROR";
    const delay = Math.max(
      Math.min(3600, 30 * 2 ** Math.min(item.attempts - 1, 7)),
      error instanceof TelegramError ? error.retryAfter : 0,
    );
    await sql.query(
      `update telegram_order_outbox set locked_until = null, lease_token = null,
      next_attempt_at = now() + $3 * interval '1 second', last_error = $4
      where order_id = $1 and lease_token = $2`,
      [item.order_id, lease, delay, code],
    );
  }
}

/** Railway Node runtime worker; stopped on graceful shutdown. */
export function startOrderNotificationWorker() {
  if (!botToken()) return async () => {};
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running: Promise<void> = Promise.resolve();
  const tick = () => {
    running = processOrderNotifications()
      .catch(() => console.warn("[order-notifications] retry scheduled; checkout unaffected"))
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

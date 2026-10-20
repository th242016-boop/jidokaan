import { createHash, randomBytes, randomUUID } from "node:crypto";
import { assertSession } from "./admin-auth.server";
import { getSql } from "./db";
import { inboxCopy, inboxLocale } from "./inbox-copy";
import type { InboxItem } from "./order-types";
import type { InboxChannels, InboxMessage, InboxSummary, InboxThread } from "./inbox-types";

const parse = <T>(value: unknown): T =>
  (typeof value === "string" ? JSON.parse(value) : value) as T;
const validEmail = (email: string) =>
  email.length <= 200 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email);
const uuid = (id: string) => /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(id);
const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
export const inboxAccessUrl = (id: string, key: string) =>
  `https://jidokaan.com/contact#thread=${encodeURIComponent(id)}&key=${encodeURIComponent(key)}`;
export const inboxEmailConfigured = () =>
  Boolean(process.env.RESEND_API_KEY?.trim() && process.env.INQUIRY_EMAIL_FROM?.trim());

/** Shared DB rate limits work across restarts/instances; no raw IP addresses stored. */
export async function limitInboxRequests(subject: string, limit: number, seconds: number) {
  const sql = await getSql();
  const bucket = createHash("sha256").update(subject).digest("hex");
  const rows = await sql.query<{ hits: number }>(
    `insert into inbox_rate_limits (bucket, hits, expires_at)
    values ($1, 1, now() + $2 * interval '1 second') on conflict (bucket) do update set
    hits = case when inbox_rate_limits.expires_at <= now() then 1 else inbox_rate_limits.hits + 1 end,
    expires_at = case when inbox_rate_limits.expires_at <= now() then excluded.expires_at else inbox_rate_limits.expires_at end
    returning hits`,
    [bucket, seconds],
  );
  await sql.query("delete from inbox_rate_limits where expires_at < now()");
  if (rows[0].hits > limit) throw new Error("RATE_LIMIT");
}

async function getItem(id: string): Promise<InboxItem> {
  const sql = await getSql();
  const rows = await sql.query<{ data: unknown; status: "new" | "done" }>(
    "select data, status from store_inbox where id = $1",
    [id],
  );
  if (!rows[0]) throw new Error("NOT_FOUND");
  return { ...parse<InboxItem>(rows[0].data), status: rows[0].status };
}

async function accessKey(id: string) {
  const sql = await getSql();
  // Legacy inquiries get a private link only on an authenticated admin action.
  await sql.query(
    "insert into inbox_access (inbox_id, access_key) values ($1, $2) on conflict do nothing",
    [id, randomBytes(32).toString("hex")],
  );
  const rows = await sql.query<{ access_key: string }>(
    "select access_key from inbox_access where inbox_id = $1",
    [id],
  );
  return rows[0].access_key;
}

async function checkAccess(id: string, key: string) {
  if (!/^[a-f0-9]{64}$/.test(key) || id.length > 80) throw new Error("NOT_FOUND");
  const sql = await getSql();
  const rows = await sql.query(
    "select inbox_id from inbox_access where inbox_id = $1 and access_key = $2",
    [id, key],
  );
  if (!rows.length) throw new Error("NOT_FOUND");
}

async function thread(id: string, key: string, admin: boolean): Promise<InboxThread> {
  const sql = await getSql();
  const item = await getItem(id);
  const messages = await sql.query<InboxMessage>(
    `select id, author, body, created_at as "createdAt",
    site_visible as "siteVisible", ${admin ? "email_state" : "'none'"} as "emailState",
    ${admin ? "email_error" : "null::text"} as "emailError" from inbox_messages
    where inbox_id = $1 ${admin ? "" : "and site_visible"} order by created_at, id`,
    [id],
  );
  return { item, messages, accessUrl: inboxAccessUrl(id, key) };
}

export async function getAdminInbox(token: string, id: string) {
  await assertSession(token);
  await getItem(id);
  return thread(id, await accessKey(id), true);
}

export async function getCustomerInbox(id: string, key: string) {
  await checkAccess(id, key);
  return thread(id, key, false);
}

export async function listInbox(token: string, offset = 0): Promise<InboxSummary[]> {
  await assertSession(token);
  const sql = await getSql();
  const rows = await sql.query<{
    data: unknown;
    status: "new" | "done";
    reply_count: number;
    email_pending: number;
    email_failed: number;
    updated_at: string;
  }>(
    `
    select i.data, i.status, count(m.id) filter (where m.author = 'admin') as reply_count,
    count(m.id) filter (where m.email_state = 'pending') as email_pending,
    count(m.id) filter (where m.email_state = 'failed') as email_failed,
    greatest(i.created_at, max(m.created_at)) as updated_at from store_inbox i
    left join inbox_messages m on m.inbox_id = i.id group by i.id
    order by updated_at desc, i.id desc limit 50 offset $1`,
    [Math.max(0, Math.trunc(offset))],
  );
  return rows.map((r) => ({
    ...parse<InboxItem>(r.data),
    status: r.status,
    replyCount: Number(r.reply_count),
    emailPending: Number(r.email_pending),
    emailFailed: Number(r.email_failed),
    updatedAt: r.updated_at,
  }));
}

export async function inboxChannels(token: string): Promise<InboxChannels> {
  await assertSession(token);
  const sql = await getSql();
  const [settings, recentAlerts] = await Promise.all([
    sql.query<{ enabled: boolean; chat_id: string | null }>(
      "select enabled, chat_id from telegram_order_settings where id = 1",
    ),
    sql.query<{ inbox_id: string; state: string; last_error: string | null }>(
      "select inbox_id, state, last_error from telegram_inbox_outbox order by created_at desc limit 10",
    ),
  ]);
  return {
    emailConfigured: inboxEmailConfigured(),
    telegram: {
      configured: Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim()),
      connected: Boolean(settings[0]?.chat_id),
      enabled: Boolean(settings[0]?.enabled),
    },
    recentAlerts,
  };
}

export async function addInbox(input: {
  name: string;
  email: string;
  message: string;
  trap?: string;
  locale?: string;
  requestId?: string;
}) {
  if (input.trap) return { ok: true };
  const name = text(input.name, 80),
    email = text(input.email, 200).toLowerCase(),
    message = text(input.message, 5000);
  if (
    !name ||
    !validEmail(email) ||
    message.length < 4 ||
    (typeof input.message === "string" && input.message.length > 5000)
  )
    throw new Error("BAD_INBOX");
  const requestId = input.requestId || randomUUID();
  if (!uuid(requestId)) throw new Error("BAD_INBOX");
  const id = `IN-${requestId.toUpperCase()}`;
  const sql = await getSql();
  const existing = await sql.query<{ data: unknown }>(
    "select data from store_inbox where id = $1",
    [id],
  );
  if (existing[0]) {
    const previous = parse<InboxItem>(existing[0].data);
    if (previous.name !== name || previous.email !== email || previous.message !== message)
      throw new Error("CONFLICT");
    return { ok: true, item: previous, accessUrl: inboxAccessUrl(id, await accessKey(id)) };
  }
  await limitInboxRequests(`submit:${email}`, 5, 900);
  const item: InboxItem = {
    id,
    createdAt: new Date().toISOString(),
    name,
    email,
    message,
    status: "new",
    locale: inboxLocale(input.locale),
  };
  const key = randomBytes(32).toString("hex");
  // Inquiry, access link and notification event commit together, without network calls.
  const rows = await sql.query(
    `with inserted as (
      insert into store_inbox (id, data, status) values ($1, $2::jsonb, 'new') on conflict do nothing returning id
    ), access as (
      insert into inbox_access (inbox_id, access_key) select id, $3 from inserted returning inbox_id
    ), alert as (
      insert into telegram_inbox_outbox (event_id, inbox_id, bot_id, chat_id, message_text)
      select i.id, i.id, s.bot_id, s.chat_id, $4 from inserted i cross join telegram_order_settings s
      where s.id = 1 and s.bot_id is not null and s.chat_id is not null on conflict do nothing
    ) select id from inserted`,
    [
      id,
      JSON.stringify(item),
      key,
      `[지도칸] 새 문의가 접수되었습니다.\n\n문의번호: ${id}\n관리자 문의함에서 내용을 확인하고 답변해 주세요.`,
    ],
  );
  if (!rows.length) return addInbox(input);
  return { ok: true, item, accessUrl: inboxAccessUrl(id, key) };
}

export async function updateInbox(token: string, id: string, status: "new" | "done") {
  await assertSession(token);
  if (status !== "new" && status !== "done") throw new Error("BAD_INBOX");
  const sql = await getSql();
  const rows = await sql.query(
    `update store_inbox set status = $2, data = jsonb_set(data, '{status}', to_jsonb($2::text)) where id = $1 returning id`,
    [id, status],
  );
  if (!rows.length) throw new Error("NOT_FOUND");
  return getItem(id);
}

export async function addCustomerMessage(id: string, key: string, body: string, requestId: string) {
  await checkAccess(id, key);
  const content = text(body, 5000);
  if (!content || body.length > 5000 || !uuid(requestId)) throw new Error("BAD_INBOX");
  const sql = await getSql();
  const exists = await sql.query<{ inbox_id: string; body: string; author: string }>(
    "select inbox_id, body, author from inbox_messages where id = $1",
    [requestId],
  );
  if (exists[0]) {
    if (exists[0].inbox_id !== id || exists[0].body !== content || exists[0].author !== "customer")
      throw new Error("CONFLICT");
    return thread(id, key, false);
  }
  await limitInboxRequests(`followup:${id}`, 15, 3600);
  await sql.query(
    `with inserted as (
      insert into inbox_messages (id, inbox_id, author, body) values ($1, $2, 'customer', $3) on conflict do nothing returning id
    ), reopened as (
      update store_inbox set status = 'new', data = jsonb_set(data, '{status}', '"new"'::jsonb)
      where id = $2 and exists (select 1 from inserted)
    ) insert into telegram_inbox_outbox (event_id, inbox_id, bot_id, chat_id, message_text)
    select i.id, $2, s.bot_id, s.chat_id, $4 from inserted i cross join telegram_order_settings s
    where s.id = 1 and s.bot_id is not null and s.chat_id is not null on conflict do nothing`,
    [
      requestId,
      id,
      content,
      `[지도칸] 고객이 추가 문의를 남겼습니다.\n\n문의번호: ${id}\n관리자 문의함에서 대화를 확인해 주세요.`,
    ],
  );
  return thread(id, key, false);
}

export async function replyInbox(
  token: string,
  input: { id: string; body: string; requestId: string; site: boolean; email: boolean },
) {
  await assertSession(token);
  const { id, requestId, site, email } = input;
  const content = text(input.body, 5000);
  if (!content || input.body.length > 5000 || !uuid(requestId) || (!site && !email))
    throw new Error("BAD_INBOX");
  const item = await getItem(id);
  const key = await accessKey(id);
  const sql = await getSql();
  const existing = await sql.query<{
    inbox_id: string;
    author: string;
    body: string;
    site_visible: boolean;
    email_state: string;
  }>("select inbox_id, author, body, site_visible, email_state from inbox_messages where id = $1", [
    requestId,
  ]);
  if (existing[0]) {
    const m = existing[0];
    if (
      m.inbox_id !== id ||
      m.author !== "admin" ||
      m.body !== content ||
      m.site_visible !== site ||
      (m.email_state !== "none") !== email
    )
      throw new Error("CONFLICT");
    return thread(id, key, true);
  }
  if (email && !inboxEmailConfigured()) throw new Error("EMAIL_NOT_CONFIGURED");
  if (email && !validEmail(item.email)) throw new Error("BAD_EMAIL");
  const copy = inboxCopy(item.locale);
  // Freeze the payload so retry requests always use the same idempotency key + body.
  const payload = email
    ? {
        from: process.env.INQUIRY_EMAIL_FROM!.trim(),
        to: [item.email],
        reply_to: process.env.INQUIRY_EMAIL_REPLY_TO?.trim() || "th242016@naver.com",
        subject: `${copy.emailSubject} [${id}]`,
        text: `${content}\n\n— JIDOKAAN\n\n${copy.emailFooter}\n${inboxAccessUrl(id, key)}`,
      }
    : null;
  await sql.query(
    `with inserted as (
      insert into inbox_messages (id, inbox_id, author, body, site_visible, email_state, email_payload)
      values ($1, $2, 'admin', $3, $4, $5, $6::jsonb) on conflict do nothing returning id
    ) update store_inbox set status = 'done', data = jsonb_set(data, '{status}', '"done"'::jsonb)
    where id = $2 and exists (select 1 from inserted)`,
    [requestId, id, content, site, email ? "pending" : "none", JSON.stringify(payload)],
  );
  return thread(id, key, true);
}

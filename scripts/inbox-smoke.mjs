// Disposable database and mocked providers only: never contact real customers or Telegram.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const temp = await mkdtemp(resolve(tmpdir(), "jidokaan-inbox-test-"));
const previous = process.cwd();
process.env.DATABASE_URL = "";
process.env.LIVE_ORIGIN = "http://127.0.0.1:9";
for (const key of [
  "TELEGRAM_BOT_TOKEN",
  "RESEND_API_KEY",
  "INQUIRY_EMAIL_FROM",
  "INQUIRY_EMAIL_REPLY_TO",
])
  delete process.env[key];
process.chdir(temp);
const server = await createServer({
  configFile: false,
  root,
  resolve: { alias: { "@": resolve(root, "src") } },
  server: { middlewareMode: true },
  appType: "custom",
});
let db,
  count = 0,
  telegramCalls = [],
  emailCalls = [],
  telegramFailure = false,
  emailMode = "ok";
globalThis.fetch = async (url, options = {}) => {
  const body = JSON.parse(options.body || "{}");
  if (String(url).startsWith("https://api.telegram.org/botTEST-ONLY/")) {
    if (String(url).endsWith("/getMe"))
      return Response.json({
        ok: true,
        result: { id: 123, is_bot: true, username: "jidokaan_bot" },
      });
    assert.ok(String(url).endsWith("/sendMessage"));
    if (telegramFailure)
      return Response.json(
        { ok: false, error_code: 429, parameters: { retry_after: 120 } },
        { status: 429 },
      );
    telegramCalls.push(body);
    return Response.json({ ok: true, result: { message_id: telegramCalls.length } });
  }
  assert.equal(url, "https://api.resend.com/emails", "block all unexpected outbound hosts");
  assert.equal(options.headers.Authorization, "Bearer TEST-ONLY");
  assert.ok(body.to.every((email) => email.endsWith("@example.invalid")));
  emailCalls.push({ body, key: options.headers["Idempotency-Key"] });
  if (emailMode === "timeout") throw new Error("test timeout");
  if (emailMode === "rate")
    return Response.json({}, { status: 429, headers: { "retry-after": "120" } });
  if (emailMode === "reject") return Response.json({}, { status: 422 });
  return Response.json({ id: "provider-test-id" });
};
const check = async (label, fn) => {
  await fn();
  count++;
  console.log(`PASS ${label}`);
};
try {
  db = await server.ssrLoadModule("/src/lib/db.ts");
  const auth = await server.ssrLoadModule("/src/lib/admin-auth.server.ts");
  const inbox = await server.ssrLoadModule("/src/lib/inbox.server.ts");
  const worker = await server.ssrLoadModule("/src/lib/inbox-notifications.server.ts");
  const api = (await server.ssrLoadModule("/src/routes/api/inbox.ts")).Route.options.server
    .handlers;
  const sql = await db.getSql(),
    token = await auth.createSession();
  const post = (body, admin = "") =>
    api.POST({
      request: new Request("https://jidokaan.com/api/inbox", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(admin ? { Authorization: `Bearer ${admin}` } : {}),
        },
        body: JSON.stringify(body),
      }),
    });
  const get = (query = "", admin = "") =>
    api.GET({
      request: new Request(`https://jidokaan.com/api/inbox${query}`, {
        headers: admin ? { Authorization: `Bearer ${admin}` } : {},
      }),
    });
  const input = {
    name: "TEST CUSTOMER",
    email: "customer@example.invalid",
    message: "PRIVATE ORIGINAL QUESTION <script>bad()</script>",
    locale: "en",
    requestId: randomUUID(),
  };
  let initial, key;
  await check("unauthenticated admin list, detail, replies and status changes denied", async () => {
    assert.equal((await get()).status, 401);
    assert.equal((await get("?id=IN-old")).status, 401);
    assert.equal(
      (
        await post({
          action: "reply",
          id: "IN-old",
          message: "test",
          requestId: randomUUID(),
          site: true,
        })
      ).status,
      401,
    );
    assert.equal((await post({ action: "update", id: "IN-old" })).status, 401);
  });
  const legacy = {
    id: "IN-LEGACY",
    name: "Legacy customer",
    email: "old@example.invalid",
    message: "Old question",
    status: "new",
    createdAt: "2026-10-01T00:00:00Z",
  };
  await sql.query("insert into store_inbox (id, data, created_at) values ($1, $2::jsonb, $3)", [
    legacy.id,
    JSON.stringify(legacy),
    legacy.createdAt,
  ]);
  process.env.TELEGRAM_BOT_TOKEN = "TEST-ONLY";
  await sql.query(
    "update telegram_order_settings set enabled = true, bot_id = '123', chat_id = '777', enabled_since = now() where id = 1",
  );
  await check("existing inquiry retained; migration does not replay old alerts", async () => {
    const detail = await inbox.getAdminInbox(token, legacy.id);
    assert.equal(detail.item.message, "Old question");
    assert.ok(detail.accessUrl.includes("#thread="));
    await worker.processInboxNotifications();
    assert.equal(telegramCalls.length, 0);
  });
  await check(
    "inquiry, private access and Telegram event created atomically; retry deduplicates",
    async () => {
      const response = await post(input);
      assert.equal(response.status, 200);
      initial = await response.json();
      key = new URLSearchParams(new URL(initial.accessUrl).hash.slice(1)).get("key");
      assert.equal(key.length, 64);
      const duplicate = await inbox.addInbox(input);
      assert.equal(duplicate.accessUrl, initial.accessUrl);
      assert.equal((await sql.query("select count(*) as n from telegram_inbox_outbox"))[0].n, 1);
      assert.equal((await inbox.listInbox(token)).length, 2);
    },
  );
  await check(
    "private thread requires exact secret, not just ID/email; admin list has no secrets",
    async () => {
      assert.equal(
        (await post({ action: "lookup", id: initial.item.id, key: "0".repeat(64) })).status,
        404,
      );
      assert.equal(
        (await post({ action: "lookup", id: initial.item.id, email: input.email })).status,
        404,
      );
      const publicThread = await inbox.getCustomerInbox(initial.item.id, key);
      assert.equal(publicThread.item.message, input.message);
      const response = await get("", token);
      assert.equal(response.status, 200);
      const raw = await response.text();
      assert.ok(!raw.includes(key));
      assert.ok(!raw.includes("TEST-ONLY"));
    },
  );
  await check(
    "new inquiry alert uses existing bot/recipient and authenticated deep link; no private content",
    async () => {
      await Promise.all([worker.processInboxNotifications(), worker.processInboxNotifications()]);
      assert.equal(telegramCalls.length, 1);
      assert.equal(telegramCalls[0].chat_id, "777");
      const raw = JSON.stringify(telegramCalls[0]);
      assert.ok(raw.includes("p=inbox"));
      assert.ok(!raw.includes(key));
      assert.ok(!raw.includes(input.email));
      assert.ok(!raw.includes(input.message));
      await worker.processInboxNotifications();
      assert.equal(telegramCalls.length, 1);
    },
  );
  let siteReply;
  await check(
    "admin reply is durable, idempotent, and visible only in this private thread",
    async () => {
      siteReply = {
        id: initial.item.id,
        body: "A real saved answer <b>plain text</b>",
        requestId: randomUUID(),
        site: true,
        email: false,
      };
      await inbox.replyInbox(token, siteReply);
      await inbox.replyInbox(token, siteReply);
      const result = await inbox.getCustomerInbox(initial.item.id, key);
      assert.equal(result.messages.length, 1);
      assert.equal(result.item.status, "done");
      assert.equal(result.messages[0].body, siteReply.body);
      assert.equal((await inbox.getAdminInbox(token, legacy.id)).messages.length, 0);
      await assert.rejects(
        () => inbox.replyInbox(token, { ...siteReply, body: "Changed" }),
        /CONFLICT/,
      );
    },
  );
  await check("unconfigured email fails explicitly, never reports a nonexistent send", async () => {
    assert.equal(
      (
        await post(
          {
            action: "reply",
            id: legacy.id,
            message: "Email reply",
            requestId: randomUUID(),
            site: true,
            emailReply: true,
          },
          token,
        )
      ).status,
      409,
    );
    assert.equal((await inbox.getAdminInbox(token, legacy.id)).messages.length, 0);
    assert.equal((await inbox.inboxChannels(token)).emailConfigured, false);
    await worker.processInboxEmails();
    assert.equal(emailCalls.length, 0);
  });
  await check(
    "customer follow-up reopens inquiry, adds one event, and preserves admin answer",
    async () => {
      const requestId = randomUUID();
      await inbox.addCustomerMessage(initial.item.id, key, "Follow-up question", requestId);
      await inbox.addCustomerMessage(initial.item.id, key, "Follow-up question", requestId);
      const result = await inbox.getCustomerInbox(initial.item.id, key);
      assert.equal(result.item.status, "new");
      assert.equal(result.messages.length, 2);
      assert.equal((await sql.query("select count(*) as n from telegram_inbox_outbox"))[0].n, 2);
      await assert.rejects(
        () => inbox.addCustomerMessage(legacy.id, key, "wrong thread", randomUUID()),
        /NOT_FOUND/,
      );
    },
  );
  await check(
    "Telegram rate limiting retains the inquiry and retries without duplication",
    async () => {
      telegramFailure = true;
      await worker.processInboxNotifications();
      let rows = await sql.query(
        "select state, last_error, next_attempt_at > now() + interval '110 seconds' as delayed from telegram_inbox_outbox where state = 'pending'",
      );
      assert.equal(rows[0].last_error, "RATE_LIMIT");
      assert.equal(rows[0].delayed, true);
      telegramFailure = false;
      await sql.query(
        "update telegram_inbox_outbox set next_attempt_at = now() where state = 'pending'",
      );
      await worker.processInboxNotifications();
      assert.equal(telegramCalls.length, 2);
    },
  );
  await check(
    "paused notifications resume; changing recipient never forwards old pending content",
    async () => {
      await sql.query("update telegram_order_settings set enabled = false where id = 1");
      await inbox.addCustomerMessage(initial.item.id, key, "During pause", randomUUID());
      await worker.processInboxNotifications();
      assert.equal(telegramCalls.length, 2);
      await sql.query("update telegram_order_settings set enabled = true where id = 1");
      await worker.processInboxNotifications();
      assert.equal(telegramCalls.length, 3);
      await inbox.addCustomerMessage(initial.item.id, key, "Old recipient pending", randomUUID());
      await sql.query("update telegram_order_settings set chat_id = '888' where id = 1");
      await worker.processInboxNotifications();
      assert.equal(telegramCalls.length, 3);
    },
  );
  process.env.RESEND_API_KEY = "TEST-ONLY";
  process.env.INQUIRY_EMAIL_FROM = "JIDOKAAN <support@example.invalid>";
  let emailReply;
  await check(
    "site plus email queues an immutable plain-text message and accepts it only once",
    async () => {
      emailReply = {
        id: initial.item.id,
        body: "Answer in customer language.",
        requestId: randomUUID(),
        site: true,
        email: true,
      };
      await inbox.replyInbox(token, emailReply);
      assert.equal(
        (await inbox.getAdminInbox(token, initial.item.id)).messages.at(-1).emailState,
        "pending",
      );
      await Promise.all([worker.processInboxEmails(), worker.processInboxEmails()]);
      assert.equal(emailCalls.length, 1);
      assert.equal(emailCalls[0].body.to[0], input.email);
      assert.ok(emailCalls[0].body.text.includes(initial.accessUrl));
      assert.ok(!emailCalls[0].body.html);
      assert.equal(
        (await inbox.getAdminInbox(token, initial.item.id)).messages.at(-1).emailState,
        "accepted",
      );
      await inbox.replyInbox(token, emailReply);
      await worker.processInboxEmails();
      assert.equal(emailCalls.length, 1);
    },
  );
  await check("email-only answer is absent from customer website thread", async () => {
    const input = {
      id: initial.item.id,
      body: "Email only content",
      requestId: randomUUID(),
      site: false,
      email: true,
    };
    await inbox.replyInbox(token, input);
    assert.ok(
      !(await inbox.getCustomerInbox(initial.item.id, key)).messages.some(
        (m) => m.body === input.body,
      ),
    );
    assert.ok(
      (await inbox.getAdminInbox(token, initial.item.id)).messages.some(
        (m) => m.body === input.body,
      ),
    );
  });
  await check(
    "email outage retries same key and payload; site answer remains available",
    async () => {
      emailMode = "timeout";
      await worker.processInboxEmails();
      const first = emailCalls.at(-1);
      await sql.query(
        "update inbox_messages set email_next_at = now() where email_state = 'pending'",
      );
      emailMode = "ok";
      await worker.processInboxEmails();
      assert.deepEqual(emailCalls.at(-1), first);
      assert.equal(
        (await inbox.getCustomerInbox(initial.item.id, key)).messages.filter(
          (m) => m.author === "admin",
        ).length,
        2,
      );
    },
  );
  await check("permanent email rejection remains visible as failed, not delivered", async () => {
    await inbox.replyInbox(token, {
      id: legacy.id,
      body: "Rejected send",
      requestId: randomUUID(),
      site: true,
      email: true,
    });
    emailMode = "reject";
    await worker.processInboxEmails();
    const result = await inbox.getAdminInbox(token, legacy.id);
    assert.equal(result.messages.at(-1).emailState, "failed");
    assert.equal(result.messages.at(-1).emailError, "EMAIL_REJECTED");
  });
  await check("ambiguous retries stop before provider deduplication expires", async () => {
    await inbox.replyInbox(token, {
      id: legacy.id,
      body: "Needs manual review",
      requestId: randomUUID(),
      site: true,
      email: true,
    });
    await sql.query(
      "update inbox_messages set email_first_at = now() - interval '24 hours' where email_state = 'pending'",
    );
    const before = emailCalls.length;
    await worker.processInboxEmails();
    assert.equal(emailCalls.length, before);
    assert.equal(
      (await inbox.getAdminInbox(token, legacy.id)).messages.at(-1).emailError,
      "EMAIL_REVIEW_REQUIRED",
    );
  });
  await check(
    "invalid form input, oversized bodies, unknown actions and spam are rejected",
    async () => {
      for (const body of [
        { ...input, email: "bad", requestId: randomUUID() },
        { ...input, name: {}, requestId: randomUUID() },
        { action: "delete" },
        { ...input, message: "x".repeat(25000) },
      ])
        assert.ok((await post(body)).status >= 400);
      const before = (await inbox.listInbox(token)).length;
      await inbox.addInbox({ ...input, trap: "bot" });
      assert.equal((await inbox.listInbox(token)).length, before);
      await inbox.limitInboxRequests("isolated-bucket", 1, 60);
      await assert.rejects(() => inbox.limitInboxRequests("isolated-bucket", 1, 60), /RATE_LIMIT/);
    },
  );
  await check("legacy replies work and status updates preserve message history", async () => {
    const before = (await inbox.getAdminInbox(token, legacy.id)).messages.length;
    await inbox.updateInbox(token, legacy.id, "new");
    assert.equal((await inbox.getAdminInbox(token, legacy.id)).messages.length, before);
    assert.equal((await inbox.getAdminInbox(token, legacy.id)).item.message, legacy.message);
  });
  console.log(`${count} checks passed. No real messages, emails, customers or orders used.`);
} finally {
  await server.close();
  if (db) await (await db.getPglite()).close();
  process.chdir(previous);
  await rm(temp, { recursive: true, force: true });
}

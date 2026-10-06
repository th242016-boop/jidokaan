// Disposable PGlite, fake Telegram responses; no real recipients or orders.
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const temp = await mkdtemp(resolve(tmpdir(), "jidokaan-telegram-test-"));
const previousCwd = process.cwd();
process.env.DATABASE_URL = "";
process.env.LIVE_ORIGIN = "http://127.0.0.1:9";
delete process.env.TELEGRAM_BOT_TOKEN;
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
  calls = [],
  updates = [],
  sent = [],
  failSend = false,
  webhook = "";
globalThis.fetch = async (url, options = {}) => {
  assert.ok(
    String(url).startsWith("https://api.telegram.org/botTEST-ONLY/"),
    "no live credentials or hosts permitted",
  );
  const method = String(url).split("/").at(-1);
  const body = JSON.parse(options.body || "{}");
  calls.push(method);
  if (method === "getMe")
    return Response.json({ ok: true, result: { id: 123, is_bot: true, username: "jidokaan_bot" } });
  if (method === "getWebhookInfo") return Response.json({ ok: true, result: { url: webhook } });
  if (method === "getUpdates") return Response.json({ ok: true, result: updates });
  if (method === "sendMessage") {
    if (failSend)
      return Response.json(
        { ok: false, error_code: 429, parameters: { retry_after: 120 } },
        { status: 429 },
      );
    sent.push(body);
    return Response.json({ ok: true, result: { message_id: sent.length } });
  }
  throw new Error("UNEXPECTED_METHOD");
};
async function check(label, fn) {
  await fn();
  count++;
  console.log(`PASS ${label}`);
}
try {
  db = await server.ssrLoadModule("/src/lib/db.ts");
  const auth = await server.ssrLoadModule("/src/lib/admin-auth.server.ts");
  const orders = await server.ssrLoadModule("/src/lib/orders.server.ts");
  const alerts = await server.ssrLoadModule("/src/lib/telegram-orders.server.ts");
  const formatting = await server.ssrLoadModule("/src/lib/order-notification.ts");
  const sql = await db.getSql();
  const token = await auth.createSession();
  await orders.ensureOrderTables();
  const orderInput = {
    email: "test@example.invalid",
    name: "TEST CUSTOMER",
    phone: "TEST PHONE",
    address: "PRIVATE ADDRESS",
    city: "Test city",
    region: "CA",
    postal: "00000",
    country: "US",
    pay: "paypal",
    shipMethod: "standard",
    currency: "USD",
    totalUsd: 315,
    totalKrw: 425250,
    shippingUsd: 85,
    shippingKrw: 96500,
    paypalOrderId: "TEST-PAYMENT-1",
    paypalCaptureId: "TEST-CAPTURE",
    items: [
      {
        productId: "drone-custom",
        name: "CUSTOM <shoe>",
        qty: 1,
        size: "260",
        priceUsd: 230,
        priceKrw: 310500,
        partNames: { model: "mid" },
        designPreview: "PRIVATE IMAGE",
      },
    ],
  };
  const historical = await orders.placeOrder({ ...orderInput, paypalOrderId: "HISTORY" });
  await sql.query("update store_orders set created_at = now() - interval '1 day' where id = $1", [
    historical.id,
  ]);
  await check(
    "no token means no outbound requests; unauthenticated setup is rejected",
    async () => {
      await alerts.processOrderNotifications();
      assert.equal(calls.length, 0);
      for (const fn of [
        () => alerts.notificationStatus("bad"),
        () => alerts.beginNotificationPairing("bad"),
        () => alerts.finishNotificationPairing("bad", "fake"),
        () => alerts.testOrderNotification("bad"),
        () => alerts.setNotificationsEnabled("bad", true),
      ])
        await assert.rejects(fn, /AUTH/);
      assert.equal((await alerts.notificationStatus(token)).configured, false);
    },
  );
  process.env.TELEGRAM_BOT_TOKEN = "TEST-ONLY";
  let pair;
  await check("existing webhook is not removed or overwritten", async () => {
    webhook = "https://example.invalid/other-bot";
    await assert.rejects(alerts.beginNotificationPairing(token), /BOT_IN_USE/);
    assert.ok(!calls.includes("deleteWebhook"));
    webhook = "";
  });
  await check("pairing requires a fresh nonce from a private human chat", async () => {
    pair = await alerts.beginNotificationPairing(token);
    assert.equal(new URL(pair.url).hostname, "t.me");
    const baseMessage = {
      date: Math.floor(Date.now() / 1000),
      from: { id: 555, username: "test_owner" },
      chat: { id: 555, type: "private" },
    };
    for (const bad of [
      { ...baseMessage, text: "/start wrong" },
      { ...baseMessage, text: `/start ${pair.code}`, chat: { id: -555, type: "group" } },
      { ...baseMessage, text: `/start ${pair.code}`, from: { id: 555, is_bot: true } },
      { ...baseMessage, text: `/start ${pair.code}`, date: 1 },
    ]) {
      updates = [{ message: bad }];
      await assert.rejects(alerts.finishNotificationPairing(token, pair.code), /PAIR_NOT_FOUND/);
    }
    updates = [{ message: { ...baseMessage, text: `/start ${pair.code}` } }];
    const result = await alerts.finishNotificationPairing(token, pair.code);
    assert.equal(result.connected, true);
    assert.equal(result.recipient, "@test_owner");
    assert.ok(!JSON.stringify(result).includes("TEST-ONLY"));
    await assert.rejects(alerts.finishNotificationPairing(token, pair.code), /PAIR_EXPIRED/);
  });
  await check("explicit test message creates no order and is throttled", async () => {
    const before = (await orders.listOrders(token)).length;
    await alerts.testOrderNotification(token);
    assert.match(sent.at(-1).text, /테스트/);
    assert.equal(sent.at(-1).chat_id, "555");
    assert.equal((await orders.listOrders(token)).length, before);
    await assert.rejects(alerts.testOrderNotification(token), /TEST_TOO_SOON/);
  });
  let paid;
  await check(
    "new paid order sends one minimal alert; historical orders are excluded",
    async () => {
      paid = await orders.placeOrder(orderInput);
      const before = sent.length;
      await Promise.all([alerts.processOrderNotifications(), alerts.processOrderNotifications()]);
      assert.equal(sent.length, before + 1);
      const message = sent.at(-1);
      assert.match(message.text, /결제 완료/);
      assert.match(message.text, /중목/);
      assert.match(message.text, /260/);
      assert.match(message.text, /미국 \(US\)/);
      assert.match(message.text, /315/);
      assert.equal(message.parse_mode, undefined);
      assert.equal(
        new URL(message.reply_markup.inline_keyboard[0][0].url).searchParams.get("order"),
        paid.id,
      );
      for (const hidden of ["PRIVATE", "test@example.invalid", "TEST PHONE", "TEST-CAPTURE"])
        assert.ok(!message.text.includes(hidden));
      assert.equal(
        (await sql.query("select * from telegram_order_outbox where order_id=$1", [historical.id]))
          .length,
        0,
      );
      const repeated = await orders.placeOrder(orderInput);
      assert.equal(repeated.id, paid.id);
      await alerts.processOrderNotifications();
      assert.equal(sent.length, before + 1);
    },
  );
  let waiting;
  await check(
    "notification failure never breaks checkout; retry persists with Retry-After",
    async () => {
      failSend = true;
      waiting = await orders.placeOrder({
        ...orderInput,
        paypalOrderId: undefined,
        pay: "transfer",
      });
      assert.equal(waiting.status, "wait");
      await alerts.processOrderNotifications();
      const row = (
        await sql.query("select * from telegram_order_outbox where order_id=$1", [waiting.id])
      )[0];
      assert.equal(row.state, "pending");
      assert.equal(row.last_error, "RATE_LIMIT");
      assert.ok(new Date(row.next_attempt_at).getTime() > Date.now() + 110000);
      const attempts = row.attempts;
      await alerts.processOrderNotifications();
      assert.equal(
        (
          await sql.query("select attempts from telegram_order_outbox where order_id=$1", [
            waiting.id,
          ])
        )[0].attempts,
        attempts,
      );
      failSend = false;
      await sql.query("update telegram_order_outbox set next_attempt_at=now() where order_id=$1", [
        waiting.id,
      ]);
      await alerts.processOrderNotifications();
      assert.match(sent.at(-1).text, /입금 대기 · 아직 결제되지 않음/);
      assert.match(sent.at(-1).text, /입금 예정액/);
    },
  );
  await check(
    "pause suppresses delivery; resume discovers orders missed while stopped",
    async () => {
      await alerts.setNotificationsEnabled(token, false);
      const paused = await orders.placeOrder({ ...orderInput, paypalOrderId: "WHILE-PAUSED" });
      const before = sent.length;
      await alerts.processOrderNotifications();
      assert.equal(sent.length, before);
      await alerts.setNotificationsEnabled(token, true);
      await alerts.processOrderNotifications();
      assert.equal(sent.length, before + 1);
      assert.match(sent.at(-1).text, new RegExp(paused.id));
    },
  );
  await check("expired worker lease is retried after a simulated process restart", async () => {
    const crashed = await orders.placeOrder({ ...orderInput, paypalOrderId: "CRASH-RECOVERY" });
    await sql.query(
      `insert into telegram_order_outbox
      (order_id, bot_id, chat_id, message_text, locked_until, lease_token)
      values ($1, '123', '555', $2, now() - interval '1 second', 'dead-worker')`,
      [crashed.id, formatting.orderNotificationText(crashed)],
    );
    await alerts.processOrderNotifications();
    assert.equal(
      (
        await sql.query("select state from telegram_order_outbox where order_id=$1", [crashed.id])
      )[0].state,
      "sent",
    );
  });
  await check("expired pairing and a token for another bot cannot bind a recipient", async () => {
    const expired = await alerts.beginNotificationPairing(token);
    await sql.query(
      "update telegram_order_settings set pairing_expires_at=now() - interval '1 second'",
    );
    await assert.rejects(alerts.finishNotificationPairing(token, expired.code), /PAIR_EXPIRED/);
    const original = globalThis.fetch;
    process.env.TELEGRAM_BOT_TOKEN = "WRONG-TEST";
    globalThis.fetch = async () =>
      Response.json({ ok: true, result: { id: 456, is_bot: true, username: "other_bot" } });
    await assert.rejects(alerts.beginNotificationPairing(token), /WRONG_BOT/);
    globalThis.fetch = original;
    process.env.TELEGRAM_BOT_TOKEN = "TEST-ONLY";
  });
  await check(
    "notification endpoint and direct order links enforce administrator authentication",
    async () => {
      const notificationRoute = await server.ssrLoadModule(
        "/src/routes/api/order-notifications.ts",
      );
      const orderRoute = await server.ssrLoadModule("/src/routes/api/orders.ts");
      const notifications = notificationRoute.Route.options.server.handlers.POST;
      const directOrder = orderRoute.Route.options.server.handlers.GET;
      const make = (action, authenticated = false) =>
        new Request("https://jidokaan.com/api/order-notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authenticated ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ action }),
        });
      assert.equal((await notifications({ request: make("status") })).status, 401);
      const status = await notifications({ request: make("status", true) });
      assert.equal(status.status, 200);
      assert.equal(status.headers.get("Cache-Control"), "no-store");
      assert.ok(!(await status.text()).includes("TEST-ONLY"));
      const target = `https://jidokaan.com/api/orders?id=${paid.id}`;
      assert.equal(
        (await directOrder({ request: new Request(target, { headers: { host: "jidokaan.com" } }) }))
          .status,
        401,
      );
      const detail = await directOrder({
        request: new Request(target, {
          headers: { host: "jidokaan.com", Authorization: `Bearer ${token}` },
        }),
      });
      assert.equal(detail.status, 200);
      assert.equal((await detail.json()).order.id, paid.id);
    },
  );
  console.log(`${count} checks passed; only mocked Telegram and disposable orders used.`);
} finally {
  await server.close();
  if (db) await (await db.getPglite()).close();
  process.chdir(previousCwd);
  await rm(temp, { recursive: true, force: true });
}

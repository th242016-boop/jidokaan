// Disposable PGlite + mocked Resend only. No live credentials or customer data.
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const temp = await mkdtemp(resolve(tmpdir(), "jidokaan-customer-email-"));
const cwd = process.cwd();
process.env.DATABASE_URL = "";
for (const name of [
  "ORDER_EMAIL_ENABLED",
  "ORDER_EMAIL_FROM",
  "ORDER_EMAIL_START_AT",
  "ORDER_EMAIL_REPLY_TO",
  "RESEND_API_KEY",
  "TELEGRAM_BOT_TOKEN",
  "VITE_REVIEW_PREVIEW",
  "REVIEW_PREVIEW",
])
  delete process.env[name];
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
  mode = "ok",
  calls = [];
const accepted = new Map();
globalThis.fetch = async (url, options) => {
  assert.equal(url, "https://api.resend.com/emails", "unexpected network blocked");
  assert.equal(options.headers.Authorization, "Bearer TEST-ONLY");
  const body = JSON.parse(options.body);
  assert.ok(body.to.every((email) => email.endsWith("@example.invalid")));
  const key = options.headers["Idempotency-Key"];
  calls.push({ body, key });
  if (mode === "timeout") throw Error("test timeout");
  if (mode === "rate") return Response.json({}, { status: 429, headers: { "retry-after": "120" } });
  if (mode === "reject") return Response.json({}, { status: 422 });
  if (!accepted.has(key)) accepted.set(key, `fake-provider-${accepted.size + 1}`);
  return Response.json({ id: accepted.get(key) });
};
const check = async (name, fn) => {
  await fn();
  count++;
  console.log(`PASS ${name}`);
};
try {
  db = await server.ssrLoadModule("/src/lib/db.ts");
  const sql = await db.getSql();
  const orders = await server.ssrLoadModule("/src/lib/orders.server.ts");
  await orders.ensureOrderTables();
  const worker = await server.ssrLoadModule("/src/lib/customer-order-emails.server.ts");
  const content = await server.ssrLoadModule("/src/lib/customer-order-email.ts");
  const base = {
    id: "TEST-ORDER",
    email: "customer@example.invalid",
    status: "paid",
    pay: "paypal",
    paypalCaptureId: "TESTCAPTURE",
    currency: "USD",
    totalUsd: 335,
    country: "US",
    checkoutLocale: "en",
    items: [{ productId: "drone-custom", qty: 1 }],
  };
  const insert = async (id, patch = {}, date = new Date()) => {
    const order = { ...base, ...patch, id };
    await sql.query(
      "insert into store_orders(id,data,status,created_at) values($1,$2::jsonb,$3,$4)",
      [id, JSON.stringify(order), order.status, date.toISOString()],
    );
    return order;
  };
  const state = async (id) =>
    (await sql.query("select * from customer_order_email_outbox where order_id=$1", [id]))[0];
  const now = Date.now();
  await check(
    "default, incomplete activation, invalid cutoff and preview all disable delivery",
    async () => {
      await insert("DEFAULT");
      await worker.processCustomerOrderEmails();
      assert.equal(calls.length, 0);
      assert.equal((await sql.query("select * from customer_order_email_outbox")).length, 0);
      assert.equal(
        content.orderEmailConfig({
          ORDER_EMAIL_ENABLED: "true",
          RESEND_API_KEY: "x",
          ORDER_EMAIL_FROM: "test@example.invalid",
        }),
        null,
      );
      const valid = {
        ORDER_EMAIL_ENABLED: "true",
        RESEND_API_KEY: "x",
        ORDER_EMAIL_FROM: "test@example.invalid",
        ORDER_EMAIL_START_AT: new Date(now).toISOString(),
      };
      assert.ok(content.orderEmailConfig(valid));
      assert.equal(content.orderEmailConfig({ ...valid, ORDER_EMAIL_START_AT: "yesterday" }), null);
      assert.equal(
        content.orderEmailConfig({ ...valid, ORDER_EMAIL_START_AT: "2026-11-14T00:00:00" }),
        null,
      );
      assert.equal(content.orderEmailConfig({ ...valid, VITE_REVIEW_PREVIEW: "true" }), null);
      assert.equal(content.orderEmailConfig({ ...valid, REVIEW_PREVIEW: "true" }), null);
    },
  );
  Object.assign(process.env, {
    ORDER_EMAIL_ENABLED: "true",
    RESEND_API_KEY: "TEST-ONLY",
    ORDER_EMAIL_FROM: "JIDOKAAN Test <orders@example.invalid>",
    ORDER_EMAIL_START_AT: new Date(now + 1000).toISOString(),
  });
  const future = new Date(now + 2000);
  await check(
    "no historical backfill, unpaid or cancelled orders; unverified/placeholder/domestic suppressed",
    async () => {
      await insert("OLD", {}, new Date(now - 86400000));
      await insert("WAIT", { pay: "transfer", status: "wait" }, future);
      await insert("CANCELLED", { status: "cancel" }, future);
      await insert("UNVERIFIED", { paypalCaptureId: undefined }, future);
      await insert("PLACEHOLDER", { email: "kakao-123@login.jidokaan.com" }, future);
      await insert("DOMESTIC", { currency: "KRW", country: "KR" }, future);
      await worker.processCustomerOrderEmails();
      assert.equal(calls.length, 0);
      for (const id of ["DEFAULT", "OLD", "WAIT", "CANCELLED"])
        assert.equal(await state(id), undefined);
      for (const id of ["UNVERIFIED", "PLACEHOLDER", "DOMESTIC"])
        assert.equal((await state(id)).state, "suppressed");
    },
  );
  await check(
    "paid order has one frozen confirmation and only provider-accepted state",
    async () => {
      await insert("PAID", {}, future);
      await worker.processCustomerOrderEmails();
      await worker.processCustomerOrderEmails();
      assert.equal(calls.length, 1);
      assert.equal((await state("PAID")).state, "accepted");
      assert.match(calls[0].body.text, /average of 15–21 days/);
      assert.match(calls[0].body.text, /No account is needed/);
      assert.ok(!calls[0].body.html.includes("customer@example.invalid"));
      assert.ok(!calls[0].body.html.includes("pixel"));
    },
  );
  await check("bank transfer sends only after authoritative admin-paid transition", async () => {
    await sql.query("update store_orders set status='paid' where id='WAIT'");
    await worker.processCustomerOrderEmails();
    assert.equal((await state("WAIT")).state, "accepted");
    assert.equal(calls.length, 2);
  });
  await check("concurrent workers do not both send the same pending order", async () => {
    await insert("CONCURRENT", {}, future);
    const before = calls.length;
    await Promise.all([worker.processCustomerOrderEmails(), worker.processCustomerOrderEmails()]);
    assert.equal(calls.length, before + 1);
    assert.equal((await state("CONCURRENT")).state, "accepted");
  });
  await check("timeout retries preserve payload/key even if order locale changes", async () => {
    await insert("TIMEOUT", {}, future);
    mode = "timeout";
    await worker.processCustomerOrderEmails();
    assert.equal((await state("TIMEOUT")).state, "pending");
    const first = calls.at(-1);
    await sql.query(
      "update store_orders set data=jsonb_set(data,'{checkoutLocale}','\"ja\"'::jsonb) where id='TIMEOUT'",
    );
    await sql.query(
      "update customer_order_email_outbox set next_attempt_at=now() where order_id='TIMEOUT'",
    );
    mode = "ok";
    await worker.processCustomerOrderEmails();
    assert.deepEqual(calls.at(-1), first);
    assert.equal((await state("TIMEOUT")).state, "accepted");
  });
  await check("cancellation during retry prevents send", async () => {
    await insert("CANCEL-RETRY", {}, future);
    mode = "timeout";
    await worker.processCustomerOrderEmails();
    const before = calls.length;
    await sql.query("update store_orders set status='cancel' where id='CANCEL-RETRY'");
    await sql.query(
      "update customer_order_email_outbox set next_attempt_at=now() where order_id='CANCEL-RETRY'",
    );
    mode = "ok";
    await worker.processCustomerOrderEmails();
    assert.equal(calls.length, before);
    assert.equal((await state("CANCEL-RETRY")).state, "suppressed");
  });
  await check(
    "rate limit is deferred; permanent provider rejection stops automatic retry",
    async () => {
      await insert("RATE", {}, future);
      mode = "rate";
      await worker.processCustomerOrderEmails();
      assert.equal((await state("RATE")).state, "pending");
      assert.ok(new Date((await state("RATE")).next_attempt_at).getTime() > Date.now() + 110000);
      await sql.query(
        "update customer_order_email_outbox set next_attempt_at=now() where order_id='RATE'",
      );
      mode = "reject";
      await worker.processCustomerOrderEmails();
      assert.equal((await state("RATE")).state, "failed");
    },
  );
  await check(
    "ambiguous send stops before provider idempotency expiry and after eight attempts",
    async () => {
      await insert("EXPIRED", {}, future);
      mode = "timeout";
      await worker.processCustomerOrderEmails();
      await sql.query(
        "update customer_order_email_outbox set next_attempt_at=now(),first_attempt_at=now()-interval '23 hours' where order_id='EXPIRED'",
      );
      const before = calls.length;
      await worker.processCustomerOrderEmails();
      assert.equal(calls.length, before);
      assert.equal((await state("EXPIRED")).state, "failed");
      assert.equal((await state("EXPIRED")).last_error, "EMAIL_REVIEW_REQUIRED");
      await insert("MAX", {}, future);
      await worker.processCustomerOrderEmails();
      await sql.query(
        "update customer_order_email_outbox set next_attempt_at=now(),attempts=7 where order_id='MAX'",
      );
      await worker.processCustomerOrderEmails();
      assert.equal((await state("MAX")).state, "failed");
    },
  );
  await check(
    "15 locales keep guest lookup and contact content; HTML is escaped and gear has no shoe lead time",
    async () => {
      const config = content.orderEmailConfig(process.env);
      const subjects = new Set();
      for (const locale of [
        "ko",
        "en",
        "es",
        "th",
        "fr",
        "de",
        "ja",
        "zh",
        "ru",
        "it",
        "pt",
        "tr",
        "uz",
        "hi",
        "tl",
      ]) {
        const payload = content.orderEmailPayload(
          { ...base, checkoutLocale: locale, id: "TEST-<script>" },
          config,
        );
        subjects.add(payload.subject);
        assert.ok(payload.html.includes(`lang="${locale}"`));
        assert.ok(payload.text.includes(`/orders?lang=${locale}`));
        assert.ok(payload.text.includes("https://ig.me/m/jidokaan"));
        assert.ok(!payload.html.includes("<script>"));
      }
      assert.equal(subjects.size, 15);
      const gear = content.orderEmailPayload(
        { ...base, country: "HK", items: [{ productId: "viper-band-ns" }] },
        config,
      );
      assert.ok(!gear.text.includes("average of 15–21 days"));
    },
  );
  console.log(`${count} customer order email checks passed; no external messages sent.`);
} finally {
  await server.close();
  if (globalThis.__pgliteInstanceV2__) await (await globalThis.__pgliteInstanceV2__).close();
  process.chdir(cwd);
  await rm(temp, { recursive: true, force: true });
}

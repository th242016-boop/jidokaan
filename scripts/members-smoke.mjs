// Disposable PGlite database only. No live users, notifications or network calls.
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const temp = await mkdtemp(resolve(tmpdir(), "jidokaan-members-test-"));
const previous = process.cwd();
process.env.DATABASE_URL = "";
process.env.JIDOKAAN_LOCAL_ONLY = "1";
process.env.LIVE_ORIGIN = "http://127.0.0.1:9";
for (const key of ["TELEGRAM_BOT_TOKEN", "RESEND_API_KEY", "INQUIRY_EMAIL_FROM"])
  delete process.env[key];
process.chdir(temp);
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  throw new Error("Outbound request blocked in member smoke test");
};
const server = await createServer({
  configFile: false,
  root,
  resolve: { alias: { "@": resolve(root, "src") } },
  server: { middlewareMode: true },
  appType: "custom",
});
let db;
let count = 0;
let failed = false;
const check = async (name, fn) => {
  await fn();
  count++;
  console.log(`PASS ${name}`);
};
try {
  db = await server.ssrLoadModule("/src/lib/db.ts");
  const auth = await server.ssrLoadModule("/src/lib/admin-auth.server.ts");
  const members = await server.ssrLoadModule("/src/lib/members.server.ts");
  const attribution = await server.ssrLoadModule("/src/lib/member-attribution.server.ts");
  const handlers = (await server.ssrLoadModule("/src/routes/api/members.ts")).Route.options.server
    .handlers;
  const sql = await db.getSql();
  const token = await auth.createSession();
  const now = new Date().toISOString();
  const addUser = async (id, name, email, provider, created = now) => {
    await sql.query(
      `insert into "user" (id,name,email,"emailVerified","createdAt","updatedAt") values($1,$2,$3,true,$4,$4)`,
      [id, name, email, created],
    );
    if (provider)
      await sql.query(
        `insert into "account" (id,"accountId","providerId","userId","updatedAt") values($1,$1,$2,$3,now())`,
        [`account-${id}`, provider, id],
      );
  };
  for (let i = 0; i < 61; i++) {
    const id = `fixture-${String(i).padStart(3, "0")}`;
    await addUser(id, `회원 ${i}`, `customer${i}@example.invalid`, i % 2 ? "google" : "credential");
  }
  await addUser("synthetic", "카카오회원", "kakao-123@login.jidokaan.com", "kakao");
  await addUser("legacy", "기존회원", "legacy@example.invalid", "naver", "2025-01-01T00:00:00Z");
  await addUser("literal", "100%_회원", "literal@example.invalid", "credential");
  await sql.query("insert into member_profiles(user_id,phone) values($1,$2)", [
    "fixture-001",
    "01012345678",
  ]);
  const total = 64;
  const get = (search = "", withAuth = true) =>
    handlers.GET({
      request: new Request(`https://jidokaan.com/api/members${search}`, {
        headers: withAuth ? { Authorization: `Bearer ${token}` } : {},
      }),
    });

  await check("pagination has bounded pages, stable ordering and no duplicated rows", async () => {
    const one = await members.listMembers(token);
    const two = await members.listMembers(token, { page: 2 });
    assert.equal(one.total, total);
    assert.equal(one.members.length, 20);
    assert.equal(one.totalPages, 4);
    assert.equal(two.members.length, 20);
    assert.equal(new Set([...one.members, ...two.members].map((x) => x.id)).size, 40);
    const last = await members.listMembers(token, { page: 999 });
    assert.equal(last.page, 4);
    assert.equal(last.members.length, 4);
    assert.ok(last.members.every((x) => x.id));
  });
  await check(
    "name, real email, phone and provider filters are scoped in the database",
    async () => {
      assert.equal(
        (await members.listMembers(token, { q: "카카오회원", searchField: "name" })).total,
        1,
      );
      assert.equal(
        (await members.listMembers(token, { q: "customer1@", searchField: "email" })).total,
        1,
      );
      assert.equal(
        (await members.listMembers(token, { q: "12345678", searchField: "phone" })).total,
        1,
      );
      assert.equal(
        (await members.listMembers(token, { q: "010-1234-5678", searchField: "phone" })).total,
        1,
      );
      assert.equal((await members.listMembers(token, { q: "123", searchField: "name" })).total, 0);
      assert.equal((await members.listMembers(token, { provider: "google" })).total, 30);
      assert.equal((await members.listMembers(token, { provider: "email" })).total, 32);
      assert.equal((await members.listMembers(token, { q: "100%_" })).total, 1);
      assert.equal((await members.listMembers(token, { q: "' OR 1=1 --" })).total, 0);
    },
  );
  await check(
    "synthetic social email is hidden while original identity remains intact",
    async () => {
      const row = (await members.listMembers(token, { provider: "kakao" })).members[0];
      assert.equal(row.email, "");
      assert.equal(row.emailUnavailable, true);
      assert.equal(row.verified, false);
      assert.deepEqual(row.providerIds, ["kakao"]);
      assert.deepEqual(row.providers, ["카카오"]);
      assert.equal(
        (await sql.query('select email from "user" where id=$1', ["synthetic"]))[0].email,
        "kakao-123@login.jidokaan.com",
      );
      assert.equal(
        (await members.listMembers(token, { q: "kakao-123", searchField: "email" })).total,
        0,
      );
    },
  );
  await check(
    "new signup attribution stores only allowed fields and cannot overwrite first capture",
    async () => {
      assert.equal(
        await attribution.recordSignupAttribution("fixture-001", {
          device: "mobile",
          source: "naver",
          medium: "organic",
          keyword: "복싱화",
          campaign: "",
          landing: "/shop?token=SECRET#private",
          referrerHost: "https://search.naver.com/search?query=PRIVATE",
        }),
        true,
      );
      assert.equal(
        await attribution.recordSignupAttribution("fixture-001", { source: "changed" }),
        false,
      );
      const row = (await members.listMembers(token, { source: "naver", device: "mobile" }))
        .members[0];
      assert.equal(row.id, "fixture-001");
      assert.equal(row.attribution.source, "naver");
      assert.equal(row.attribution.landing, "/shop");
      assert.equal(row.attribution.referrerHost, "search.naver.com");
      assert.equal(row.attribution.keyword, "복싱화");
      assert.deepEqual((await members.listMembers(token)).filterOptions.sources, ["naver"]);
    },
  );
  await check(
    "legacy signups remain unknown and are not assigned a later login's source",
    async () => {
      assert.equal(
        await attribution.recordSignupAttribution("legacy", {
          source: "instagram",
          device: "mobile",
        }),
        false,
      );
      const row = (await members.listMembers(token, { q: "기존회원" })).members[0];
      assert.equal(row.attribution, null);
      assert.equal(
        (await members.listMembers(token, { device: "unknown", source: "__unknown__" })).total,
        total - 1,
      );
      const safe = attribution.normalizeSignupAttribution({
        device: "bot",
        landing: "/api/auth/callback?code=secret",
        referrerHost: "javascript:alert(1)",
      });
      assert.equal(safe.device, "unknown");
      assert.equal(safe.landing, "");
      assert.equal(safe.referrerHost, "");
    },
  );
  await check("date bounds use inclusive Korean calendar dates", async () => {
    await addUser("kst-before", "전날", "before@example.invalid", "google", "2026-11-08T14:59:59Z");
    await addUser(
      "kst-start",
      "당일시작",
      "start@example.invalid",
      "google",
      "2026-11-08T15:00:00Z",
    );
    await addUser("kst-end", "당일끝", "end@example.invalid", "google", "2026-11-09T14:59:59Z");
    await addUser("kst-after", "다음날", "after@example.invalid", "google", "2026-11-09T15:00:00Z");
    const rows = (
      await members.listMembers(token, { from: "2026-11-09", to: "2026-11-09", q: "당일" })
    ).members;
    assert.deepEqual(rows.map((x) => x.id).sort(), ["kst-end", "kst-start"]);
  });
  await check(
    "API rejects unauthenticated requests and invalid filters with explicit errors",
    async () => {
      assert.equal((await get("", false)).status, 401);
      for (const query of [
        "?page=0",
        "?pageSize=5000",
        "?from=2026-02-30",
        "?from=2026-11-09&to=2026-11-01",
        "?provider=bad",
        "?searchField=id",
      ]) {
        const response = await get(query);
        assert.equal(response.status, 400, query);
        assert.equal((await response.json()).error, "INVALID_FILTER");
      }
      const response = await get("?pageSize=50&provider=naver");
      assert.equal(response.status, 200);
      assert.equal((await response.json()).total, 1);
      assert.match(response.headers.get("cache-control"), /no-store/);
    },
  );
  await check("database failures cannot masquerade as an empty member list", async () => {
    await sql.query("drop table member_signup_attribution");
    const response = await get();
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: "MEMBERS_UNAVAILABLE" });
  });
  console.log(`${count} checks passed. No real users or external messages touched.`);
} catch (err) {
  console.error(err.message);
  failed = true;
} finally {
  await server.close();
  if (db) await (await db.getPglite()).close();
  globalThis.fetch = originalFetch;
  process.chdir(previous);
  await rm(temp, { recursive: true, force: true });
}

if (failed) process.exitCode = 1;

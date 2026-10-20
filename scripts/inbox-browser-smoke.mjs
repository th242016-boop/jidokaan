// Run against an isolated build + disposable DB; block all browser external traffic.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import { chromium } from "playwright";
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const temp = await mkdtemp(resolve(tmpdir(), "jidokaan-inbox-browser-"));
const output = resolve(root, "screenshots/inbox");
await mkdir(output, { recursive: true });
const child = spawn(process.execPath, [resolve(root, ".output/server/index.mjs")], {
  cwd: temp,
  env: {
    ...process.env,
    DATABASE_URL: "",
    TELEGRAM_BOT_TOKEN: "",
    RESEND_API_KEY: "",
    INQUIRY_EMAIL_FROM: "",
    INQUIRY_EMAIL_REPLY_TO: "",
    LIVE_ORIGIN: "http://127.0.0.1:9",
    PORT: "8091",
    HOST: "127.0.0.1",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let logs = "";
child.stdout.on("data", (x) => {
  logs = (logs + x).slice(-5000);
});
child.stderr.on("data", (x) => {
  logs = (logs + x).slice(-5000);
});
let browser, proxy;
const api = (path, body, token) =>
  new Promise((resolve, reject) => {
    const request = http.request(
      {
        hostname: "127.0.0.1",
        port: 8091,
        path,
        method: body ? "POST" : "GET",
        headers: {
          Host: "jidokaan.com",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (response) => {
        let text = "";
        response.on("data", (chunk) => (text += chunk));
        response.on("end", () => {
          try {
            const data = JSON.parse(text);
            if (response.statusCode >= 400) reject(new Error(JSON.stringify(data)));
            else resolve(data);
          } catch (error) {
            reject(error);
          }
        });
      },
    );
    request.on("error", reject);
    request.end(body ? JSON.stringify(body) : undefined);
  });
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      await api("/api/catalog");
      ready = true;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  assert.ok(ready, `Local server did not start: ${logs}`);
  const login = await api("/api/catalog", {
    action: "unlock",
    pin: "ONLY-LOCAL-TEST-99123",
    nextPin: "ONLY-LOCAL-TEST-99123",
  });
  assert.ok(login.token);
  // Preserve actual local routing while disabling the existing production proxy by Host.
  proxy = http.createServer((req, res) => {
    const upstream = http.request(
      {
        hostname: "127.0.0.1",
        port: 8091,
        path: req.url,
        method: req.method,
        headers: { ...req.headers, host: "jidokaan.com" },
      },
      (remote) => {
        res.writeHead(remote.statusCode, remote.headers);
        remote.pipe(res);
      },
    );
    upstream.on("error", () => {
      res.statusCode = 502;
      res.end("Local test proxy failed");
    });
    req.pipe(upstream);
  });
  await new Promise((r) => proxy.listen(8092, "127.0.0.1", r));
  browser = await chromium.launch({
    executablePath: process.env.INBOX_TEST_CHROMIUM || undefined,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.route("**/*", (route) =>
    route.request().url().startsWith("http://127.0.0.1:8092/") ? route.continue() : route.abort(),
  );
  await context.addInitScript(() =>
    localStorage.setItem(
      "jidokaan-store-v32",
      JSON.stringify({ state: { locale: "en", currency: "USD", localePicked: true }, version: 0 }),
    ),
  );
  const customer = await context.newPage();
  const pageErrors = [];
  customer.on("pageerror", (e) => pageErrors.push(e.message));
  await customer.goto("http://127.0.0.1:8092/contact");
  await customer.locator("#name").fill("LOCAL UI TEST");
  await customer.locator("#email").fill("ui@example.invalid");
  await customer
    .locator("#message")
    .fill("Can I get sizing advice? <script>window.bad = true</script>");
  await customer.getByRole("button", { name: "Send inquiry", exact: true }).click();
  await customer.getByText("Your inquiry has been received.").waitFor();
  const hash = new URL(customer.url()).hash,
    id = new URLSearchParams(hash.slice(1)).get("thread");
  assert.ok(id);
  assert.equal(await customer.evaluate(() => window.bad), undefined);
  assert.ok(
    await customer.evaluate(() => document.querySelector("main").scrollWidth <= innerWidth + 1),
  );
  await customer.screenshot({ path: resolve(output, "customer-mobile.png"), fullPage: true });
  console.log(
    "PASS mobile customer submission and private thread; content fits and scripts are escaped",
  );
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await adminContext.route("**/*", (route) =>
    route.request().url().startsWith("http://127.0.0.1:8092/") ? route.continue() : route.abort(),
  );
  await adminContext.addInitScript(
    (token) => sessionStorage.setItem("jidokaan-admin-token", token),
    login.token,
  );
  const admin = await adminContext.newPage();
  admin.on("pageerror", (e) => pageErrors.push(e.message));
  await admin.goto(`http://127.0.0.1:8092/admin?p=inbox&inquiry=${id}`);
  await admin.locator("#admin-reply").waitFor();
  assert.equal(await admin.getByRole("checkbox", { name: /이메일로도/ }).isDisabled(), true);
  await admin.locator("#admin-reply").fill("Yes. Please tell us your usual size.");
  await admin.getByRole("button", { name: "사이트 답변 등록", exact: true }).click();
  await admin.getByText("사이트 답변을 등록했습니다. 이메일은 발송하지 않았습니다.").waitFor();
  await admin.screenshot({ path: resolve(output, "admin-desktop.png"), fullPage: true });
  console.log("PASS authenticated admin deep link, saved answer, honest unconfigured email state");
  await customer.getByRole("button", { name: "Refresh", exact: true }).click();
  await customer.getByText("Yes. Please tell us your usual size.", { exact: true }).waitFor();
  await customer.locator("#followup").fill("My usual size is 260.");
  await customer.getByRole("button", { name: "Send message", exact: true }).click();
  await customer.getByText("My usual size is 260.", { exact: true }).waitFor();
  await admin.getByRole("button", { name: "새로고침", exact: true }).click();
  await admin.getByText("My usual size is 260.", { exact: true }).waitFor();
  await admin.setViewportSize({ width: 390, height: 844 });
  assert.ok(await admin.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await admin.locator("#admin-reply").scrollIntoViewIfNeeded();
  await admin.screenshot({ path: resolve(output, "admin-mobile.png") });
  console.log(
    "PASS customer sees answer and sends follow-up; admin receives follow-up; mobile controls fit",
  );
  await customer.goto("http://127.0.0.1:8092/contact");
  await customer.getByText("Inquiries saved on this device").waitFor();
  await customer.getByRole("link", { name: id, exact: true }).click();
  await customer.getByText("My usual size is 260.", { exact: true }).waitFor();
  assert.equal(pageErrors.length, 0, pageErrors.join("\n"));
  console.log("PASS revisit saved private link; no browser runtime errors");
  console.log("4 UI flows passed with local-only data. Screenshots: screenshots/inbox");
} finally {
  if (browser) await browser.close();
  if (proxy) await new Promise((r) => proxy.close(r));
  child.kill("SIGTERM");
  await new Promise((r) => {
    child.once("exit", r);
    setTimeout(r, 1500).unref();
  });
  await rm(temp, { recursive: true, force: true });
}

// UI access boundaries against a local production build. Auth/material
// responses are fixtures; this does not claim production administrator access.
import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import ts from "typescript";
const base = process.env.PATTERN_TEST_URL || "http://127.0.0.1:8098";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname));
const fixture = JSON.parse(await readFile(process.env.PATTERN_TEST_ASSETS_JSON, "utf8"));
const code = ts.transpileModule(await readFile(new URL("../src/lib/simulator-catalog.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const policy = { exports: {} }; new Function("exports", "module", code)(policy.exports, policy);
const published = new Set(policy.exports.PUBLIC_SPECIAL_PATTERNS);
const codecCode = ts.transpileModule(await readFile(new URL("../src/lib/pattern-asset-wire.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const codec = { exports: {} }; new Function("exports", "module", codecCode)(codec.exports, codec);
for (const name of ["RED", "ORANGE", "YELLOW", "GREEN", "BLUE", "NAVY", "PURPLE"]) fixture.patterns[name + " LIZARD"] ??= fixture.patterns["BLACK SNAKE"];
// These stand-ins test permission/selection state only, not camouflage quality.
for (const name of ["GRAY CAMO", "WOODLAND CAMO"]) fixture.patterns[name] ??= fixture.patterns["FLOWER B"];
const output = process.env.PATTERN_TEST_OUTPUT || "/tmp/jidokaan-admin-simulator-qa";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || "/tmp/jidokaan-white-gray-qa/chromium", args: ["--no-sandbox", "--disable-gpu"] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  page.setDefaultTimeout(45000);
  let compactRequests = 0;
  const requests = [];
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  await page.route("**/*", route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  await page.route(base + "/api/simulator-special", async route => {
    const body = route.request().postDataJSON(); requests.push(body);
    const allowed = body.token === "public-catalog-local-test";
    const audience = body.audience === "public" ? "public" : "admin";
    const patterns = Object.fromEntries(Object.entries(fixture.patterns).filter(([name]) => audience === "admin" || published.has(name)));
    if (body.action === "assets") { assert.equal(body.compact, true, "new UI requests compact assets"); compactRequests++; }
    await route.fulfill({ status: allowed ? 200 : 401, contentType: "application/json", body: JSON.stringify(!allowed ? { error: "AUTH" } : body.action === "ping" ? { ok: true, audience } : {
      audience, ...codec.exports.compactPatternAssets(patterns),
      ...(audience === "admin" ? { swatch: fixture.patterns["FLOWER B"].swatch, layers: { b: base + "/simulator/photo/tints/b-red.png" } } : { layers: {} }),
    }) });
  });
  const special = page.getByRole("button", { name: "스페셜", exact: true });
  const preview = page.getByRole("button", { name: "Enlarge preview", exact: true });
  const option = (part, name) => page.locator(`[data-part="${part}"]`).getByTitle(name, { exact: true });
  const modelButton = index => page.getByRole("group", { name: "모델 선택", exact: true }).getByRole("button").nth(index);
  const ready = async () => {
    await page.waitForFunction(() => [...document.querySelectorAll("button")].some(b => b.textContent.trim() === "스페셜 시안 저장" && !b.disabled));
    await preview.locator("img").evaluateAll(images => Promise.all(images.map(im => im.decode())));
  };
  const absentSpecial = async () => {
    assert.equal(await special.count(), 0);
    for (const name of ["FLOWER A", "FLOWER B", "BLACK LIZARD", "MATTE BLACK", "GRAY CAMO", "WOODLAND CAMO"])
      assert.equal(await page.getByTitle(name, { exact: true }).count(), 0);
    assert.equal(await page.getByRole("button", { name: "스페셜 시안 저장", exact: true }).count(), 0);
  };
  const ordinaryDraft = () => page.evaluate(() => JSON.parse(localStorage.getItem("jidokaan-store-v32")).state.draftPartNames);
  await page.goto(base + "/customize");
  await option("b", "RED").click(); await absentSpecial();
  assert.equal(await option("b", "RED").getAttribute("aria-pressed"), "true");
  await modelButton(1).click(); await absentSpecial();
  assert.equal(await page.locator('[data-part="g"]').count(), 0);
  await option("e", "BLUE").click();
  assert.equal(await option("e", "BLUE").getAttribute("aria-pressed"), "true");
  await page.getByRole("button", { name: "초기화", exact: true }).click();
  assert.equal(await option("e", "WHITE").getAttribute("aria-pressed"), "true");
  await modelButton(0).click();
  assert.equal(await option("b", "RED").getAttribute("aria-pressed"), "true", "High ordinary draft survives mid reset");
  await page.reload(); await option("b", "RED").waitFor(); await absentSpecial();
  assert.equal(await option("b", "RED").getAttribute("aria-pressed"), "true", "Ordinary selection persists across reload");
  const normal = await ordinaryDraft();
  assert.equal(requests.length, 0, "Anonymous UI does not request any special catalog");
  await page.screenshot({ path: output + "/customer-ordinary.png", fullPage: true });
  console.log("PASS anonymous high/mid, colors, reset and persisted drafts; special controls and catalog requests absent");

  await page.evaluate(() => { sessionStorage.setItem("jidokaan-admin-token", "public-catalog-local-test"); });
  await page.reload(); await special.waitFor();
  await special.click(); await ready();
  await page.getByText("관리자 · 스페셜 시안", { exact: true }).waitFor();
  for (const name of [...published, "GRAY CAMO", "WOODLAND CAMO", "FLOWER A"]) {
    const label = name === "BLACK SNAKE" ? "BLACK LIZARD" : name === "WHITE SNAKE" ? "WHITE LIZARD" : name;
    assert.equal(await option("b", label).count(), 1, `${name} remains available to the administrator`);
  }
  await option("b", "NAVY LIZARD").click(); await ready();
  await option("c", "SILVER WEAVE").click(); await ready();
  const downloading = page.waitForEvent("download"); await page.getByRole("button", { name: "스페셜 시안 저장", exact: true }).click();
  await (await downloading).saveAs(output + "/admin-high.jpg");
  await modelButton(1).click(); await ready();
  await option("e", "RED LIZARD").click(); await ready();
  assert.equal(await page.locator('[data-part="g"]').count(), 0);
  await page.getByRole("button", { name: "초기화", exact: true }).click(); await ready();
  assert.equal(await option("e", "WHITE").getAttribute("aria-pressed"), "true");
  await modelButton(0).click(); await ready();
  await option("b", "GRAY CAMO").click(); await ready();
  assert.deepEqual(await ordinaryDraft(), normal, "Special selections do not overwrite normal selections");
  console.log("PASS authenticated administrator retains full catalog, high/mid selections, JPEG save and reset");

  await page.evaluate(() => { sessionStorage.removeItem("jidokaan-admin-token"); window.dispatchEvent(new Event("jidokaan-admin-session-ended")); });
  await special.waitFor({ state: "detached" }); await absentSpecial();
  assert.equal(await option("b", "RED").getAttribute("aria-pressed"), "true", "Logout discards private draft and restores ordinary draft");
  assert.deepEqual(await ordinaryDraft(), normal);
  await page.reload(); await option("b", "RED").waitFor(); await absentSpecial();
  console.log("PASS logout immediately removes all special controls/assets while preserving the ordinary draft");

  await page.evaluate(() => { sessionStorage.setItem("jidokaan-admin-token", "forged"); });
  await Promise.all([page.waitForResponse(response => response.url().endsWith("/api/simulator-special") && response.status() === 401), page.reload()]);
  await option("b", "RED").waitFor(); await absentSpecial();
  assert.equal(requests.some(request => request.audience === "public"), false, "No anonymous/public fallback is requested");
  assert.ok(compactRequests >= 3);
  assert.deepEqual(errors, []);
  console.log("PASS forged token fails closed without public fallback; no browser errors");
} finally { await browser.close(); }

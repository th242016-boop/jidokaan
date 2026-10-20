// Local UI integration test. API authorization is covered separately by
// simulator-special-smoke.mjs; this fixture only supplies material images.
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.PATTERN_TEST_URL || "http://127.0.0.1:8091";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname), "Local test only");
assert.ok(process.env.PATTERN_TEST_ASSETS_JSON, "Set PATTERN_TEST_ASSETS_JSON to local authenticated-assets fixture");
const assets = JSON.parse(await readFile(process.env.PATTERN_TEST_ASSETS_JSON, "utf8"));
const names = ["FLOWER B", "FLOWER C", "BLACK SNAKE"];
for (const name of names) {
  assert.match(assets.patterns?.[name]?.texture ?? "", /^data:image\//, `${name}: actual texture fixture required`);
  assert.match(assets.patterns?.[name]?.swatch ?? "", /^data:image\//, `${name}: swatch fixture required`);
}
const fallback = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=";
const output = process.env.PATTERN_TEST_OUTPUT || "/tmp/jidokaan-pattern-qa";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true,
  ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}),
  args: ["--no-sandbox", "--disable-gpu"],
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  page.setDefaultTimeout(30000);
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  await page.route(`${base}/api/simulator-special`, async route => {
    const body = route.request().postDataJSON();
    const allowed = body?.token === "local-pattern-test";
    await route.fulfill({ status: allowed ? 200 : 401, contentType: "application/json",
      body: JSON.stringify(!allowed ? { error: "AUTH" } : body?.action === "assets"
        ? { swatch: assets.swatch ?? fallback, layers: assets.layers ?? { b: fallback }, patterns: assets.patterns }
        : { ok: true }) });
  });
  const group = part => page.locator(`[data-part="${part}"]`);
  const option = (part, name) => group(part).getByTitle(name, { exact: true });
  const save = page.getByRole("button", { name: "스페셜 시안 저장", exact: true });
  const ready = async () => {
    await save.waitFor();
    await page.waitForFunction(() => [...document.querySelectorAll("button")].some(b => b.textContent.trim() === "스페셜 시안 저장" && !b.disabled));
    await page.evaluate(async () => { await Promise.all([...document.querySelectorAll('[aria-label="Enlarge preview"] img')].map(im => im.decode())); });
  };
  const select = async (part, name) => { await option(part, name).click(); await ready(); assert.equal(await option(part, name).getAttribute("aria-pressed"), "true"); };
  const preview = page.getByRole("button", { name: "Enlarge preview", exact: true });
  await page.goto(`${base}/customize`);
  for (const name of names) assert.equal(await page.getByTitle(name, { exact: true }).count(), 0);
  assert.equal(await page.getByRole("button", { name: "스페셜", exact: true }).count(), 0);
  await option("b", "BLUE").click();
  await page.evaluate(() => sessionStorage.setItem("jidokaan-admin-token", "local-pattern-test"));
  await page.reload();
  await page.getByRole("button", { name: "스페셜", exact: true }).click();
  await ready();

  for (const model of ["high", "mid"]) {
    if (model === "mid") { await page.getByRole("button", { name: "중목", exact: true }).click(); await ready(); }
    const parts = (model === "high" ? "bcdefghij" : "bcdefhij").split("");
    assert.equal(await group("g").count(), model === "high" ? 1 : 0);
    for (const name of names) {
      assert.equal(await page.getByTitle(name, { exact: true }).count(), parts.length);
      for (const part of ["a", "k", "laces"]) assert.equal(await option(part, name).count(), 0);
    }
    for (const part of parts) await select(part, "WHITE");

    for (const name of names) {
      // Test one isolated part before each full-material composition so the
      // second data-URL layer is unambiguously the material (first is mesh).
      await select("e", name);
      const data = await preview.locator('img[src^="data:"]').nth(1).getAttribute("src");
      const source = model === "mid" ? "/simulator/mid/e/red.png" : "/simulator/photo/tints/e-red.png";
      const pixels = await page.evaluate(async ({ data, source }) => {
        const decode = async src => { const im = new Image(); im.src = src; await im.decode(); const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight; const ctx = c.getContext("2d"); ctx.drawImage(im, 0, 0); return { width: c.width, height: c.height, pixels: ctx.getImageData(0, 0, c.width, c.height).data }; };
        const [pattern, original] = await Promise.all([decode(data), decode(source)]);
        let alphaDifferences = 0, outside = 0, changed = 0;
        for (let i = 0; i < pattern.pixels.length; i += 4) {
          if (pattern.pixels[i + 3] !== original.pixels[i + 3]) alphaDifferences++;
          if (!original.pixels[i + 3] && pattern.pixels[i + 3]) outside++;
          if (original.pixels[i + 3] > 250 && Math.abs(pattern.pixels[i] - original.pixels[i]) > 5) changed++;
        }
        return { width: pattern.width, height: pattern.height, alphaDifferences, outside, changed };
      }, { data, source });
      assert.equal(pixels.width, 1424); assert.equal(pixels.height, 1392);
      assert.equal(pixels.alphaDifferences, 0, `${model} ${name}: native E alpha`);
      assert.equal(pixels.outside, 0, `${model} ${name}: no lace-hole/background spill`);
      assert.ok(pixels.changed > 1000, `${model} ${name}: applied material pixels`);
      await select("e", "WHITE");

      for (const part of parts) await select(part, name);
      const slug = name.toLowerCase().replaceAll(" ", "-");
      await preview.screenshot({ path: `${output}/${model}-${slug}.png` });
      const downloaded = page.waitForEvent("download"); await save.click();
      const file = await downloaded; assert.match(file.suggestedFilename(), /\.jpg$/);
      await file.saveAs(`${output}/${model}-${slug}-export.jpg`);
      if (model === "high" && name === "FLOWER B") await group("b").screenshot({ path: `${output}/material-palette.png` });
      for (const part of parts) await select(part, "WHITE");
    }

    await select("b", "FLOWER B"); await select("b", "FLOWER A");
    assert.equal(await option("b", "FLOWER B").getAttribute("aria-pressed"), "false");
    await select("b", "FLOWER C"); assert.equal(await option("b", "FLOWER A").getAttribute("aria-pressed"), "false");
    await select("b", "GRAY"); assert.equal(await option("b", "FLOWER C").getAttribute("aria-pressed"), "false");
    await select("b", "BLACK SNAKE"); assert.equal(await option("b", "GRAY").getAttribute("aria-pressed"), "false");
    await select("b", "BLUE"); assert.equal(await option("b", "BLACK SNAKE").getAttribute("aria-pressed"), "false");
    await select("b", model === "high" ? "FLOWER B" : "FLOWER C");
    console.log(`PASS ${model}: all three materials, ${parts.length} parts, exact E alpha, switching and JPEG exports`);
  }

  await page.getByRole("button", { name: "장목", exact: true }).click(); await ready();
  assert.equal(await option("b", "FLOWER B").getAttribute("aria-pressed"), "true");
  await page.getByRole("button", { name: "중목", exact: true }).click(); await ready();
  assert.equal(await option("b", "FLOWER C").getAttribute("aria-pressed"), "true");
  await page.setViewportSize({ width: 390, height: 844 });
  await select("b", "BLACK SNAKE");
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await group("b").screenshot({ path: `${output}/mobile-material-palette.png` });
  await page.getByRole("button", { name: "장목", exact: true }).click(); await ready();
  await page.getByRole("button", { name: "스페셜", exact: true }).click();
  for (const name of names) assert.equal(await page.getByTitle(name, { exact: true }).count(), 0);
  assert.equal(await option("b", "BLUE").getAttribute("aria-pressed"), "true", "Ordinary draft survives Special edits");
  assert.equal(await preview.locator('img[src^="data:"]').count(), 0);
  await page.getByRole("button", { name: "스페셜", exact: true }).click(); await ready();
  await page.evaluate(() => { sessionStorage.removeItem("jidokaan-admin-token"); window.dispatchEvent(new Event("focus")); });
  await page.getByRole("button", { name: "스페셜", exact: true }).waitFor({ state: "hidden" });
  for (const name of names) assert.equal(await page.getByTitle(name, { exact: true }).count(), 0);
  assert.deepEqual(errors, []);
  console.log("PASS independent model drafts, mobile layout, ordinary draft restoration and active logout");
} finally { await browser.close(); }

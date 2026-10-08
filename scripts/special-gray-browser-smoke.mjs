// Run against a LOCAL production build only. Protected floral payloads are
// fixtures; real server authorization is covered by simulator-special-smoke.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
const base = process.env.GRAY_TEST_URL || "http://127.0.0.1:8089";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname), "Local test only");
const output = process.env.GRAY_TEST_OUTPUT || "/tmp/jidokaan-gray-qa";
await mkdir(output, { recursive: true });
const fixture = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=";
const browser = await chromium.launch({ headless: true,
  ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}),
  args: ["--no-sandbox", "--disable-gpu"],
});
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  await page.route(`${base}/api/simulator-special`, async route => {
    const body = route.request().postDataJSON();
    await route.fulfill({ status: body?.token === "local-gray-test" ? 200 : 401,
      contentType: "application/json", body: JSON.stringify(body?.action === "assets"
        ? { swatch: fixture, layers: { b: fixture } } : { ok: true }) });
  });
  await page.goto(`${base}/customize`);
  assert.equal(await page.getByTitle("GRAY", { exact: true }).count(), 0);
  assert.equal(await page.getByRole("button", { name: "스페셜", exact: true }).count(), 0);
  await page.evaluate(() => sessionStorage.setItem("jidokaan-admin-token", "local-gray-test"));
  await page.reload();
  await page.getByRole("button", { name: "스페셜", exact: true }).click();
  const preview = page.getByRole("button", { name: "Enlarge preview", exact: true });
  for (const model of ["high", "mid"]) {
    if (model === "mid") await page.getByRole("button", { name: "중목", exact: true }).click();
    const parts = (model === "high" ? "bcdefghij" : "bcdefhij").split("");
    const gray = part => page.locator(`[data-part="${part}"]`).getByTitle("GRAY", { exact: true });
    await gray("b").waitFor();
    await page.waitForFunction(() => !document.querySelector('[data-part="b"] button[title="GRAY"]').disabled);
    assert.equal(await page.getByTitle("GRAY", { exact: true }).count(), parts.length + 1); // Includes mesh.
    assert.equal(await page.locator('[data-part="laces"] button[title="GRAY"]').count(), 0);
    assert.equal(await page.locator('[data-part="k"] button[title="GRAY"]').count(), 0);
    for (const part of parts) {
      await gray(part).click();
      assert.equal(await gray(part).getAttribute("aria-pressed"), "true");
      const data = await preview.locator('img[src^="data:"]').nth(1).getAttribute("src");
      const source = model === "mid" && "efh".includes(part)
        ? `/simulator/mid/${part}/red.png` : `/simulator/photo/tints/${part}-red.png`;
      const checked = await page.evaluate(async ({ data, source }) => {
        const images = await Promise.all([data, source].map(async src => {
          const im = new Image(); im.src = src; await im.decode(); return im;
        }));
        const pixels = images.map(im => {
          const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight;
          const ctx = c.getContext("2d"); ctx.drawImage(im, 0, 0);
          return ctx.getImageData(0, 0, c.width, c.height).data;
        });
        const [gray, red] = pixels;
        let alphaDifferences = 0, colored = 0, darkest = 255, brightest = 0;
        for (let i = 0; i < gray.length; i += 4) {
          if (gray[i + 3] !== red[i + 3]) alphaDifferences++;
          if (gray[i + 3] < 250) continue;
          if (Math.max(gray[i], gray[i + 1], gray[i + 2]) - Math.min(gray[i], gray[i + 1], gray[i + 2]) > 12) colored++;
          darkest = Math.min(darkest, gray[i]); brightest = Math.max(brightest, gray[i]);
        }
        return { width: images[0].naturalWidth, height: images[0].naturalHeight, alphaDifferences, colored, range: brightest - darkest };
      }, { data, source });
      assert.equal(checked.width, 1424); assert.equal(checked.height, 1392);
      assert.equal(checked.alphaDifferences, 0); assert.equal(checked.colored, 0);
      assert.ok(checked.range > 20, `${model} ${part}: preserve highlights and shadows`);
      await page.locator(`[data-part="${part}"]`).getByTitle("WHITE", { exact: true }).click();
    }
    await gray("b").click();
    await page.locator('[data-part="b"]').getByTitle("FLOWER A", { exact: true }).click();
    assert.equal(await gray("b").getAttribute("aria-pressed"), "false");
    await gray("b").click();
    assert.equal(await page.locator('[data-part="b"]').getByTitle("FLOWER A").getAttribute("aria-pressed"), "false");
    for (const part of parts) await gray(part).click();
    await preview.screenshot({ path: `${output}/${model}-gray.png` });
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "스페셜 시안 저장", exact: true }).click();
    const file = await download;
    assert.ok(file.suggestedFilename().endsWith(".jpg"));
    await file.saveAs(`${output}/${model}-gray-export.jpg`);
    console.log(`PASS ${model}: ${parts.length} gray parts, native alpha, shading, floral switching, JPEG export`);
  }
  await page.getByRole("button", { name: "장목", exact: true }).click();
  assert.equal(await page.locator('[data-part="b"]').getByTitle("GRAY").getAttribute("aria-pressed"), "true");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-part="b"]').getByTitle("GRAY").click();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.getByRole("button", { name: "스페셜", exact: true }).click();
  assert.equal(await page.getByTitle("GRAY", { exact: true }).count(), 0);
  assert.equal(await preview.locator('img[src^="data:"]').count(), 0);
  await page.evaluate(() => { sessionStorage.removeItem("jidokaan-admin-token"); window.dispatchEvent(new Event("focus")); });
  await page.getByRole("button", { name: "스페셜", exact: true }).waitFor({ state: "hidden" });
  assert.deepEqual(errors, []);
  console.log("PASS independent model drafts, mobile layout, standard mode restoration and logout");
} finally { await browser.close(); }

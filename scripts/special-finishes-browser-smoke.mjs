// Local production UI test with a mocked authenticated material response.
// Real session validation is tested in simulator-special-smoke.mjs separately.
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.PATTERN_TEST_URL || "http://127.0.0.1:8092";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname), "Local test only");
assert.ok(process.env.PATTERN_TEST_ASSETS_JSON, "Set the actual material fixture path");
const assets = JSON.parse(await readFile(process.env.PATTERN_TEST_ASSETS_JSON, "utf8"));
const colors = ["BLACK", "WHITE", "RED", "YELLOW"];
const finishes = [...colors.map(color => `MATTE ${color}`), ...colors.map(color => `${color} SUEDE`)];
for (const name of finishes) {
  assert.match(assets.patterns?.[name]?.texture ?? "", /^data:image\//, `${name}: texture required`);
  assert.match(assets.patterns?.[name]?.swatch ?? "", /^data:image\//, `${name}: swatch required`);
}
const fallback = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=";
const output = process.env.PATTERN_TEST_OUTPUT || "/tmp/jidokaan-finish-colors/qa";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true,
  ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}),
  args: ["--no-sandbox", "--disable-gpu"],
});
const report = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  page.setDefaultTimeout(30000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route(`${base}/api/simulator-special`, async route => {
    const body = route.request().postDataJSON();
    const allowed = body?.token === "local-finish-test";
    await route.fulfill({ status: allowed ? 200 : 401, contentType: "application/json",
      body: JSON.stringify(!allowed ? { error: "AUTH" } : body?.action === "assets"
        ? { swatch: assets.swatch ?? fallback, layers: assets.layers ?? { b: fallback }, patterns: assets.patterns }
        : { ok: true }) });
  });
  const group = part => page.locator(`[data-part="${part}"]`);
  const option = (part, name) => group(part).getByTitle(name, { exact: true });
  const save = page.getByRole("button", { name: "스페셜 시안 저장", exact: true });
  const preview = page.getByRole("button", { name: "Enlarge preview", exact: true });
  const ready = async () => {
    await save.waitFor();
    await page.waitForFunction(() => [...document.querySelectorAll("button")].some(b => b.textContent.trim() === "스페셜 시안 저장" && !b.disabled));
    await page.evaluate(async () => { await Promise.all([...document.querySelectorAll('[aria-label="Enlarge preview"] img')].map(im => im.decode())); });
  };
  const select = async (part, name) => {
    await option(part, name).click(); await ready();
    assert.equal(await option(part, name).getAttribute("aria-pressed"), "true", `${part}: ${name} selected`);
  };
  const layers = () => preview.locator("img").evaluateAll(images => images.map(im => im.getAttribute("src")));
  const exportImage = async slug => {
    await preview.screenshot({ path: `${output}/${slug}.png` });
    const downloaded = page.waitForEvent("download"); await save.click();
    const file = await downloaded;
    assert.match(file.suggestedFilename(), /\.jpg$/);
    await file.saveAs(`${output}/${slug}-export.jpg`);
  };
  const verifyPixels = async (model, part, name, data) => {
    const pixels = await page.evaluate(async ({ data, part }) => {
      const decode = async src => {
        const im = new Image(); im.src = src; await im.decode();
        const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight;
        const ctx = c.getContext("2d"); ctx.drawImage(im, 0, 0);
        return { width: c.width, height: c.height, pixels: ctx.getImageData(0, 0, c.width, c.height).data };
      };
      const [finish, source] = await Promise.all([decode(data), decode(`/simulator/photo/tints/${part}-red.png`)]);
      let alphaDifferences = 0, outside = 0, count = 0;
      const sum = [0, 0, 0];
      for (let i = 0; i < finish.pixels.length; i += 4) {
        if (finish.pixels[i + 3] !== source.pixels[i + 3]) alphaDifferences++;
        if (!source.pixels[i + 3] && finish.pixels[i + 3]) outside++;
        if (source.pixels[i + 3] > 250) {
          count++;
          for (let c = 0; c < 3; c++) sum[c] += finish.pixels[i + c];
        }
      }
      return { width: finish.width, height: finish.height, alphaDifferences, outside, mean: sum.map(value => value / count) };
    }, { data, part });
    assert.equal(pixels.width, 1424); assert.equal(pixels.height, 1392);
    assert.equal(pixels.alphaDifferences, 0, `${model} ${part} ${name}: exact source alpha`);
    assert.equal(pixels.outside, 0, `${model} ${part} ${name}: no exterior spill`);
    // Color identity must survive material shading, especially bright white/yellow.
    const [r, g, b] = pixels.mean;
    if (name.includes("BLACK")) assert.ok(Math.max(r, g, b) < 95, `${name} must remain black: ${pixels.mean}`);
    if (name.includes("WHITE")) assert.ok(Math.min(r, g, b) > 145 && Math.max(r, g, b) - Math.min(r, g, b) < 35, `${name} must remain light neutral: ${pixels.mean}`);
    if (name.includes("RED")) assert.ok(r > 90 && r > g * 1.7 && r > b * 1.5, `${name} must remain red: ${pixels.mean}`);
    if (name.includes("YELLOW")) assert.ok(r > 130 && g > 100 && Math.min(r, g) > b * 1.6, `${name} must remain yellow: ${pixels.mean}`);
    report.push({ model, part, name, ...pixels });
  };

  await page.goto(`${base}/customize`);
  const ordinaryDesktopWidth = (await option("b", "RED").boundingBox()).width;
  for (const name of finishes) assert.equal(await page.getByTitle(name, { exact: true }).count(), 0);
  assert.equal(await page.getByRole("button", { name: "스페셜", exact: true }).count(), 0);
  await option("b", "BLUE").click(); await option("c", "RED").click();
  await page.evaluate(() => sessionStorage.setItem("jidokaan-admin-token", "local-finish-test"));
  await page.reload();
  await page.getByRole("button", { name: "스페셜", exact: true }).click(); await ready();
  const specialDesktopWidth = (await option("b", "RED").boundingBox()).width;
  assert.ok(specialDesktopWidth / ordinaryDesktopWidth > 0.42 && specialDesktopWidth / ordinaryDesktopWidth < 0.58, "Special desktop squares have half the ordinary width");

  for (const model of ["high", "mid"]) {
    if (model === "mid") { await page.getByRole("button", { name: "중목", exact: true }).click(); await ready(); }
    for (const name of finishes) {
      assert.equal(await page.getByTitle(name, { exact: true }).count(), 2, `${name}: B and C only`);
      for (const part of ["b", "c"]) assert.equal(await option(part, name).count(), 1);
      for (const part of "adefghijkl".split("").concat("laces")) assert.equal(await option(part, name).count(), 0);
    }
    await select("d", "BLUE"); await select("e", "GREEN");
    await select("b", "BLACK"); await select("c", "BLACK");
    const original = await layers();
    const index = Object.fromEntries(["b", "c"].map(part => [part, original.findIndex(src => new RegExp(`${part}-black\\.png`).test(src))]));
    assert.ok(index.b >= 0 && index.c >= 0 && index.b !== index.c);
    const unaffected = all => all.filter((_, i) => i !== index.b && i !== index.c);
    const otherParts = unaffected(original);
    const variants = { b: {}, c: {} };
    await exportImage(`${model}-bc-patent-black`);
    for (const name of finishes) {
      for (const part of ["b", "c"]) {
        const before = await layers();
        await select(part, name);
        const selected = await layers();
        assert.deepEqual(selected.filter((_, i) => i !== index[part]), before.filter((_, i) => i !== index[part]), `${model} ${part} ${name}: no other layer changes`);
        assert.deepEqual(unaffected(selected), otherParts);
        assert.match(selected[index[part]], /^data:image\/png/);
        variants[part][name] = selected[index[part]];
        await verifyPixels(model, part, name, selected[index[part]]);
      }
      await exportImage(`${model}-bc-${name.toLowerCase().replaceAll(" ", "-")}`);
    }
    for (const part of ["b", "c"]) {
      const differences = await page.evaluate(async ({ variants, colors }) => {
        const decoded = {};
        for (const [name, url] of Object.entries(variants)) {
          const im = new Image(); im.src = url; await im.decode();
          const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight;
          const ctx = c.getContext("2d"); ctx.drawImage(im, 0, 0);
          decoded[name] = ctx.getImageData(0, 0, c.width, c.height).data;
        }
        return colors.map(color => {
          const a = decoded[`MATTE ${color}`], b = decoded[`${color} SUEDE`];
          let changed = 0, count = 0, total = 0;
          for (let i = 0; i < a.length; i += 4) if (a[i + 3] > 250) {
            const delta = (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2])) / 3;
            count++; total += delta; if (delta > 1) changed++;
          }
          return { color, changed, meanDifference: total / count };
        });
      }, { variants: variants[part], colors });
      for (const difference of differences) assert.ok(difference.changed > 500 && difference.meanDifference > 0.5, `${model} ${part}: finishes must differ ${JSON.stringify(difference)}`);
      await group(part).screenshot({ path: `${output}/${model}-${part}-palette.png` });
    }
    await select("b", "MATTE YELLOW"); await select("c", "RED SUEDE");
    assert.equal(await option("b", "MATTE YELLOW").getAttribute("aria-pressed"), "true");
    await exportImage(`${model}-mixed-b-matte-yellow-c-red-suede`);
    for (const part of ["b", "c"]) {
      await select(part, "FLOWER B");
      await select(part, "MATTE WHITE"); assert.equal(await option(part, "FLOWER B").getAttribute("aria-pressed"), "false");
      await select(part, "GRAY"); assert.equal(await option(part, "MATTE WHITE").getAttribute("aria-pressed"), "false");
      await select(part, "WHITE SUEDE"); assert.equal(await option(part, "GRAY").getAttribute("aria-pressed"), "false");
      await select(part, "BLACK"); assert.equal(await option(part, "WHITE SUEDE").getAttribute("aria-pressed"), "false");
    }
    await select("b", model === "high" ? "MATTE YELLOW" : "BLACK SUEDE");
    await select("c", model === "high" ? "RED SUEDE" : "MATTE WHITE");
    console.log(`PASS ${model}: all 16 part/material/color combinations, exact alpha, correct color identity, isolated B/C changes, JPEG exports and mixed materials`);
  }
  await page.getByRole("button", { name: "장목", exact: true }).click(); await ready();
  assert.equal(await option("b", "MATTE YELLOW").getAttribute("aria-pressed"), "true");
  assert.equal(await option("c", "RED SUEDE").getAttribute("aria-pressed"), "true");
  await page.getByRole("button", { name: "중목", exact: true }).click(); await ready();
  assert.equal(await option("b", "BLACK SUEDE").getAttribute("aria-pressed"), "true");
  assert.equal(await option("c", "MATTE WHITE").getAttribute("aria-pressed"), "true");
  await page.setViewportSize({ width: 390, height: 844 });
  await select("b", "MATTE BLACK"); await select("c", "YELLOW SUEDE");
  const specialMobileWidth = (await option("b", "RED").boundingBox()).width;
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  for (const part of ["b", "c"]) {
    for (const name of finishes) {
      const layout = await option(part, name).evaluate(button => {
        const label = button.querySelector("span > span") || button.querySelector("span");
        const box = button.getBoundingClientRect(), text = label.getBoundingClientRect();
        return { x: Math.abs((text.left + text.right) / 2 - (box.left + box.right) / 2), y: Math.abs((text.top + text.bottom) / 2 - (box.top + box.bottom) / 2), fits: text.width <= box.width + 1 && text.height <= box.height + 1 };
      });
      assert.ok(layout.x < 2 && layout.y < 2 && layout.fits, `${part} ${name}: centered label fits compact mobile square`);
    }
  }
  for (const part of ["b", "c"]) await group(part).screenshot({ path: `${output}/mobile-${part}-palette.png` });
  await page.getByRole("button", { name: "장목", exact: true }).click(); await ready();
  await page.getByRole("button", { name: "스페셜", exact: true }).click();
  const ordinaryMobileWidth = (await option("b", "RED").boundingBox()).width;
  assert.ok(specialMobileWidth / ordinaryMobileWidth > 0.42 && specialMobileWidth / ordinaryMobileWidth < 0.58, "Special mobile squares have half the ordinary width");
  for (const name of finishes) assert.equal(await page.getByTitle(name, { exact: true }).count(), 0);
  assert.equal(await option("b", "BLUE").getAttribute("aria-pressed"), "true", "Public B design remains unchanged");
  assert.equal(await option("c", "RED").getAttribute("aria-pressed"), "true", "Public C design remains unchanged");
  await page.getByRole("button", { name: "스페셜", exact: true }).click(); await ready();
  await page.evaluate(() => { sessionStorage.removeItem("jidokaan-admin-token"); window.dispatchEvent(new Event("focus")); });
  await page.getByRole("button", { name: "스페셜", exact: true }).waitFor({ state: "hidden" });
  for (const name of finishes) assert.equal(await page.getByTitle(name, { exact: true }).count(), 0);
  assert.deepEqual(errors, []);
  await writeFile(`${output}/pixel-report.json`, JSON.stringify(report, null, 2));
  console.log("PASS B/C independent model drafts, mobile layout, public draft restoration and logout; zero browser errors");
} finally { await browser.close(); }

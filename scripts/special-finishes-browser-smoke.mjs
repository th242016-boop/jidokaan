// Local production UI test with a mocked authenticated material response.
// Real session validation is tested in simulator-special-smoke.mjs separately.
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.PATTERN_TEST_URL || "http://127.0.0.1:8092";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname), "Local test only");
assert.ok(process.env.PATTERN_TEST_ASSETS_JSON, "Set the actual material fixture path");
const assets = JSON.parse(await readFile(process.env.PATTERN_TEST_ASSETS_JSON, "utf8"));
const finishes = ["MATTE BLACK", "BLACK SUEDE"];
for (const name of finishes) {
  assert.match(assets.patterns?.[name]?.texture ?? "", /^data:image\//, `${name}: texture required`);
  assert.match(assets.patterns?.[name]?.swatch ?? "", /^data:image\//, `${name}: swatch required`);
}
const fallback = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=";
const output = process.env.PATTERN_TEST_OUTPUT || "/tmp/jidokaan-black-finishes/qa";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true,
  ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}),
  args: ["--no-sandbox", "--disable-gpu"],
});
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

  await page.goto(`${base}/customize`);
  for (const name of finishes) assert.equal(await page.getByTitle(name, { exact: true }).count(), 0);
  assert.equal(await page.getByRole("button", { name: "스페셜", exact: true }).count(), 0);
  await option("b", "BLUE").click();
  await page.evaluate(() => sessionStorage.setItem("jidokaan-admin-token", "local-finish-test"));
  await page.reload();
  await page.getByRole("button", { name: "스페셜", exact: true }).click(); await ready();

  for (const model of ["high", "mid"]) {
    if (model === "mid") { await page.getByRole("button", { name: "중목", exact: true }).click(); await ready(); }
    for (const name of finishes) {
      assert.equal(await page.getByTitle(name, { exact: true }).count(), 1, `${name}: B only`);
      assert.equal(await option("b", name).count(), 1);
      for (const part of "acdefghijkl".split("").concat("laces")) assert.equal(await option(part, name).count(), 0);
    }
    // Keep non-B parts visibly colored so accidental changes cannot be hidden
    // behind a native white base or an absent source layer.
    await select("c", "RED"); await select("d", "BLUE"); await select("e", "GREEN");
    await select("b", "BLACK");
    const original = await layers();
    assert.match(original[2], /b-black\.png/);
    const otherParts = original.filter((_, index) => index !== 2);
    const variants = { BLACK: original[2] };
    await exportImage(`${model}-b-black`);
    for (const name of finishes) {
      await select("b", name);
      assert.equal(await option("b", "BLACK").getAttribute("aria-pressed"), "false");
      const selected = await layers();
      assert.deepEqual(selected.filter((_, index) => index !== 2), otherParts, `${model} ${name}: only B changes`);
      assert.match(selected[2], /^data:image\/png/);
      variants[name] = selected[2];
      const pixels = await page.evaluate(async ({ data }) => {
        const decode = async src => {
          const im = new Image(); im.src = src; await im.decode();
          const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight;
          const ctx = c.getContext("2d"); ctx.drawImage(im, 0, 0);
          return { width: c.width, height: c.height, pixels: ctx.getImageData(0, 0, c.width, c.height).data };
        };
        const [finish, source] = await Promise.all([decode(data), decode("/simulator/photo/tints/b-red.png")]);
        let alphaDifferences = 0, outside = 0, changed = 0;
        for (let i = 0; i < finish.pixels.length; i += 4) {
          if (finish.pixels[i + 3] !== source.pixels[i + 3]) alphaDifferences++;
          if (!source.pixels[i + 3] && finish.pixels[i + 3]) outside++;
          if (source.pixels[i + 3] > 250 && Math.abs(finish.pixels[i] - source.pixels[i]) > 5) changed++;
        }
        return { width: finish.width, height: finish.height, alphaDifferences, outside, changed };
      }, { data: selected[2] });
      assert.equal(pixels.width, 1424); assert.equal(pixels.height, 1392);
      assert.equal(pixels.alphaDifferences, 0, `${model} ${name}: exact B alpha`);
      assert.equal(pixels.outside, 0, `${model} ${name}: no exterior spill`);
      assert.ok(pixels.changed > 1000);
      await exportImage(`${model}-b-${name.toLowerCase().replaceAll(" ", "-")}`);
    }
    const differences = await page.evaluate(async variants => {
      const decoded = {};
      for (const [name, url] of Object.entries(variants)) {
        const im = new Image(); im.src = url; await im.decode();
        const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight;
        const ctx = c.getContext("2d"); ctx.drawImage(im, 0, 0);
        decoded[name] = ctx.getImageData(0, 0, c.width, c.height).data;
      }
      return [["BLACK", "MATTE BLACK"], ["BLACK", "BLACK SUEDE"], ["MATTE BLACK", "BLACK SUEDE"]].map(([a, b]) => {
        let changed = 0, total = 0, difference = 0;
        for (let i = 0; i < decoded[a].length; i += 4) if (decoded[a][i + 3] > 250 && decoded[b][i + 3] > 250) {
          const delta = (Math.abs(decoded[a][i] - decoded[b][i]) + Math.abs(decoded[a][i + 1] - decoded[b][i + 1]) + Math.abs(decoded[a][i + 2] - decoded[b][i + 2])) / 3;
          total++; difference += delta; if (delta > 3) changed++;
        }
        return { a, b, changed, meanDifference: difference / total };
      });
    }, variants);
    for (const difference of differences) {
      assert.ok(difference.changed > 1000 && difference.meanDifference > 2, `${model}: visibly different ${JSON.stringify(difference)}`);
    }
    await group("b").screenshot({ path: `${output}/${model}-b-palette.png` });
    await select("b", "FLOWER B"); assert.equal(await option("b", "BLACK SUEDE").getAttribute("aria-pressed"), "false");
    await select("b", "MATTE BLACK"); assert.equal(await option("b", "FLOWER B").getAttribute("aria-pressed"), "false");
    await select("b", "GRAY"); assert.equal(await option("b", "MATTE BLACK").getAttribute("aria-pressed"), "false");
    await select("b", "BLACK SUEDE"); assert.equal(await option("b", "GRAY").getAttribute("aria-pressed"), "false");
    await select("b", "BLACK"); assert.equal(await option("b", "BLACK SUEDE").getAttribute("aria-pressed"), "false");
    await select("b", model === "high" ? "MATTE BLACK" : "BLACK SUEDE");
    console.log(`PASS ${model}: B-only options, exact native alpha, other layers unchanged, distinct finishes, selection switching and JPEG exports; ${JSON.stringify(differences)}`);
  }
  await page.getByRole("button", { name: "장목", exact: true }).click(); await ready();
  assert.equal(await option("b", "MATTE BLACK").getAttribute("aria-pressed"), "true");
  await page.getByRole("button", { name: "중목", exact: true }).click(); await ready();
  assert.equal(await option("b", "BLACK SUEDE").getAttribute("aria-pressed"), "true");
  await page.setViewportSize({ width: 390, height: 844 });
  await select("b", "MATTE BLACK"); await select("b", "BLACK SUEDE");
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await group("b").screenshot({ path: `${output}/mobile-b-palette.png` });
  await page.getByRole("button", { name: "장목", exact: true }).click(); await ready();
  await page.getByRole("button", { name: "스페셜", exact: true }).click();
  for (const name of finishes) assert.equal(await page.getByTitle(name, { exact: true }).count(), 0);
  assert.equal(await option("b", "BLUE").getAttribute("aria-pressed"), "true", "Public design remains unchanged");
  await page.getByRole("button", { name: "스페셜", exact: true }).click(); await ready();
  await page.evaluate(() => { sessionStorage.removeItem("jidokaan-admin-token"); window.dispatchEvent(new Event("focus")); });
  await page.getByRole("button", { name: "스페셜", exact: true }).waitFor({ state: "hidden" });
  for (const name of finishes) assert.equal(await page.getByTitle(name, { exact: true }).count(), 0);
  assert.deepEqual(errors, []);
  console.log("PASS independent model drafts, mobile layout, public draft restoration and logout");
} finally { await browser.close(); }

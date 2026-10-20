// Runs the production UI against real local fixtures and a fake local admin.
// Never signs into production, submits an order, or permits outbound requests.
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.PATTERN_TEST_URL || "http://127.0.0.1:8092";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname));
const assets = JSON.parse(await readFile(process.env.PATTERN_TEST_ASSETS_JSON, "utf8"));
const output = process.env.PATTERN_TEST_OUTPUT || "/tmp/jidokaan-natural-snake/qa";
const focusedUi = process.env.NATURAL_SNAKE_FOCUSED_UI === "1";
const renderModels = (process.env.NATURAL_SNAKE_RENDER_MODELS || "high,mid").split(",");
const highMaterials = process.env.NATURAL_SNAKE_HIGH_MATERIALS?.split(",");
await mkdir(output, { recursive: true });
const snakes = ["NATURAL SNAKE", "HOT PINK SNAKE", "ORANGE SNAKE", "SKY BLUE SNAKE", "GREEN SNAKE", "YELLOW SNAKE"];
const requested = [...snakes, "SILVER WEAVE", "MICRO HOUNDSTOOTH"];
const partsFor = model => (model === "high" ? "bcdefghij" : "bcdefhij").split("");
const sourceFor = (model, part, color = "red") => model === "mid" && "efh".includes(part)
  ? `/simulator/mid/${part}/${color}.png` : `/simulator/photo/tints/${part}-${color}.png`;
const slugFor = name => name.toLowerCase().replaceAll(" ", "-");
const fallback = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=";
for (const name of [...requested, "BLACK SNAKE", "WHITE SNAKE"])
  assert.match(assets.patterns?.[name]?.texture || "", /^data:image\//, `${name}: a real material fixture is required`);
for (const name of snakes)
  assert.deepEqual(assets.patterns[name], assets.patterns["NATURAL SNAKE"], `${name}: shared python topology`);
assert.notEqual(assets.patterns["NATURAL SNAKE"].texture, assets.patterns["BLACK SNAKE"].texture);

const browser = await chromium.launch({ headless: true,
  executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || "/tmp/jidokaan-pattern-chromium",
  args: ["--no-sandbox", "--disable-gpu"],
});
const report = { mode: focusedUi ? "focused-ui" : "full", renders: [], palette: [], exports: [], ordinary: [], legacy: [], blockedRequests: [] };
const hue = ([r, g, b]) => {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d < 1) return 0;
  return ((max === r ? (g - b) / d : max === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60 + 360) % 360;
};
const hueDelta = (a, b) => Math.min(Math.abs(hue(a) - hue(b)), 360 - Math.abs(hue(a) - hue(b)));
const colorIdentity = (name, [r, g, b]) => {
  if (name === "HOT PINK SNAKE") assert.ok(r > g * 1.35 && b > g * 1.05, `${name}: pink, not neutral/red`);
  if (name === "ORANGE SNAKE") assert.ok(r > g * 1.2 && g > b * 1.2, `${name}: orange hue`);
  if (name === "SKY BLUE SNAKE") assert.ok(b > r * 1.2 && g > r * 1.05, `${name}: sky blue hue`);
  if (name === "GREEN SNAKE") assert.ok(g > r * 1.15 && g > b * 1.05, `${name}: green hue`);
  if (name === "YELLOW SNAKE") assert.ok(r > b * 1.4 && g > b * 1.3, `${name}: yellow hue`);
  if (name === "NATURAL SNAKE") assert.ok(r >= b && Math.max(r, g, b) - Math.min(r, g, b) < 75, `${name}: warm natural neutrals`);
  if (["SILVER WEAVE", "MICRO HOUNDSTOOTH"].includes(name)) assert.ok(Math.max(r, g, b) - Math.min(r, g, b) < 35, `${name}: neutral material`);
};

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  await context.route("**/*", route => {
    const url = new URL(route.request().url());
    if (["data:", "blob:"].includes(url.protocol) || url.origin === new URL(base).origin) return route.continue();
    report.blockedRequests.push(`${route.request().method()} ${url.origin}${url.pathname}`);
    return route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  await page.route(`${base}/api/simulator-special`, async route => {
    const body = route.request().postDataJSON();
    const allowed = body?.token === "python-local-test";
    await route.fulfill({ status: allowed ? 200 : 401, contentType: "application/json",
      body: JSON.stringify(!allowed ? { error: "AUTH" } : body.action === "assets"
        ? { swatch: assets.swatch || fallback, layers: assets.layers || { b: fallback }, patterns: assets.patterns }
        : { ok: true }) });
  });
  const group = part => page.locator(`[data-part="${part}"]`);
  const option = (part, name) => part === "a"
    ? group(part).locator(`button[title="${name}"]:not([data-part="laces"] button)`)
    : group(part).getByTitle(name, { exact: true });
  const preview = page.getByRole("button", { name: "Enlarge preview", exact: true });
  const save = page.getByRole("button", { name: "스페셜 시안 저장", exact: true });
  const imagesReady = () => preview.locator("img").evaluateAll(images => Promise.all(images.map(im => im.decode())));
  const ready = async () => {
    await page.waitForFunction(() => [...document.querySelectorAll("button")].some(b => b.textContent.trim() === "스페셜 시안 저장" && !b.disabled));
    await imagesReady();
  };
  const select = async (part, name, special = true) => {
    await option(part, name).click();
    if (special) await ready(); else await imagesReady();
    assert.equal(await option(part, name).getAttribute("aria-pressed"), "true", `${part}: ${name} selected`);
  };
  const layers = () => preview.locator("img").evaluateAll(images => images.map(im => im.getAttribute("src")));
  const inspect = async (model, part, name, data, swatchMean) => {
    const detail = await page.evaluate(async ({ data, source, part }) => {
      const decode = async src => {
        const im = new Image(); im.src = src; await im.decode();
        const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight;
        const ctx = c.getContext("2d"); ctx.drawImage(im, 0, 0);
        return { im, width: c.width, height: c.height, pixels: ctx.getImageData(0, 0, c.width, c.height).data };
      };
      const [rendered, original] = await Promise.all([decode(data), decode(source)]);
      let alphaDifferences = 0, outside = 0, count = 0, veryBright = 0, shadowCount = 0, shadowSum = 0, lightCount = 0, lightSum = 0;
      const sum = [0, 0, 0], histogram = new Uint32Array(256);
      for (let i = 0; i < original.pixels.length; i += 4) {
        if (original.pixels[i + 3] !== rendered.pixels[i + 3]) alphaDifferences++;
        if (!original.pixels[i + 3] && rendered.pixels[i + 3]) outside++;
        if (original.pixels[i + 3] > 250) {
          count++; for (let c = 0; c < 3; c++) sum[c] += rendered.pixels[i + c];
          const luminance = (rendered.pixels[i] + rendered.pixels[i + 1] + rendered.pixels[i + 2]) / 3;
          histogram[Math.round(luminance)]++;
          if (Math.min(rendered.pixels[i], rendered.pixels[i + 1], rendered.pixels[i + 2]) > 245) veryBright++;
          if (original.pixels[i] < 90) { shadowCount++; shadowSum += luminance; }
          if (Math.min(original.pixels[i + 1], original.pixels[i + 2]) > 140) { lightCount++; lightSum += luminance; }
        }
      }
      const quantile = ratio => { let n = 0; for (let i = 0; i < histogram.length; i++) { n += histogram[i]; if (n >= count * ratio) return i; } return 255; };
      const crop = (im, box, scale) => {
        const c = document.createElement("canvas"); c.width = box[2] * scale; c.height = box[3] * scale;
        const ctx = c.getContext("2d"); ctx.fillStyle = "#777"; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(im, ...box, 0, 0, c.width, c.height); return c.toDataURL("image/png");
      };
      const rows = part === "b"
        ? [{ label: "B outer row", box: [490, 1137, 22, 10] }, { label: "B inner row", box: [490, 1144, 22, 10] }]
        : part === "c" ? [{ label: "C outer row", box: [1000, 552, 7, 13] }, { label: "C inner row", box: [1006, 552, 7, 13] }] : [];
      const contrast = (pixels, box) => {
        const values = [];
        for (let y = box[1]; y < box[1] + box[3]; y++) for (let x = box[0]; x < box[0] + box[2]; x++) {
          const i = (y * original.width + x) * 4;
          if (original.pixels[i + 3] > 250) values.push((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3);
        }
        values.sort((a, b) => a - b);
        return { count: values.length, range: values.at(-1) - values[0], robustRange: values[Math.floor(values.length * 0.9)] - values[Math.floor(values.length * 0.1)] };
      };
      const rowContrast = rows.map(({ label, box }) => ({ label, source: contrast(original.pixels, box), result: contrast(rendered.pixels, box) }));
      const box = part === "b" ? [380, 1010, 370, 180] : part === "c" ? [972, 458, 165, 370] : null;
      return { width: rendered.width, height: rendered.height, alphaDifferences, outside, count,
        mean: sum.map(v => v / count), q10: quantile(0.1), q90: quantile(0.9), veryBrightFraction: veryBright / count,
        shapeLight: { shadowCount, shadowMean: shadowSum / Math.max(1, shadowCount), lightCount, lightMean: lightSum / Math.max(1, lightCount) }, rowContrast,
        seam: box ? crop(rendered.im, box, 1) : null, zoom: box ? crop(rendered.im, box, 4) : null,
        sourceZoom: box ? crop(original.im, box, 4) : null };
    }, { data, source: sourceFor(model, part), part });
    assert.equal(detail.width, 1424); assert.equal(detail.height, 1392);
    assert.equal(detail.alphaDifferences, 0, `${model} ${part} ${name}: exact alpha`);
    assert.equal(detail.outside, 0, `${model} ${part} ${name}: no exterior spill`);
    colorIdentity(name, detail.mean);
    if (snakes.includes(name) && name !== "NATURAL SNAKE") {
      detail.swatchHueDifference = hueDelta(detail.mean, swatchMean);
      assert.ok(detail.swatchHueDifference < 15, `${model} ${part} ${name}: rendered hue agrees with displayed swatch`);
    }
    if (["b", "c"].includes(part)) {
      assert.ok(detail.q90 - detail.q10 > 25, `${model} ${part} ${name}: relief remains visible`);
      assert.ok(detail.veryBrightFraction < 0.08, `${model} ${part} ${name}: no large blown-out enamel regions`);
      // Region means are descriptive evidence only: python markings may put a
      // dark printed cell in a lit region and a pale cell in a shaded region.
      // Their ordering cannot prove shape lighting for a patterned albedo.
      for (const row of detail.rowContrast) assert.ok(row.result.range > 8, `${model} ${name}: ${row.label} visible contrast`);
    }
    const slug = `${model}-${part}-${slugFor(name)}`;
    await writeFile(`${output}/${slug}-native.png`, Buffer.from(data.split(",")[1], "base64"));
    for (const [key, suffix] of [["seam", "seam-native"], ["zoom", "zoom"]])
      if (detail[key]) await writeFile(`${output}/${slug}-${suffix}.png`, Buffer.from(detail[key].split(",")[1], "base64"));
    if (detail.sourceZoom) await writeFile(`${output}/${model}-${part}-source-zoom.png`, Buffer.from(detail.sourceZoom.split(",")[1], "base64"));
    delete detail.seam; delete detail.zoom; delete detail.sourceZoom;
    report.renders.push({ model, part, name, ...detail });
  };
  const swatch = async name => {
    await option("b", name).scrollIntoViewIfNeeded();
    await page.waitForFunction(name => {
      const button = [...document.querySelectorAll('[data-part="b"] button[title]')].find(b => b.title === name);
      return button && /^url\(/.test(getComputedStyle(button).backgroundImage);
    }, name);
    const background = await option("b", name).evaluate(button => getComputedStyle(button).backgroundImage);
    const url = background.match(/^url\(["']?(.*?)["']?\)$/)?.[1];
    assert.match(url || "", /^data:image\//, `${name}: real material swatch displayed`);
    const mean = await page.evaluate(async src => {
      const im = new Image(); im.src = src; await im.decode();
      const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight;
      const ctx = c.getContext("2d"); ctx.drawImage(im, 0, 0);
      const pixels = ctx.getImageData(0, 0, c.width, c.height).data, sum = [0, 0, 0];
      for (let i = 0; i < pixels.length; i += 4) for (let ch = 0; ch < 3; ch++) sum[ch] += pixels[i + ch];
      return sum.map(v => v / (pixels.length / 4));
    }, url);
    colorIdentity(name, mean);
    await option("b", name).screenshot({ path: `${output}/swatch-${slugFor(name)}.png` });
    return mean;
  };
  const exportImage = async slug => {
    await preview.screenshot({ path: `${output}/${slug}.png` });
    const downloaded = page.waitForEvent("download"); await save.click();
    const file = await downloaded; assert.match(file.suggestedFilename(), /\.jpg$/);
    const target = `${output}/${slug}-export.jpg`; await file.saveAs(target);
    const bytes = await readFile(target); assert.equal(bytes.subarray(0, 3).toString("hex"), "ffd8ff"); assert.ok(bytes.length > 20000);
    const capture = await page.evaluate(async ({ jpeg, sources }) => {
      const decode = async src => { const im = new Image(); im.src = src; await im.decode(); return im; };
      const [download, ...layers] = await Promise.all([decode(jpeg), ...sources.map(decode)]);
      const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1000;
      const ctx = canvas.getContext("2d"); ctx.fillStyle = "#121214"; ctx.fillRect(0, 0, 1000, 1000);
      for (const im of layers) {
        const ratio = Math.min(1000 / im.naturalWidth, 1000 / im.naturalHeight);
        const width = im.naturalWidth * ratio, height = im.naturalHeight * ratio;
        ctx.drawImage(im, (1000 - width) / 2, (1000 - height) / 2, width, height);
      }
      const expected = ctx.getImageData(0, 0, 1000, 1000).data;
      ctx.drawImage(download, 0, 0); const actual = ctx.getImageData(0, 0, 1000, 1000).data;
      let error = 0, largeError = 0;
      for (let i = 0; i < expected.length; i += 4) {
        const difference = [0, 1, 2].reduce((sum, c) => sum + Math.abs(expected[i + c] - actual[i + c]), 0) / 3;
        error += difference; if (difference > 40) largeError++;
      }
      return { width: download.naturalWidth, height: download.naturalHeight, meanAbsoluteError: error / 1e6, largeErrorFraction: largeError / 1e6 };
    }, { jpeg: `data:image/jpeg;base64,${bytes.toString("base64")}`, sources: await layers() });
    assert.equal(capture.width, 1000); assert.equal(capture.height, 1000);
    assert.ok(capture.meanAbsoluteError < 6 && capture.largeErrorFraction < 0.02, `${slug}: exported JPEG matches the displayed layer composition`);
    report.exports.push({ slug, bytes: bytes.length, ...capture });
  };

  await page.goto(`${base}/customize`); await imagesReady();
  assert.equal(await page.getByRole("button", { name: "스페셜", exact: true }).count(), 0);
  for (const name of requested) assert.equal(await page.getByTitle(name, { exact: true }).count(), 0);
  const ordinary = {};
  for (const model of ["high", "mid"]) {
    await page.getByRole("button", { name: model === "high" ? "장목" : "중목", exact: true }).click(); await imagesReady();
    await select("b", model === "high" ? "AQUA" : "RED", false);
    await select("c", model === "high" ? "BLUE" : "MINT", false);
    ordinary[model] = await layers();
    report.ordinary.push({ model, layers: ordinary[model].length });
  }
  await page.getByRole("button", { name: "장목", exact: true }).click(); await imagesReady();
  await page.evaluate(() => sessionStorage.setItem("jidokaan-admin-token", "python-local-test")); await page.reload();
  await page.getByRole("button", { name: "스페셜", exact: true }).click(); await ready();
  const swatches = {};
  for (const name of requested) swatches[name] = await swatch(name);
  report.swatches = swatches;
  await page.setViewportSize({ width: 390, height: 844 });
  await group("b").screenshot({ path: `${output}/mobile-b-palette-preflight.png` });
  const mobilePreflight = await option("b", "MICRO HOUNDSTOOTH").evaluate(button => {
    const label = button.querySelector("span > span"), box = button.getBoundingClientRect();
    const range = document.createRange(); range.selectNodeContents(label);
    return { buttonWidth: box.width, labelWidth: label.clientWidth, scrollWidth: label.scrollWidth,
      textWidths: [...range.getClientRects()].map(r => r.width),
      overflow: label.scrollWidth > label.clientWidth + 1 || [...range.getClientRects()].some(r => r.left < box.left - 1 || r.right > box.right + 1) };
  });
  report.mobilePreflight = mobilePreflight;
  console.log("MOBILE PREFLIGHT MICRO HOUNDSTOOTH " + JSON.stringify(mobilePreflight));
  await writeFile(`${output}/mobile-preflight.json`, JSON.stringify(mobilePreflight, null, 2));
  await page.setViewportSize({ width: 1440, height: 1100 });
  for (const model of ["high", "mid"]) {
    if (model === "mid") { await page.getByRole("button", { name: "중목", exact: true }).click(); await ready(); }
    const parts = partsFor(model);
    if (model === "mid") assert.equal(await group("g").count(), 0);
    for (const name of requested) {
      assert.equal(await page.getByTitle(name, { exact: true }).count(), parts.length, `${model} ${name}: available on all leather panels`);
      for (const part of parts) assert.equal(await option(part, name).count(), 1);
      for (const part of ["a", "k", "laces", "beads"]) assert.equal(await option(part, name).count(), 0);
    }
    if (!focusedUi && renderModels.includes(model)) {
      for (const part of parts) await select(part, "BLACK");
      const original = await layers();
      const index = Object.fromEntries(parts.map(part => [part, original.findIndex(src => new RegExp(`/${part}(?:-|/)black\\.png`).test(src))]));
      for (const part of parts) assert.ok(index[part] >= 0, `${model} ${part}: layer found`);
      // Every pattern uses WHITE as its valid ordinary backing; begin from that
      // backing so the established I-to-L solid-color linkage is already settled.
      for (const part of parts) await select(part, "WHITE");
      // Confirm the previous embossed black/white snake options remain live.
      for (const name of ["BLACK SNAKE", "WHITE SNAKE"]) {
        for (const part of ["b", "c"]) {
          await select(part, name); const data = (await layers())[index[part]];
          assert.match(data, /^data:image\/png/);
          await writeFile(`${output}/${model}-${part}-${slugFor(name)}-legacy.png`, Buffer.from(data.split(",")[1], "base64"));
        }
        report.legacy.push({ model, name });
      }
      // Native WHITE is omitted for some panels and explicit for mid E/F/H.
      // Prime every panel with an existing material so insertion does not shift
      // image indices; its backing is also WHITE, keeping hidden L settled.
      for (const part of parts) await select(part, "BLACK SNAKE");
      for (const name of requested.filter(name => model !== "high" || !highMaterials || highMaterials.includes(name))) {
        for (const part of parts) {
          const before = await layers(); await select(part, name); const after = await layers();
          const changed = after.map((source, i) => source === before[i] ? -1 : i).filter(i => i >= 0 && i !== index[part]);
          assert.equal(after.length, before.length, `${model} ${part} ${name}: layer count stable`);
          assert.deepEqual(changed, [], `${model} ${part} ${name}: no unrelated layers changed`);
          await inspect(model, part, name, after[index[part]], swatches[name]);
        }
        await exportImage(`${model}-all-${slugFor(name)}`);
        console.log(`PASS ${model} ${name}: ${parts.length} native masks, isolated layers, B/C rows, hue, shape light, JPEG export`);
      }
    }
    await group("b").screenshot({ path: `${output}/${model}-b-palette.png` });
    report.palette.push({ model, parts: parts.length, materialCount: requested.length });
    await select("b", model === "high" ? "HOT PINK SNAKE" : "SKY BLUE SNAKE");
    await select("c", model === "high" ? "SILVER WEAVE" : "MICRO HOUNDSTOOTH");
    if (focusedUi) await exportImage(`${model}-mixed-ui-regression`);
  }
  for (const model of ["high", "mid", "high"]) {
    await page.getByRole("button", { name: model === "high" ? "장목" : "중목", exact: true }).click(); await ready();
    assert.equal(await option("b", model === "high" ? "HOT PINK SNAKE" : "SKY BLUE SNAKE").getAttribute("aria-pressed"), "true");
    assert.equal(await option("c", model === "high" ? "SILVER WEAVE" : "MICRO HOUNDSTOOTH").getAttribute("aria-pressed"), "true");
  }
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await group("b").screenshot({ path: `${output}/mobile-b-palette.png` });
  report.mobileLabels = [];
  for (const name of requested) {
    const detail = await option("b", name).evaluate(button => {
      const label = button.querySelector("span > span") || button.querySelector("span");
      const box = button.getBoundingClientRect(), text = label.getBoundingClientRect();
      const range = document.createRange(); range.selectNodeContents(label);
      const rects = [...range.getClientRects()];
      return { width: box.width, height: box.height, labelWidth: text.width, labelHeight: text.height,
        textWidths: rects.map(r => r.width), overflow: label.scrollWidth > label.clientWidth + 1,
        fits: text.left >= box.left - 1 && text.right <= box.right + 1 && text.width <= box.width + 1 && text.height <= box.height + 1
          && rects.every(r => r.left >= box.left - 1 && r.right <= box.right + 1 && r.top >= box.top - 1 && r.bottom <= box.bottom + 1) };
    });
    report.mobileLabels.push({ name, ...detail });
    assert.ok(detail.fits && !detail.overflow, `${name}: mobile label fits; ${JSON.stringify(detail)}`);
  }
  await page.getByRole("button", { name: "스페셜", exact: true }).click(); await imagesReady();
  assert.deepEqual(await layers(), ordinary.high, "Special changes leave high ordinary draft and image layers unchanged");
  await page.getByRole("button", { name: "중목", exact: true }).click(); await imagesReady();
  assert.deepEqual(await layers(), ordinary.mid, "Special changes leave mid ordinary draft and image layers unchanged");
  await page.getByRole("button", { name: "스페셜", exact: true }).click(); await ready();
  await page.evaluate(() => { sessionStorage.removeItem("jidokaan-admin-token"); window.dispatchEvent(new Event("focus")); });
  await page.getByRole("button", { name: "스페셜", exact: true }).waitFor({ state: "hidden" });
  for (const name of requested) assert.equal(await page.getByTitle(name, { exact: true }).count(), 0, `${name}: hidden after logout`);
  assert.deepEqual(await layers(), ordinary.mid, "Logout restores ordinary layers exactly");
  assert.deepEqual(errors, []);
  report.errors = errors;
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(`PASS ${report.renders.length} native renders, ${report.exports.length} JPEG exports, all requested swatches, per-model drafts, mobile labels, logout, ordinary unchanged`);
} catch (error) {
  report.failure = error.stack;
  await writeFile(`${output}/partial-report.json`, JSON.stringify(report, null, 2));
  throw error;
} finally { await browser.close(); }

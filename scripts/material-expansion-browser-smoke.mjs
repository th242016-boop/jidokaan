// Production UI integration test; authentication is mocked only for real local
// material fixtures. No live customer session, order submission or DB is used.
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.PATTERN_TEST_URL || "http://127.0.0.1:8092";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname));
const assets = JSON.parse(await readFile(process.env.PATTERN_TEST_ASSETS_JSON, "utf8"));
const output = process.env.PATTERN_TEST_OUTPUT || "/tmp/jidokaan-material-expansion/qa";
await mkdir(output, { recursive: true });
const colors = ["RED", "ORANGE", "YELLOW", "GREEN", "BLUE", "NAVY", "PURPLE", "KHAKI", "PINK", "WHITE", "GRAY", "BLACK"];
const finishes = [...colors.map(c => `MATTE ${c}`), ...colors.map(c => `${c} SUEDE`)];
const beads = ["GOLD", "SILVER", "RED", "ORANGE", "YELLOW", "GREEN", "BLUE", "NAVY", "PURPLE"];
const partsFor = model => (model === "high" ? "bcdefghij" : "bcdefhij").split("");
const sourceFor = (model, part, color = "red") => model === "mid" && "efh".includes(part)
  ? `/simulator/mid/${part}/${color}.png` : `/simulator/photo/tints/${part}-${color}.png`;
const fallback = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=";
for (const name of [...finishes, "WHITE SNAKE"]) assert.match(assets.patterns?.[name]?.texture || "", /^data:image\//);
const browser = await chromium.launch({ headless: true,
  executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || "/tmp/jidokaan-pattern-chromium",
  args: ["--no-sandbox", "--disable-gpu"],
});
const report = { renders: [], beads: [], palette: [], exports: [] };
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  page.setDefaultTimeout(30000);
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  await page.route(`${base}/api/simulator-special`, async route => {
    const body = route.request().postDataJSON();
    const allowed = body?.token === "expansion-local-test";
    await route.fulfill({ status: allowed ? 200 : 401, contentType: "application/json",
      body: JSON.stringify(!allowed ? { error: "AUTH" } : body?.action === "assets"
        ? { swatch: assets.swatch || fallback, layers: assets.layers || { b: fallback }, patterns: assets.patterns } : { ok: true }) });
  });
  const group = part => page.locator(`[data-part="${part}"]`);
  // The independent laces group is nested within the A section in the UI.
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
  const exportImage = async slug => {
    await preview.screenshot({ path: `${output}/${slug}.png` });
    const downloaded = page.waitForEvent("download"); await save.click();
    const file = await downloaded; assert.match(file.suggestedFilename(), /\.jpg$/);
    await file.saveAs(`${output}/${slug}-export.jpg`); report.exports.push(slug);
  };
  const inspect = async (model, part, name, data, keep = false) => {
    const detail = await page.evaluate(async ({ data, source, part, keep }) => {
      const decode = async src => {
        const im = new Image(); im.src = src; await im.decode();
        const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight;
        const ctx = c.getContext("2d"); ctx.drawImage(im, 0, 0);
        return { im, width: c.width, height: c.height, pixels: ctx.getImageData(0, 0, c.width, c.height).data };
      };
      const [rendered, original] = await Promise.all([decode(data), decode(source)]);
      let alphaDifferences = 0, outside = 0, count = 0, variance = 0;
      const sum = [0, 0, 0];
      for (let i = 0; i < original.pixels.length; i += 4) {
        if (original.pixels[i + 3] !== rendered.pixels[i + 3]) alphaDifferences++;
        if (!original.pixels[i + 3] && rendered.pixels[i + 3]) outside++;
        if (original.pixels[i + 3] > 250) {
          count++; for (let c = 0; c < 3; c++) sum[c] += rendered.pixels[i + c];
          variance += rendered.pixels[i] ** 2;
        }
      }
      let zoom;
      if (keep && (part === "b" || part === "c")) {
        const box = part === "b" ? [380, 1010, 370, 180] : [972, 458, 165, 370];
        const c = document.createElement("canvas"); c.width = box[2] * 4; c.height = box[3] * 4;
        const ctx = c.getContext("2d"); ctx.fillStyle = "#777"; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(rendered.im, ...box, 0, 0, c.width, c.height); zoom = c.toDataURL("image/png");
      }
      return { width: rendered.width, height: rendered.height, alphaDifferences, outside,
        mean: sum.map(v => v / count), deviation: Math.sqrt(Math.max(0, variance / count - (sum[0] / count) ** 2)), zoom };
    }, { data, source: sourceFor(model, part), part, keep });
    assert.equal(detail.width, 1424); assert.equal(detail.height, 1392);
    assert.equal(detail.alphaDifferences, 0, `${model} ${part} ${name}: exact alpha`);
    assert.equal(detail.outside, 0, `${model} ${part} ${name}: no exterior spill`);
    if (name === "WHITE SNAKE") assert.ok(Math.min(...detail.mean) > 135 && Math.max(...detail.mean) - Math.min(...detail.mean) < 10, `${model} ${part}: light neutral snake`);
    if (name === "AQUA") assert.ok(detail.mean[1] > detail.mean[0] * 1.4 && detail.mean[2] > detail.mean[0] * 1.4, `${model} ${part}: AQUA cyan hue`);
    if (keep) {
      const slug = `${model}-${part}-${name.toLowerCase().replaceAll(" ", "-")}`;
      if (data.startsWith("data:")) await writeFile(`${output}/${slug}-native.png`, Buffer.from(data.split(",")[1], "base64"));
      if (detail.zoom) await writeFile(`${output}/${slug}-zoom.png`, Buffer.from(detail.zoom.split(",")[1], "base64"));
    }
    delete detail.zoom; report.renders.push({ model, part, name, ...detail });
  };

  await page.goto(`${base}/customize`); await imagesReady();
  assert.equal(await page.getByRole("button", { name: "스페셜", exact: true }).count(), 0);
  assert.equal(await group("beads").count(), 0);
  const ordinaryWidth = (await option("b", "RED").boundingBox()).width;
  for (const model of ["high", "mid"]) {
    await page.getByRole("button", { name: model === "high" ? "장목" : "중목", exact: true }).click(); await imagesReady();
    for (const part of partsFor(model)) {
      assert.equal(await option(part, "AQUA").count(), 1); assert.equal(await option(part, "MINT").count(), 1);
      await select(part, "AQUA", false);
      const url = (await layers()).find(src => new RegExp(`/${part}(?:-|/)aqua\\.png`).test(src));
      assert.ok(url, `${model} ${part}: actual AQUA asset selected`);
      await inspect(model, part, "AQUA", url);
    }
    for (const part of ["a", "k", "laces"]) assert.equal(await option(part, "AQUA").count(), 0);
    await preview.screenshot({ path: `${output}/${model}-ordinary-all-aqua.png` });
    await page.reload(); await imagesReady();
    for (const part of partsFor(model)) assert.equal(await option(part, "AQUA").getAttribute("aria-pressed"), "true", "AQUA persists after reload");
  }
  await page.getByRole("button", { name: "장목", exact: true }).click(); await imagesReady();
  await page.evaluate(() => sessionStorage.setItem("jidokaan-admin-token", "expansion-local-test")); await page.reload();
  await page.getByRole("button", { name: "스페셜", exact: true }).click(); await ready();
  const compactWidth = (await option("b", "RED").boundingBox()).width;
  assert.ok(compactWidth / ordinaryWidth > 0.42 && compactWidth / ordinaryWidth < 0.58);

  for (const model of ["high", "mid"]) {
    if (model === "mid") { await page.getByRole("button", { name: "중목", exact: true }).click(); await ready(); }
    const parts = partsFor(model);
    if (model === "mid") assert.equal(await group("g").count(), 0);
    for (const name of [...finishes, "WHITE SNAKE"]) {
      assert.equal(await page.getByTitle(name, { exact: true }).count(), parts.length, `${model} ${name}: all leather parts only`);
      for (const part of parts) assert.equal(await option(part, name).count(), 1);
      for (const part of ["a", "k", "laces", "beads"]) assert.equal(await option(part, name).count(), 0);
    }
    for (const part of parts) {
      const names = await group(part).locator("button[title]").evaluateAll(bs => bs.map(b => b.title));
      assert.deepEqual(names.filter(n => n.startsWith("MATTE ")), finishes.slice(0, colors.length));
      assert.deepEqual(names.filter(n => n.endsWith(" SUEDE")), finishes.slice(colors.length));
    }
    await exportImage(`${model}-aqua-through-capture`);
    for (const part of parts) await select(part, "BLACK");
    const original = await layers();
    const index = Object.fromEntries(parts.map(part => [part, original.findIndex(src => new RegExp(`/${part}(?:-|/)black\\.png`).test(src))]));
    for (const part of parts) assert.ok(index[part] >= 0, `${model} ${part}: source located`);
    for (const name of finishes) {
      const before = await layers(); await select("b", name); const after = await layers();
      assert.deepEqual(after.filter((_, i) => i !== index.b), before.filter((_, i) => i !== index.b), "B material does not alter another layer");
      await inspect(model, "b", name, after[index.b], model === "high");
    }
    for (const name of ["MATTE BLACK", "YELLOW SUEDE", "WHITE SNAKE"]) {
      for (const part of parts) { await select(part, name); await inspect(model, part, name, (await layers())[index[part]], true); }
      await exportImage(`${model}-all-${name.toLowerCase().replaceAll(" ", "-")}`);
    }
    await group("b").screenshot({ path: `${output}/${model}-b-expanded-palette.png` });
    report.palette.push({ model, parts: parts.length, finishCount: finishes.length, whiteSnakeCount: parts.length });
    await select("b", model === "high" ? "MATTE KHAKI" : "PINK SUEDE");
    await select("c", model === "high" ? "PURPLE SUEDE" : "MATTE NAVY");
    console.log(`PASS ${model}: AQUA persistence/capture, 24 finish options on each leather part, all B color renders, all-part matte/suede/white-snake alpha and exports`);
  }

  await page.getByRole("button", { name: "장목", exact: true }).click(); await ready();
  assert.equal(await option("b", "MATTE KHAKI").getAttribute("aria-pressed"), "true");
  assert.equal(await option("c", "PURPLE SUEDE").getAttribute("aria-pressed"), "true");
  assert.match(await group("beads").innerText(), /L/);
  for (const name of ["NONE", ...beads]) assert.equal(await option("beads", name).count(), 1);
  await select("beads", "NONE"); await select("a", "WHITE"); await select("laces", "WHITE");
  const noBeads = (await layers())[1];
  assert.match(noBeads, /^data:image\/png/);
  const checkBeads = async (name, data, before) => {
    const detail = await page.evaluate(async ({ data, before }) => {
      const decode = async src => {
        const im = new Image(); im.src = src; await im.decode(); const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight;
        const ctx = c.getContext("2d"); ctx.drawImage(im, 0, 0); return ctx.getImageData(0, 0, c.width, c.height);
      };
      const [rendered, original, alphaSource] = await Promise.all([decode(data), decode(before), decode("/simulator/photo/tints/a-black.png")]);
      const w = rendered.width, h = rendered.height, mask = new Uint8Array(w * h), queue = new Int32Array(w * h);
      let head = 0, tail = 1; queue[0] = 310 * w + 680; mask[queue[0]] = 1;
      while (head < tail) {
        const p = queue[head++];
        for (const n of [p - 1, p + 1, p - w, p + w]) {
          if (n < 0 || n >= mask.length || mask[n] || !alphaSource.data[n * 4 + 3]) continue;
          if (Math.abs(n - p) === 1 && Math.floor(n / w) !== Math.floor(p / w)) continue;
          mask[n] = 1; queue[tail++] = n;
        }
      }
      let alphaDifferences = 0, outsideChanged = 0, insideChanged = 0, count = 0; const sum = [0, 0, 0];
      for (let p = 0; p < mask.length; p++) {
        const i = p * 4;
        if (rendered.data[i + 3] !== original.data[i + 3]) alphaDifferences++;
        const delta = Math.max(...[0, 1, 2].map(c => Math.abs(rendered.data[i + c] - original.data[i + c])));
        if (delta && !mask[p]) outsideChanged++;
        if (delta && mask[p]) insideChanged++;
        if (mask[p] && alphaSource.data[i + 3] > 250) { count++; for (let c = 0; c < 3; c++) sum[c] += rendered.data[i + c]; }
      }
      return { maskPixels: tail, alphaDifferences, outsideChanged, insideChanged, mean: sum.map(v => v / count) };
    }, { data, before });
    assert.equal(detail.maskPixels, 41907); assert.equal(detail.alphaDifferences, 0); assert.equal(detail.outsideChanged, 0, `${name}: no laces/lower mesh changed`);
    assert.ok(detail.insideChanged > 40000, `${name}: full intended window populated`);
    report.beads.push({ name, ...detail });
  };
  for (const name of beads) {
    const before = await layers(); await select("beads", name); const after = await layers();
    assert.deepEqual(after.filter((_, i) => i !== 1), before.filter((_, i) => i !== 1), "Beads only alter A composite, not leather panel layers");
    await checkBeads(name, after[1], noBeads);
    if (["RED", "GOLD", "SILVER"].includes(name)) {
      await writeFile(`${output}/high-beads-${name.toLowerCase()}-native.png`, Buffer.from(after[1].split(",")[1], "base64"));
      await exportImage(`high-beads-${name.toLowerCase()}`);
    }
  }
  await select("beads", "RED"); const redBeads = (await layers())[1];
  await select("a", "BLUE"); const blueMesh = (await layers())[1];
  await select("laces", "YELLOW"); const yellowLaces = (await layers())[1];
  const independence = await page.evaluate(async urls => {
    const decoded = [];
    for (const src of urls) { const im = new Image(); im.src = src; await im.decode(); const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight; const ctx = c.getContext("2d"); ctx.drawImage(im, 0, 0); decoded.push(ctx.getImageData(0, 0, c.width, c.height).data); }
    const mask = new Uint8Array(1424 * 1392), queue = new Int32Array(mask.length);
    let head = 0, tail = 1; queue[0] = 310 * 1424 + 680; mask[queue[0]] = 1;
    while (head < tail) {
      const p = queue[head++];
      for (const n of [p - 1, p + 1, p - 1424, p + 1424]) {
        if (n < 0 || n >= mask.length || mask[n] || !decoded[0][n * 4 + 3]) continue;
        if (Math.abs(n - p) === 1 && Math.floor(n / 1424) !== Math.floor(p / 1424)) continue;
        mask[n] = 1; queue[tail++] = n;
      }
    }
    let changedMesh = 0, changedLaces = 0, beadChangedByMesh = 0, beadChangedByLaces = 0;
    for (let i = 0; i < decoded[0].length; i += 4) {
      const meshDelta = [0, 1, 2, 3].some(c => decoded[0][i + c] !== decoded[1][i + c]);
      const laceDelta = [0, 1, 2, 3].some(c => decoded[1][i + c] !== decoded[2][i + c]);
      if (meshDelta) { changedMesh++; if (mask[i / 4]) beadChangedByMesh++; }
      if (laceDelta) { changedLaces++; if (mask[i / 4]) beadChangedByLaces++; }
    }
    return { beadPixels: tail, beadChangedByMesh, beadChangedByLaces, changedMesh, changedLaces };
  }, [redBeads, blueMesh, yellowLaces]);
  assert.equal(independence.beadPixels, 41907);
  assert.equal(independence.beadChangedByMesh, 0); assert.equal(independence.beadChangedByLaces, 0);
  assert.ok(independence.changedMesh > 10000 && independence.changedLaces > 1000);
  report.beadIndependence = independence;
  await exportImage("high-beads-red-blue-mesh-yellow-laces");
  await select("a", "WHITE"); await select("laces", "WHITE"); await select("beads", "NONE");
  assert.equal((await layers())[1], noBeads, "NONE restores original split A exactly");
  await select("beads", "GOLD");
  await page.getByRole("button", { name: "중목", exact: true }).click(); await ready();
  assert.equal(await option("b", "PINK SUEDE").getAttribute("aria-pressed"), "true");
  assert.equal(await option("c", "MATTE NAVY").getAttribute("aria-pressed"), "true");
  assert.equal(await group("beads").locator("button:not([disabled])").count(), 0, "No unbounded mid bead fill");
  await page.getByRole("button", { name: "장목", exact: true }).click(); await ready();
  assert.equal(await option("beads", "GOLD").getAttribute("aria-pressed"), "true");
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  for (const part of ["b", "beads"]) await group(part).screenshot({ path: `${output}/mobile-${part}-palette.png` });
  for (const name of finishes) {
    const fits = await option("b", name).evaluate(button => {
      const label = button.querySelector("span > span") || button.querySelector("span");
      const box = button.getBoundingClientRect(), text = label.getBoundingClientRect();
      return text.width <= box.width + 1 && text.height <= box.height + 1;
    });
    assert.ok(fits, `${name}: mobile label fits`);
  }
  await page.getByRole("button", { name: "스페셜", exact: true }).click(); await imagesReady();
  for (const part of partsFor("high")) assert.equal(await option(part, "AQUA").getAttribute("aria-pressed"), "true", "Special changes do not overwrite ordinary AQUA draft");
  assert.equal(await group("beads").count(), 0);
  await page.getByRole("button", { name: "스페셜", exact: true }).click(); await ready();
  await page.evaluate(() => { sessionStorage.removeItem("jidokaan-admin-token"); window.dispatchEvent(new Event("focus")); });
  await page.getByRole("button", { name: "스페셜", exact: true }).waitFor({ state: "hidden" });
  assert.equal(await group("beads").count(), 0); assert.equal(await page.getByTitle("WHITE SNAKE", { exact: true }).count(), 0);
  assert.deepEqual(errors, []);
  report.errors = errors;
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(`PASS ${report.renders.length} native renders; 9 bead colors confined to exact source window; laces/mesh independence; NONE/drafts/mobile/logout; ${report.exports.length} JPEG exports; zero browser errors`);
} finally { await browser.close(); }

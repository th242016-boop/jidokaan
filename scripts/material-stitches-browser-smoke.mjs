// Focused local production checks and native-resolution evidence for stitches.
// Auth is mocked only to supply actual protected material fixtures.
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.PATTERN_TEST_URL || "http://127.0.0.1:8092";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const assets = JSON.parse(await readFile(process.env.PATTERN_TEST_ASSETS_JSON, "utf8"));
const output = process.env.PATTERN_TEST_OUTPUT || "/tmp/jidokaan-stitch-review/qa";
await mkdir(output, { recursive: true });
const fallback = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=";
const browser = await chromium.launch({ headless: true,
  executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || "/tmp/jidokaan-pattern-chromium",
  args: ["--no-sandbox", "--disable-gpu"],
});
const results = [];
const quickFlowers = process.env.STITCH_QUICK_FLOWERS === "1";
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  await page.route(`${base}/api/simulator-special`, route => route.fulfill({ status: 200, contentType: "application/json",
    body: JSON.stringify(route.request().postDataJSON()?.action === "assets"
      ? { swatch: assets.swatch || fallback, layers: assets.layers || { b: fallback }, patterns: assets.patterns } : { ok: true }) }));
  const preview = page.getByRole("button", { name: "Enlarge preview", exact: true });
  const option = (part, name) => page.locator(`[data-part="${part}"]`).getByTitle(name, { exact: true });
  const ready = async () => {
    await page.waitForFunction(() => [...document.querySelectorAll("button")].some(b => b.textContent.trim() === "스페셜 시안 저장" && !b.disabled));
    await preview.locator("img").evaluateAll(images => Promise.all(images.map(image => image.decode())));
  };
  const select = async (part, name) => { await option(part, name).click(); await ready(); };
  const sources = () => preview.locator("img").evaluateAll(images => images.map(image => image.getAttribute("src")));
  const inspect = async (model, part, name, data, source) => {
    const detail = await page.evaluate(async ({ data, source, part }) => {
      const decode = async url => {
        const image = new Image(); image.src = url; await image.decode();
        const canvas = document.createElement("canvas"); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
        const ctx = canvas.getContext("2d"); ctx.drawImage(image, 0, 0);
        return { image, pixels: ctx.getImageData(0, 0, canvas.width, canvas.height).data, width: canvas.width, height: canvas.height };
      };
      const [rendered, original] = await Promise.all([decode(data), decode(source)]);
      let alphaDifferences = 0, outside = 0;
      for (let i = 3; i < original.pixels.length; i += 4) {
        if (original.pixels[i] !== rendered.pixels[i]) alphaDifferences++;
        if (!original.pixels[i] && rendered.pixels[i]) outside++;
      }
      const crop = (im, box, scale = 4) => {
        const canvas = document.createElement("canvas"); canvas.width = box[2] * scale; canvas.height = box[3] * scale;
        const ctx = canvas.getContext("2d"); ctx.fillStyle = "#777"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(im, ...box, 0, 0, canvas.width, canvas.height); return canvas.toDataURL("image/png");
      };
      // Two known neighboring stitch-row locations from the original source.
      // These measurements complement the zoom images; they do not invent a
      // generic seam around the entire silhouette or replace visual review.
      const rows = part === "b"
        ? [{ label: "B outer row", box: [490, 1137, 22, 10] }, { label: "B inner row", box: [490, 1144, 22, 10] }]
        : part === "c"
          ? [{ label: "C outer row", box: [1000, 552, 7, 13] }, { label: "C inner row", box: [1006, 552, 7, 13] }]
          : [];
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
      return { alphaDifferences, outside, width: rendered.width, height: rendered.height, rowContrast,
        zoom: box ? crop(rendered.image, box) : null, sourceZoom: box ? crop(original.image, box) : null };
    }, { data, source, part });
    assert.equal(detail.width, 1424); assert.equal(detail.height, 1392);
    assert.equal(detail.alphaDifferences, 0, `${model} ${part} ${name}: exact alpha`);
    assert.equal(detail.outside, 0, `${model} ${part} ${name}: no seam outside silhouette`);
    // No rows may disappear into a locally uniform fill. Final row count and
    // continuity are confirmed on the source/result zooms instead of this alone.
    for (const row of detail.rowContrast) assert.ok(row.result.range > 4, `${model} ${name}: ${row.label} has visible local contrast`);
    const slug = `${model}-${part}-${name.toLowerCase().replaceAll(" ", "-")}`;
    await writeFile(`${output}/${slug}-native.png`, Buffer.from(data.split(",")[1], "base64"));
    if (detail.zoom) {
      await writeFile(`${output}/${slug}-zoom.png`, Buffer.from(detail.zoom.split(",")[1], "base64"));
      await writeFile(`${output}/${model}-${part}-source-zoom.png`, Buffer.from(detail.sourceZoom.split(",")[1], "base64"));
    }
    delete detail.zoom; delete detail.sourceZoom;
    results.push({ model, part, name, ...detail });
  };
  await page.goto(`${base}/customize`);
  await page.evaluate(() => sessionStorage.setItem("jidokaan-admin-token", "stitch-local-test")); await page.reload();
  await page.getByRole("button", { name: "스페셜", exact: true }).click(); await ready();
  for (const model of quickFlowers ? ["high"] : ["high", "mid"]) {
    if (model === "mid") { await page.getByRole("button", { name: "중목", exact: true }).click(); await ready(); }
    const parts = (quickFlowers ? "bc" : model === "high" ? "bcdefghij" : "bcdefhij").split("");
    for (const part of parts) await select(part, "WHITE");
    for (const part of parts) {
      await select(part, "BLACK");
      const list = await sources();
      const index = list.findIndex(src => new RegExp(`/${part}(?:-|/)black\\.png`).test(src));
      assert.ok(index >= 0, `${model} ${part}: source layer located`);
      const names = quickFlowers ? ["FLOWER B", "FLOWER C"] : ["b", "c"].includes(part)
        ? ["MATTE BLACK", "MATTE WHITE", "MATTE RED", "YELLOW SUEDE", "BLACK SNAKE", "FLOWER B", "FLOWER C"]
        : ["BLACK SNAKE", "FLOWER B", "FLOWER C"];
      for (const name of names) {
        await select(part, name);
        const data = (await sources())[index];
        assert.match(data, /^data:image\/png/);
        const source = model === "mid" && "efh".includes(part) ? `/simulator/mid/${part}/red.png` : `/simulator/photo/tints/${part}-red.png`;
        await inspect(model, part, name, data, source);
      }
      await select(part, "WHITE");
    }
    for (const name of quickFlowers ? ["FLOWER B", "FLOWER C"] : ["BLACK SNAKE", "FLOWER B", "FLOWER C"]) {
      for (const part of parts) await select(part, name);
      const slug = name.toLowerCase().replaceAll(" ", "-");
      await preview.screenshot({ path: `${output}/${model}-all-${slug}.png` });
      const download = page.waitForEvent("download"); await page.getByRole("button", { name: "스페셜 시안 저장", exact: true }).click();
      await (await download).saveAs(`${output}/${model}-all-${slug}-export.jpg`);
    }
    console.log(`PASS ${model}: B/C stitch row evidence and ${parts.length} parts × ${quickFlowers ? "FLOWER B / FLOWER C" : "BLACK SNAKE / FLOWER B / FLOWER C"} masks`);
  }
  assert.deepEqual(errors, []);
  await writeFile(`${output}/stitch-report.json`, JSON.stringify(results, null, 2));
  console.log("PASS stitch evidence exports, exact alpha, zero browser errors");
} finally { await browser.close(); }

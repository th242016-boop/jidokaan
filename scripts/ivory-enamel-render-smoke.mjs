// Executes the actual patent renderer against every native high/mid part.
// Optional QA dependency @napi-rs/canvas; no browser or production credentials.
// Usage: node scripts/ivory-enamel-render-smoke.mjs <output-dir>
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const { createCanvas, Image: NativeImage, ImageData } = require("@napi-rs/canvas");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = process.argv[2];
assert.ok(output, "Provide an output directory");
mkdirSync(output, { recursive: true });
class LocalImage extends NativeImage {
  set src(value) {
    if (!value) return;
    super.src = typeof value === "string" && value.startsWith("/simulator/")
      ? readFileSync(resolve(root, "public", value.slice(1).split("?")[0])) : value;
  }
  get src() { return super.src; }
}
globalThis.Image = LocalImage;
globalThis.ImageData = ImageData;
globalThis.document = { createElement: tag => { assert.equal(tag, "canvas"); return createCanvas(1, 1); } };
globalThis.fetch = async () => { throw Error("OUTBOUND_NETWORK_DISABLED"); };
const modules = new Map();
function load(name) {
  if (modules.has(name)) return modules.get(name).exports;
  const code = ts.transpileModule(readFileSync(resolve(root, `src/lib/${name}.ts`), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} }; modules.set(name, module);
  new Function("require", "module", "exports", code)(dependency => dependency.startsWith("./")
    ? load(dependency.slice(2)) : require(dependency), module, module.exports);
  return module.exports;
}
const solids = load("special-solids"), config = load("simulator-config");
assert.ok(solids.isSpecialSolid("IVORY"));
assert.equal(config.FULL_COLORS.some(color => color.name === "IVORY"), false, "ordinary palette stays unchanged");
const fixture = new ImageData(new Uint8ClampedArray([
  255, 0, 0, 255, 160, 0, 0, 255, 255, 180, 180, 255,
  245, 245, 245, 255, 8, 8, 8, 255, 230, 10, 20, 63, 42, 84, 126, 0,
]), 7, 1);
const tinted = solids.renderSolidPatent(fixture, "IVORY");
assert.deepEqual([...tinted.data.slice(0, 4)], [248, 237, 217, 255], "brighter warm ivory pigment");
assert.ok(tinted.data[4] > 180, "ivory midtones stay bright instead of inheriting dark red dye");
assert.deepEqual([...tinted.data.slice(12, 16)], [245, 245, 245, 255], "white reflection is untinted");
assert.deepEqual([...tinted.data.slice(16, 20)], [8, 8, 8, 255], "neutral stitch/shadow retained");
assert.deepEqual([...tinted.data.slice(24)], [...fixture.data.slice(24)], "transparent RGB unchanged");

async function decode(src) { const image = new LocalImage(); image.src = src; await image.decode(); return image; }
function pixels(image) {
  const canvas = createCanvas(image.naturalWidth, image.naturalHeight);
  const ctx = canvas.getContext("2d"); ctx.drawImage(image, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
const report = [];
for (const model of ["high", "mid"]) {
  const parts = solids.specialSolidPartsFor(model);
  assert.equal(parts.length, model === "high" ? 9 : 8);
  assert.equal(parts.includes("g"), model === "high");
  const layers = await solids.loadSpecialSolidLayers(model);
  const composite = createCanvas(1424, 1392), ctx = composite.getContext("2d");
  ctx.drawImage(await decode(config.photoBaseFor({ model })), 0, 0);
  for (const part of parts) {
    const source = pixels(await decode(config.photoLayerFor(part, "RED", { model })));
    const image = await decode(layers.IVORY[part]), actual = pixels(image);
    const gray = solids.renderGrayPatent(source);
    let covered = 0, low = 255, high = 0, warm = 0, beforeLuma = 0, afterLuma = 0;
    for (let i = 0; i < source.data.length; i += 4) {
      assert.equal(actual.data[i + 3], source.data[i + 3], `${model}:${part} alpha`);
      const neutral = Math.min(...source.data.slice(i, i + 3));
      const diffuse = Math.max(0, source.data[i] - neutral);
      if (source.data[i + 3]) for (let c = 0; c < 3; c++)
        assert.equal(gray.data[i + c], Math.round(neutral + diffuse * [122, 125, 132][c] / 255), "existing GRAY unchanged");
      if (source.data[i + 3] < 250) continue;
      covered++; low = Math.min(low, actual.data[i]); high = Math.max(high, actual.data[i]);
      if (actual.data[i] > actual.data[i + 2] + 6) warm++;
      for (let c = 0; c < 3; c++) {
        const weight = [0.2126, 0.7152, 0.0722][c];
        beforeLuma += Math.round(neutral + diffuse * [238, 226, 204][c] / 255) * weight;
        afterLuma += actual.data[i + c] * weight;
      }
    }
    assert.ok(high - low > 20, "retain highlight and shadow range");
    assert.ok(warm / covered > 0.15, "ivory distinguishable from white");
    assert.notEqual(layers.IVORY[part], layers.GRAY[part], "cache must distinguish colors");
    const luminanceLift = (afterLuma - beforeLuma) / covered;
    assert.ok(luminanceLift > 6, `${model}:${part} brighter than previous gray-looking ivory`);
    ctx.drawImage(image, 0, 0);
    report.push({ model, part, covered, range: high - low, warmFraction: warm / covered, alphaDifferences: 0, luminanceLift });
  }
  writeFileSync(resolve(output, `${model}-ivory-enamel.png`), composite.toBuffer("image/png"));
}
writeFileSync(resolve(output, "ivory-enamel-report.json"), JSON.stringify(report, null, 2));
console.log(`PASS ${report.length} native parts: exact alpha, brighter warm ivory, highlights/shadows, unchanged GRAY and separate color caches.`);

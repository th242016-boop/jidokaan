// Native Canvas execution of the actual application renderer; no browser,
// network, production credentials or mutations to supplied photographs.
// Usage: node scripts/wine-crocodile-render-smoke.mjs <mixed-atlas.jpg> <output-dir> [baseline-ref]
// Requires the optional QA dependency @napi-rs/canvas; not a runtime dependency.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import ts from "typescript";

const require = createRequire(import.meta.url);
const { createCanvas, Image: NativeImage, ImageData, Path2D } = require("@napi-rs/canvas");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = process.argv[2], output = process.argv[3];
assert.ok(sourcePath && output, "Provide corrected mixed-shape atlas and output directory");
mkdirSync(output, { recursive: true });
class LocalImage extends NativeImage {
  set src(value) {
    if (!value) return;
    const local = typeof value === "string" && value.startsWith("/simulator/");
    super.src = local ? readFileSync(resolve(root, "public", value.slice(1).split("?")[0])) : value;
  }
  get src() { return super.src; }
}
globalThis.Image = LocalImage;
globalThis.ImageData = ImageData;
globalThis.Path2D = Path2D;
globalThis.document = { createElement: tag => { assert.equal(tag, "canvas"); return createCanvas(1, 1); } };
globalThis.fetch = async () => { throw Error("OUTBOUND_NETWORK_DISABLED"); };

function moduleLoader(baseline) {
  const modules = new Map();
  function load(name) {
    if (modules.has(name)) return modules.get(name).exports;
    const filename = resolve(root, `src/lib/${name}.ts`);
    const source = baseline
      ? execFileSync("git", ["show", `${baseline}:src/lib/${name}.ts`], { cwd: root, encoding: "utf8" })
      : readFileSync(filename, "utf8");
    const code = ts.transpileModule(source, { compilerOptions: {
      target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
    } }).outputText;
    const module = { exports: {} }; modules.set(name, module);
    const localRequire = dependency => dependency.startsWith("./") ? load(dependency.slice(2)) : require(dependency);
    new Function("require", "module", "exports", code)(localRequire, module, module.exports);
    return module.exports;
  }
  return load;
}
const load = moduleLoader(), patterns = load("special-patterns"), config = load("simulator-config");
assert.equal(patterns.SPECIAL_PATTERNS.find(({ name }) => name === "WINE CROCODILE")?.label, "와인 크로커다일");
assert.equal(load("lizard-materials").lizardMaterialFor("WINE CROCODILE"), undefined, "wine crocodile atlas must not inherit the black atlas dye transfer");
assert.equal(load("lizard-materials").isLizardPattern("WINE CROCODILE"), false, "wine crocodile atlas must not alias to the black atlas source");
const material = new NativeImage(); material.src = readFileSync(sourcePath); await material.decode();
assert.equal(material.naturalWidth, 1254); assert.equal(material.naturalHeight, 1254);
const photo = `data:image/jpeg;base64,${readFileSync(sourcePath).toString("base64")}`;
const { WINE_CROCODILE_CROP: crop } = load("wine-crocodile-material");
const assets = { "WINE CROCODILE": { texture: photo, swatch: photo, sourceCrop: crop } };
const cropWidth = Math.round(crop[2] * material.naturalWidth), cropHeight = Math.round(crop[3] * material.naturalHeight);
const swatch = createCanvas(cropWidth, cropHeight);
swatch.getContext("2d").drawImage(material, crop[0] * material.naturalWidth, crop[1] * material.naturalHeight, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
writeFileSync(resolve(output, "wine-crocodile-source-crop.png"), swatch.toBuffer("image/png"));
assert.ok(crop.every(v => v >= 0 && v <= 1));
assert.ok(crop[0] + crop[2] <= 1 && crop[1] + crop[3] <= 1);
assert.deepEqual(patterns.patternSwatchPlacement(assets["WINE CROCODILE"]), {
  backgroundSize: `${100 / crop[2]}% ${100 / crop[3]}%`,
  backgroundPosition: `${crop[2] === 1 ? 0 : 100 * crop[0] / (1 - crop[2])}% ${crop[3] === 1 ? 0 : 100 * crop[1] / (1 - crop[3])}%`,
});

async function decode(src) { const image = new LocalImage(); image.src = src; await image.decode(); return image; }
function pixels(image) {
  const canvas = createCanvas(image.naturalWidth, image.naturalHeight);
  const ctx = canvas.getContext("2d"); ctx.drawImage(image, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
const report = { renderer: "actual loadPatternLayer via native Canvas (not a browser session)", layers: [], regressions: [], relighting: {} };
const seamRegions = { b: [365, 920, 410, 270], c: [965, 440, 180, 420] };
for (const model of ["high", "mid"]) {
  const parts = patterns.patternPartsFor(model, "WINE CROCODILE");
  assert.equal(parts.length, model === "high" ? 9 : 8);
  assert.equal(parts.includes("g"), model === "high");
  const base = await decode(config.photoBaseFor({ model }));
  const composite = createCanvas(1424, 1392), ctx = composite.getContext("2d");
  ctx.drawImage(base, 0, 0);
  for (const part of parts) {
    const rendered = await patterns.loadPatternLayer(model, part, "WINE CROCODILE", assets);
    const layer = await decode(rendered), actual = pixels(layer);
    const source = pixels(await decode(config.photoLayerFor(part, "RED", { model })));
    assert.equal(actual.width, 1424); assert.equal(actual.height, 1392);
    let alphaDifferences = 0, exteriorSpill = 0, coverage = 0;
    for (let i = 0; i < actual.data.length; i += 4) {
      if (actual.data[i + 3] !== source.data[i + 3]) alphaDifferences++;
      if (!source.data[i + 3] && actual.data[i + 3]) exteriorSpill++;
      if (actual.data[i + 3]) coverage++;
    }
    assert.equal(alphaDifferences, 0, `${model}/${part} native alpha`);
    assert.equal(exteriorSpill, 0, `${model}/${part} exterior pixels`);
    assert.ok(coverage > 100);
    ctx.drawImage(layer, 0, 0);
    writeFileSync(resolve(output, `${model}-${part}-wine-crocodile.png`), Buffer.from(rendered.split(",")[1], "base64"));
    report.layers.push({ model, part, alphaDifferences, exteriorSpill, coverage });
    console.log(`PASS ${model}/${part}: 1424×1392, exact native alpha and no spill`);
  }
  writeFileSync(resolve(output, `${model}-wine-crocodile-full.png`), composite.toBuffer("image/png"));
  for (const [part, [x, y, width, height]] of Object.entries(seamRegions)) {
    const detail = createCanvas(width * 3, height * 3), dc = detail.getContext("2d");
    dc.imageSmoothingEnabled = false;
    dc.drawImage(composite, x, y, width, height, 0, 0, width * 3, height * 3);
    writeFileSync(resolve(output, `${model}-${part}-stitches.png`), detail.toBuffer("image/png"));
  }
}
assert.equal(report.layers.length, 17);

// A shared deterministic sample exercises unchanged historical branches, without
// requiring any of the actual secret material sources from production.
const synthetic = createCanvas(48, 48), synthCtx = synthetic.getContext("2d");
const synth = synthCtx.createImageData(48, 48);
for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) {
  const i = (y * 48 + x) * 4;
  synth.data[i] = 40 + (x * 13 + y * 7) % 190;
  synth.data[i + 1] = 50 + (x * 9 + y * 11) % 170;
  synth.data[i + 2] = 60 + (x * 3 + y * 17) % 150;
  synth.data[i + 3] = 255;
}
synthCtx.putImageData(synth, 0, 0);
const syntheticAsset = { texture: synthetic.toDataURL("image/png"), swatch: synthetic.toDataURL("image/png") };
const baseline = moduleLoader(process.argv[4] || "origin/main")("special-patterns");
for (const name of ["MICRO HOUNDSTOOTH", "BLACK SNAKE", "FLOWER C", "MATTE BLACK", "BRONZE", "GRAY LIZARD", "IVORY ORNAMENT", "SILVER SNAKE", "MINT GOLD PEARL"]) {
  for (const [model, part] of [["high", "b"], ["mid", "e"]]) {
    const fixture = { [name]: syntheticAsset };
    const before = pixels(await decode(await baseline.loadPatternLayer(model, part, name, fixture)));
    const after = pixels(await decode(await patterns.loadPatternLayer(model, part, name, fixture)));
    assert.deepEqual(after.data, before.data, `${model}/${part}/${name} regression`);
    report.regressions.push({ model, part, name, identical: true });
    console.log(`PASS unchanged ${model}/${part}/${name}`);
  }
}
// The wine photo retains its own dye and soft satin response. It must not
// inherit the neighboring pearl's bright metal reflection or lose dark seams.
const luma = values => values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
const lightProfile = patterns.surfaceLightProfile("WINE CROCODILE");
assert.deepEqual(lightProfile, baseline.surfaceLightProfile("WINE CROCODILE"), "shape correction must retain the previously approved low-gloss response");
assert.ok(lightProfile.blur >= 26, "wine highlights should be broad");
assert.ok(lightProfile.sheen < 0.02, "wine retains low-intensity satin reflection");
assert.ok(lightProfile.sheen < patterns.surfaceLightProfile("MINT GOLD PEARL").sheen / 10, "wine is not a metallic material");
function solidPixels(width, height, rgba) {
  const result = new ImageData(width, height);
  for (let i = 0; i < result.data.length; i += 4) result.data.set(rgba, i);
  return result;
}
const mask = solidPixels(3, 1, [220, 0, 0, 255]);
mask.data[4] = 25;
mask.data[11] = 0;
const renderAtLight = (source, level) => patterns.renderPatternPixels(mask,
  solidPixels(1, 1, [...source, 255]), "WINE CROCODILE", undefined, undefined, "b",
  solidPixels(3, 1, [level, level, level, 255]));
const references = { wine: [128, 38, 66], wornCrease: [180, 104, 118] };
const actualResponses = {};
for (const [name, source] of Object.entries(references)) {
  actualResponses[name] = [];
  for (const level of [30, 75, 130, 200, 245]) {
    const result = renderAtLight(source, level);
    assert.ok(luma(result.data.slice(4, 7)) < luma(result.data.slice(0, 3)), "dark seam remains darker than adjacent face");
    assert.equal(result.data[3], 255); assert.equal(result.data[7], 255);
    assert.deepEqual([...result.data.slice(8, 12)], [0, 0, 0, 0], "light never spills outside alpha");
    assert.ok(result.data[0] > result.data[2] && result.data[2] > result.data[1], "red wine hue retained at every light level");
    actualResponses[name].push([...result.data.slice(0, 3)]);
  }
  for (let i = 1; i < actualResponses[name].length; i++) {
    assert.ok(luma(actualResponses[name][i]) > luma(actualResponses[name][i - 1]), "satin responds smoothly to light");
  }
}
for (let i = 0; i < actualResponses.wine.length; i++) assert.ok(luma(actualResponses.wornCrease[i]) > luma(actualResponses.wine[i]), "photographic worn crease remains lighter than plate face");
report.relighting = { lightProfile, actualResponses, preservedWineHue: true, preservedDarkDetail: true, exteriorSpill: 0 };
console.log("PASS wine hue, broad satin light, lighter worn creases, dark seam preservation and no spill");
writeFileSync(resolve(output, "wine-crocodile-render-report.json"), JSON.stringify(report, null, 2));
console.log("PASS 17 actual renderer outputs and 18 byte-identical historical-material regressions");

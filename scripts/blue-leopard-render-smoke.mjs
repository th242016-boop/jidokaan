// Native Canvas execution of the actual application renderer; no browser,
// network, production credentials or mutations to supplied photographs.
// Usage: node scripts/blue-leopard-render-smoke.mjs <packaged-tile.jpg> <output-dir> [baseline-ref]
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
assert.ok(sourcePath && output, "Provide packaged texture tile and output directory");
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
    const source = baseline && name === "special-patterns"
      ? execFileSync("git", ["show", `${baseline}:src/lib/special-patterns.ts`], { cwd: root, encoding: "utf8" })
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
assert.equal(patterns.SPECIAL_PATTERNS.find(({ name }) => name === "BLUE LEOPARD")?.label, "블루레오파드");
assert.equal(load("lizard-materials").lizardMaterialFor("BLUE LEOPARD"), undefined, "blue satin texture must not inherit the black atlas dye transfer");
assert.equal(load("lizard-materials").isLizardPattern("BLUE LEOPARD"), false, "blue satin texture must not alias to the black atlas source");
const material = new NativeImage(); material.src = readFileSync(sourcePath); await material.decode();
assert.ok([768, 1024].includes(material.naturalWidth), "Use packaged 768px or 1024px JPEG");
assert.equal(material.naturalWidth, material.naturalHeight);
const photo = `data:image/jpeg;base64,${readFileSync(sourcePath).toString("base64")}`;
const { BLUE_LEOPARD_TILE: tile, blueLeopardRepeatTexture } = load("blue-leopard-material");
const assets = { "BLUE LEOPARD": { texture: photo, swatch: photo } };
assert.deepEqual(patterns.patternSwatchPlacement(assets["BLUE LEOPARD"]), {
  backgroundSize: "cover", backgroundPosition: "center",
});
const sourceCanvas = createCanvas(material.naturalWidth, material.naturalHeight);
const sourceContext = sourceCanvas.getContext("2d");
sourceContext.drawImage(material, 0, 0);
const sourcePixels = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
const repeatPixels = blueLeopardRepeatTexture(sourcePixels);
assert.equal(repeatPixels.width, sourcePixels.width - Math.round(sourcePixels.width * 0.06));
assert.equal(repeatPixels.height, sourcePixels.height - Math.round(sourcePixels.height * 0.06));
const margin = Math.round(sourcePixels.width * 0.06);
for (let y = margin; y < repeatPixels.height; y++) for (let x = margin; x < repeatPixels.width; x++) {
  const outputIndex = (y * repeatPixels.width + x) * 4;
  const sourceIndex = (y * sourcePixels.width + x) * 4;
  for (let c = 0; c < 4; c++) assert.equal(repeatPixels.data[outputIndex + c], sourcePixels.data[sourceIndex + c], "interior texture unchanged");
}
function edgeJump(data) {
  let jump = 0, count = 0;
  for (let y = 0; y < data.height; y++) for (let c = 0; c < 3; c++) {
    jump += Math.abs(data.data[(y * data.width) * 4 + c] - data.data[(y * data.width + data.width - 1) * 4 + c]); count++;
  }
  for (let x = 0; x < data.width; x++) for (let c = 0; c < 3; c++) {
    jump += Math.abs(data.data[x * 4 + c] - data.data[((data.height - 1) * data.width + x) * 4 + c]); count++;
  }
  return jump / count;
}
const seamBefore = edgeJump(sourcePixels), seamAfter = edgeJump(repeatPixels);
assert.ok(seamAfter < seamBefore, "overlap reduces repeat-edge discontinuity");
const repeatCanvas = createCanvas(repeatPixels.width, repeatPixels.height);
repeatCanvas.getContext("2d").putImageData(repeatPixels, 0, 0);
const tiled = createCanvas(repeatPixels.width * 2, repeatPixels.height * 2), tiledContext = tiled.getContext("2d");
for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) tiledContext.drawImage(repeatCanvas, x * repeatPixels.width, y * repeatPixels.height);
writeFileSync(resolve(output, "blue-leopard-repeat-2x2.png"), tiled.toBuffer("image/png"));

async function decode(src) { const image = new LocalImage(); image.src = src; await image.decode(); return image; }
function pixels(image) {
  const canvas = createCanvas(image.naturalWidth, image.naturalHeight);
  const ctx = canvas.getContext("2d"); ctx.drawImage(image, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
const report = { renderer: "actual loadPatternLayer via native Canvas (not a browser session)", seams: { meanEdgeJumpBefore: seamBefore, meanEdgeJumpAfter: seamAfter }, layers: [], regressions: [] };
const seamRegions = { b: [365, 920, 410, 270], c: [965, 440, 180, 420] };
for (const model of ["high", "mid"]) {
  const parts = patterns.patternPartsFor(model, "BLUE LEOPARD");
  assert.equal(parts.length, model === "high" ? 9 : 8);
  assert.equal(parts.includes("g"), model === "high");
  const base = await decode(config.photoBaseFor({ model }));
  const composite = createCanvas(1424, 1392), ctx = composite.getContext("2d");
  ctx.drawImage(base, 0, 0);
  for (const part of parts) {
    const rendered = await patterns.loadPatternLayer(model, part, "BLUE LEOPARD", assets);
    const layer = await decode(rendered), actual = pixels(layer);
    const source = pixels(await decode(config.photoLayerFor(part, "RED", { model })));
    assert.equal(actual.width, 1424); assert.equal(actual.height, 1392);
    let alphaDifferences = 0, exteriorSpill = 0, coverage = 0;
    let minX = source.width, minY = source.height, maxX = 0, maxY = 0;
    for (let i = 0; i < actual.data.length; i += 4) {
      if (actual.data[i + 3] !== source.data[i + 3]) alphaDifferences++;
      if (!source.data[i + 3] && actual.data[i + 3]) exteriorSpill++;
      if (actual.data[i + 3]) coverage++;
      if (source.data[i + 3]) {
        const pixel = i / 4, x = pixel % source.width, y = Math.floor(pixel / source.width);
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
    assert.equal(alphaDifferences, 0, `${model}/${part} native alpha`);
    assert.equal(exteriorSpill, 0, `${model}/${part} exterior pixels`);
    assert.ok(coverage > 100);
    // All parts use the same visually calibrated motif scale, independently
    // of their bounding box. The texture repeats without mirrored rosettes.
    const guardedExtent = { width: maxX - minX + 37, height: maxY - minY + 25 };
    assert.equal(tile, 420);
    ctx.drawImage(layer, 0, 0);
    writeFileSync(resolve(output, `${model}-${part}-blue-leopard.png`), Buffer.from(rendered.split(",")[1], "base64"));
    report.layers.push({ model, part, alphaDifferences, exteriorSpill, coverage, guardedExtent, projectedTileSize: tile });
    console.log(`PASS ${model}/${part}: 1424×1392, exact native alpha and no spill`);
  }
  writeFileSync(resolve(output, `${model}-blue-leopard-full.png`), composite.toBuffer("image/png"));
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
for (const name of ["FLOWER B", "FLOWER C", "BLACK SNAKE", "WINE CROCODILE", "MATTE BLACK", "SILVER SNAKE", "MINT GOLD PEARL", "BRONZE"]) {
  for (const [model, part] of [["high", "b"], ["mid", "e"]]) {
    const fixture = { [name]: syntheticAsset };
    const before = pixels(await decode(await baseline.loadPatternLayer(model, part, name, fixture)));
    const after = pixels(await decode(await patterns.loadPatternLayer(model, part, name, fixture)));
    assert.deepEqual(after.data, before.data, `${model}/${part}/${name} regression`);
    report.regressions.push({ model, part, name, identical: true });
    console.log(`PASS unchanged ${model}/${part}/${name}`);
  }
}
writeFileSync(resolve(output, "blue-leopard-render-report.json"), JSON.stringify(report, null, 2));
console.log("PASS 17 actual renderer outputs and 16 byte-identical historical-material regressions");

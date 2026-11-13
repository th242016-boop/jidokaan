// Actual A renderer with native Canvas. No network or production credentials.
// Usage: NODE_PATH=<external-QA-node_modules> node scripts/blue-leopard-mesh-render-smoke.mjs <packaged-tile.jpg> <output-dir>
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
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
    super.src = typeof value === "string" && value.startsWith("/simulator/")
      ? readFileSync(resolve(root, "public", value.slice(1).split("?")[0])) : value;
  }
  get src() { return super.src; }
}
globalThis.Image = LocalImage; globalThis.ImageData = ImageData; globalThis.Path2D = Path2D;
globalThis.document = { createElement: tag => { assert.equal(tag, "canvas"); return createCanvas(1, 1); } };
globalThis.fetch = async () => { throw Error("OUTBOUND_NETWORK_DISABLED"); };
const modules = new Map();
function load(name) {
  if (modules.has(name)) return modules.get(name).exports;
  const code = ts.transpileModule(readFileSync(resolve(root, `src/lib/${name}.ts`), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} }; modules.set(name, module);
  new Function("require", "module", "exports", code)(dependency => dependency.startsWith("./") ? load(dependency.slice(2)) : require(dependency), module, module.exports);
  return module.exports;
}
const mesh = load("mesh-laces"), render = load("blue-leopard-mesh"), config = load("simulator-config"), beads = load("bead-material");
const texture = `data:image/jpeg;base64,${readFileSync(sourcePath).toString("base64")}`;
const asset = { texture, swatch: texture };
const report = { renderer: "actual A mesh renderer via native Canvas", models: [], laceChecks: [] };
async function decode(src) { const image = new LocalImage(); image.src = src; await image.decode(); return image; }
function encode(pixels) { const c = createCanvas(pixels.width, pixels.height); c.getContext("2d").putImageData(pixels, 0, 0); return c; }
for (const model of ["high", "mid"]) {
  const source = await mesh.loadMeshLacePixels(model);
  const surface = await render.loadBlueLeopardMeshSurface(source, model, asset);
  const white = render.renderBlueLeopardMesh(source, "WHITE", surface);
  let alphaMismatch = 0, exterior = 0, nativeLaces = 0, pureMesh = 0, changedMesh = 0;
  for (let p = 0; p < source.lace.length; p++) {
    const i = p * 4;
    if (white.data[i + 3] !== source.white[i + 3]) alphaMismatch++;
    if (!source.white[i + 3] && white.data[i + 3]) exterior++;
    if (source.white[i + 3] && source.lace[p] === 255) nativeLaces++;
    if (source.white[i + 3] && !source.lace[p]) {
      pureMesh++;
      if (Math.abs(white.data[i] - source.white[i]) + Math.abs(white.data[i + 1] - source.white[i + 1]) + Math.abs(white.data[i + 2] - source.white[i + 2]) > 20) changedMesh++;
    }
  }
  assert.equal(alphaMismatch, 0); assert.equal(exterior, 0);
  assert.ok(nativeLaces > 15000); assert.ok(pureMesh > 50000); assert.ok(changedMesh / pureMesh > 0.98);
  for (const color of mesh.LACE_COLORS) {
    const result = render.renderBlueLeopardMesh(source, color, surface), baseline = mesh.renderMeshLaces(source, "WHITE", color);
    let laceMismatch = 0, meshMismatch = 0, alphaMismatch = 0;
    for (let p = 0; p < source.lace.length; p++) {
      const i = p * 4;
      if (result.data[i + 3] !== source.white[i + 3]) alphaMismatch++;
      if (!source.white[i + 3]) continue;
      for (let c = 0; c < 3; c++) {
        if (source.lace[p] === 255 && result.data[i + c] !== baseline.data[i + c]) laceMismatch++;
        if (source.lace[p] === 0 && result.data[i + c] !== white.data[i + c]) meshMismatch++;
      }
    }
    assert.equal(laceMismatch, 0, `${model}/${color}: all fully covered lace pixels preserved`);
    assert.equal(meshMismatch, 0, `${model}/${color}: mesh unaffected by lace color`);
    assert.equal(alphaMismatch, 0, `${model}/${color}: native alpha`);
    report.laceChecks.push({ model, color, laceMismatch, meshMismatch, alphaMismatch });
    if (color === "WHITE" || color === "BLACK") {
      const layer = encode(result);
      writeFileSync(resolve(output, `${model}-a-blue-leopard-${color.toLowerCase()}-laces.png`), layer.toBuffer("image/png"));
      const composite = createCanvas(source.width, source.height), ctx = composite.getContext("2d");
      ctx.drawImage(await decode(config.photoBaseFor({ model })), 0, 0); ctx.drawImage(layer, 0, 0);
      writeFileSync(resolve(output, `${model}-full-blue-mesh-${color.toLowerCase()}-laces.jpg`), composite.toBuffer("image/jpeg"));
      const crop = createCanvas(930, 960), cropCtx = crop.getContext("2d");
      cropCtx.drawImage(composite, 390, model === "high" ? 200 : 410, 620, 640, 0, 0, 930, 960);
      writeFileSync(resolve(output, `${model}-blue-mesh-detail-${color.toLowerCase()}-laces.jpg`), crop.toBuffer("image/jpeg"));
    }
  }
  const beadMask = beads.createBeadMask(source, model);
  if (model === "high") {
    const result = render.renderBlueLeopardMesh(source, "WHITE", surface), before = new Uint8ClampedArray(result.data);
    beads.renderBeads(result, source, beadMask, "GOLD");
    let changed = 0, outside = 0;
    for (let p = 0; p < source.lace.length; p++) for (let c = 0; c < 3; c++) {
      const i = p * 4 + c;
      if (result.data[i] !== before[i]) { changed++; if (!beadMask[p]) outside++; }
    }
    assert.ok(changed > 100); assert.equal(outside, 0);
  }
  report.models.push({ model, alphaMismatch, exterior, nativeLaces, pureMesh, changedMesh });
  console.log(`PASS ${model}: exact native alpha, 8 independent lace colors, ${nativeLaces} pure lace pixels, ${pureMesh} mesh pixels`);
}
assert.equal(report.laceChecks.length, 16);
await assert.rejects(render.loadBlueLeopardMeshSurface({ width: 1, height: 1 }, "high", asset), /MESH_SOURCE_SIZE/);
writeFileSync(resolve(output, "blue-leopard-mesh-report.json"), JSON.stringify(report, null, 2));
console.log("PASS 2 native A masks, 16 lace isolation cases, independent beads, and invalid source guard");

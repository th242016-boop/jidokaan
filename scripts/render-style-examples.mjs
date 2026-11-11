// Rebuild the five recommendation photos from the actual simulator layers.
// Usage: node scripts/render-style-examples.mjs [optional Canvas dependency root]
// @napi-rs/canvas is an optional build/QA tool, not an application dependency.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const canvasRequire = process.argv[2]
  ? createRequire(resolve(process.argv[2], "package.json")) : require;
const { createCanvas, Image } = canvasRequire("@napi-rs/canvas");
const modules = new Map();
function load(name) {
  if (modules.has(name)) return modules.get(name).exports;
  const source = readFileSync(resolve(root, `src/lib/${name}.ts`), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
  } }).outputText;
  const module = { exports: {} }; modules.set(name, module);
  new Function("require", "module", "exports", code)(
    dependency => dependency.startsWith("./") ? load(dependency.slice(2)) : require(dependency),
    module, module.exports,
  );
  return module.exports;
}

const config = load("simulator-config");
const { STYLE_PRESETS, stylePresetExample } = load("style-recommendations");
const { completeDesign } = load("design-order");
const output = resolve(root, "public/simulator/recommendations");
mkdirSync(output, { recursive: true });
const artifacts = resolve(root, "artifacts");
mkdirSync(artifacts, { recursive: true });
const width = 480, height = 470;
const contact = createCanvas(width * STYLE_PRESETS.length, (height + 38) * 2);
const contactCtx = contact.getContext("2d");
contactCtx.fillStyle = "#f4f4f4";
contactCtx.fillRect(0, 0, contact.width, contact.height);

async function imageAt(src) {
  assert.ok(src.startsWith("/simulator/"), "Only repository simulator assets may be rendered");
  const image = new Image();
  image.src = readFileSync(resolve(root, "public", src.slice(1).split("?")[0]));
  await image.decode();
  return image;
}

for (const [row, model] of ["high", "mid"].entries()) {
  for (const [column, preset] of STYLE_PRESETS.entries()) {
    const example = stylePresetExample(preset.id, model);
    assert.ok(completeDesign(example.names), `${model}/${preset.id}: valid orderable design`);
    const base = await imageAt(config.photoBaseFor(example.names));
    // Draw every original layer at native dimensions before downsampling. The
    // layer ordering and model-specific source paths match LayerSimulator.
    const native = createCanvas(base.naturalWidth, base.naturalHeight);
    const nativeCtx = native.getContext("2d");
    nativeCtx.drawImage(base, 0, 0);
    for (const part of config.partsForModel(example.names).filter(part => config.READY_PARTS.includes(part.id))) {
      const source = config.photoLayerFor(part.id, example.names[part.id], example.names);
      if (!source) continue;
      const layer = await imageAt(source);
      assert.equal(layer.naturalWidth, base.naturalWidth);
      assert.equal(layer.naturalHeight, base.naturalHeight);
      nativeCtx.drawImage(layer, 0, 0);
    }
    const thumbnail = createCanvas(width, height), ctx = thumbnail.getContext("2d");
    ctx.fillStyle = "#eeeeee"; ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const scale = Math.min(width / native.width, height / native.height);
    const w = native.width * scale, h = native.height * scale;
    ctx.drawImage(native, (width - w) / 2, (height - h) / 2, w, h);
    const bytes = thumbnail.toBuffer("image/jpeg", 87);
    const filename = `${model}-${preset.id}.jpg`;
    writeFileSync(resolve(output, filename), bytes);
    const x = column * width, y = row * (height + 38);
    contactCtx.drawImage(thumbnail, x, y);
    contactCtx.fillStyle = "#151515"; contactCtx.font = "20px sans-serif";
    contactCtx.fillText(`${model} · ${preset.id}`, x + 12, y + height + 27);
    console.log(`${filename}: ${width}×${height}, ${bytes.length} bytes`);
  }
}
writeFileSync(resolve(artifacts, "examples-contact.jpg"), contact.toBuffer("image/jpeg", 90));

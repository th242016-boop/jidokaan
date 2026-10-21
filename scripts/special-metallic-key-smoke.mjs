// Loader isolation only: fresh in-memory keys/ciphertexts, no production secrets.
// Real session/access checks are covered by simulator-special-smoke.mjs.
import assert from "node:assert/strict";
import { createCipheriv, randomBytes } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import ts from "typescript";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const nativeRequire = createRequire(import.meta.url);
const keyNames = ["SIMULATOR_SPECIAL_ASSET_KEY", "SIMULATOR_SPECIAL_PATTERN_KEY", "SIMULATOR_SPECIAL_METALLIC_KEY"];
for (const name of keyNames) assert.equal(process.env[name], undefined, "Run this isolated fixture test without live keys");
const keys = keyNames.map(() => randomBytes(32));
const encrypted = {};
const filenames = new Set(await readdir(resolve(root, "src/lib/special-assets")));
for (const name of ["bronze", "pink-gold"]) for (const suffix of ["", "-swatch"]) filenames.add(`material-${name}${suffix}.enc`);
for (const filename of filenames) {
  if (!filename.endsWith(".enc")) continue;
  const keyIndex = /^material-(bronze|pink-gold)(-swatch)?\.enc$/.test(filename) ? 2 : filename.startsWith("material-") ? 1 : 0;
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", keys[keyIndex], iv);
  const body = Buffer.concat([cipher.update(Buffer.from(`fixture:${filename}`)), cipher.final()]);
  encrypted[`./special-assets/${filename}`] = Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64");
}
const modules = {};
const load = async name => {
  if (modules[name]) return modules[name].exports;
  const source = await readFile(resolve(root, `src/lib/${name}.ts`), "utf8");
  const prepared = name === "simulator-special.server"
    ? source.replace(/import\.meta\.glob<string>\([\s\S]*?\);/, "__qaEncrypted;") : source;
  if (name === "simulator-special.server") assert.notEqual(prepared, source);
  const code = ts.transpileModule(prepared, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const dependencies = {};
  for (const match of code.matchAll(/require\("(\.[^"]+)"\)/g)) {
    dependencies[match[1]] = match[1] === "./admin-auth.server"
      ? { assertSession: async token => { if (token !== "fixture-admin") throw Error("AUTH"); }, AUTH_HEADERS: { "cache-control": "no-store" } }
      : await load(match[1].slice(2));
  }
  const module = { exports: {} }; modules[name] = module;
  new Function("require", "module", "exports", "__qaEncrypted", code)(dependency => dependencies[dependency] ?? nativeRequire(dependency), module, module.exports, encrypted);
  return module.exports;
};
const api = await load("simulator-special.server");
const request = async (token = "fixture-admin") => api.handleSpecialRequest(new Request("http://fixture/api/simulator-special", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, action: "assets", model: "high" }),
}));
const payload = async () => { const response = await request(); assert.equal(response.status, 200); return response.json(); };
try {
  keyNames.slice(0, 2).forEach((name, i) => { process.env[name] = keys[i].toString("base64"); });
  const baseline = await payload(); assert.equal(Object.keys(baseline.patterns).length, 36);
  console.log("PASS missing metallic key preserves all 36 existing materials");
  process.env[keyNames[2]] = randomBytes(32).toString("base64");
  assert.deepEqual((await payload()).patterns, baseline.patterns);
  console.log("PASS wrong metallic key cannot disable established materials");
  process.env[keyNames[2]] = keys[2].toString("base64");
  const complete = await payload(); assert.equal(Object.keys(complete.patterns).length, 38);
  for (const [name, asset] of Object.entries(baseline.patterns)) assert.deepEqual(complete.patterns[name], asset);
  for (const name of ["BRONZE", "PINK GOLD"]) assert.match(complete.patterns[name].texture, /^data:image\/jpeg;base64,/);
  console.log("PASS correct separate key adds only BRONZE and PINK GOLD");
  encrypted["./special-assets/material-bronze.enc"] = "invalid-fixture-ciphertext";
  const partial = await payload(); assert.equal(Object.keys(partial.patterns).length, 37);
  assert.equal(partial.patterns.BRONZE, undefined); assert.deepEqual(partial.patterns["PINK GOLD"], complete.patterns["PINK GOLD"]);
  for (const [name, asset] of Object.entries(baseline.patterns)) assert.deepEqual(partial.patterns[name], asset);
  console.log("PASS one corrupt metallic asset leaves 37 other options intact");
  const anonymous = await request("fake"); assert.equal(anonymous.status, 401); assert.deepEqual(await anonymous.json(), { error: "AUTH" });
  delete process.env[keyNames[1]];
  const noPatternKey = await payload(); assert.deepEqual(noPatternKey.patterns, {}); assert.ok(Object.keys(noPatternKey.layers).length);
  console.log("PASS existing missing-pattern-key fallback and authentication boundary unchanged");
} finally { for (const name of keyNames) delete process.env[name]; }

// Exercise the real request handler/allowlist with isolated ciphertext fixtures.
// No production key, administrator session, network request or database is used.
import assert from "node:assert/strict";
import { createCipheriv, randomBytes } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import ts from "typescript";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const nativeRequire = createRequire(import.meta.url);
const keyNames = ["SIMULATOR_SPECIAL_ASSET_KEY", "SIMULATOR_SPECIAL_PATTERN_KEY", "SIMULATOR_SPECIAL_METALLIC_KEY", "SIMULATOR_REFERENCE_MATERIALS_20261021_KEY"];
for (const name of keyNames) assert.equal(process.env[name], undefined, "Run in isolation without live keys");
const keys = keyNames.map(() => randomBytes(32));
const encrypted = {};
const filenames = new Set(await readdir(resolve(root, "src/lib/special-assets")));
for (const name of ["reference-lizard", "reference-silver-weave", "gray-camo", "woodland-camo"])
  for (const suffix of ["", "-swatch"]) filenames.add(`material-${name}${suffix}.enc`);
for (const filename of filenames) {
  if (!filename.endsWith(".enc")) continue;
  const keyIndex = /^material-(reference-lizard|reference-silver-weave|gray-camo|woodland-camo)(-swatch)?\.enc$/.test(filename) ? 3
    : /^material-(bronze|pink-gold)(-swatch)?\.enc$/.test(filename) ? 2 : filename.startsWith("material-") ? 1 : 0;
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
  for (const match of code.matchAll(/require\("(\.[^"]+)"\)/g)) dependencies[match[1]] = match[1] === "./admin-auth.server"
    ? { assertSession: async token => { if (token !== "fixture-admin") throw Error("AUTH"); }, AUTH_HEADERS: { "cache-control": "no-store" } }
    : await load(match[1].slice(2));
  const module = { exports: {} }; modules[name] = module;
  new Function("require", "module", "exports", "__qaEncrypted", code)(dependency => dependencies[dependency] ?? nativeRequire(dependency), module, module.exports, encrypted);
  return module.exports;
};
const api = await load("simulator-special.server"), policy = await load("simulator-catalog");
const patterns = await load("special-patterns"), codec = await load("pattern-asset-wire");
const call = body => api.handleSpecialRequest(new Request("http://fixture/api/simulator-special", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
}));
const payload = async body => { const response = await call({ action: "assets", model: "high", ...body }); assert.equal(response.status, 200); assert.equal(response.headers.get("cache-control"), "no-store"); return response.json(); };
const assertPublic = result => {
  assert.equal(result.audience, "public"); assert.equal(result.swatch, undefined); assert.deepEqual(result.layers, {});
  assert.deepEqual(Object.keys(result.patterns).sort(), [...policy.PUBLIC_SPECIAL_PATTERNS].sort());
  for (const denied of ["FLOWER A", "GRAY CAMO", "WOODLAND CAMO", "FUTURE MATERIAL"]) assert.equal(result.patterns[denied], undefined);
};
try {
  keyNames.forEach((name, i) => { process.env[name] = keys[i].toString("base64"); });
  assert.equal(policy.PUBLIC_SPECIAL_PATTERNS.length, 45);
  for (const denied of ["FLOWER A", "GRAY CAMO", "WOODLAND CAMO", "FUTURE MATERIAL"]) assert.equal(policy.isPublicSpecialPattern(denied), false);
  for (const model of ["high", "mid"]) {
    const released = await payload({ audience: "public", model }); assertPublic(released);
    assert.equal(released.patternSources, undefined); assert.equal(released.patternRefs, undefined);
    const compact = await payload({ audience: "public", model, compact: true });
    assert.equal(compact.patterns, undefined);
    assert.equal(compact.patternSources.length, 10);
    assert.equal(Object.keys(compact.patternRefs).length, 45);
    assertPublic({ ...compact, patterns: codec.expandPatternAssets(compact) });
    assert.deepEqual(codec.expandPatternAssets(compact), released.patterns);
    assert.ok(JSON.stringify(compact).length < JSON.stringify(released).length);
    assert.deepEqual(codec.expandPatternAssets(released), released.patterns, "new client accepts legacy response");
    assert.deepEqual((await payload({ audience: "public", model, compact: "true" })).patterns, released.patterns, "only a boolean opt-in changes the wire format");
    for (const asset of compact.patternSources) assert.doesNotMatch(Buffer.from(asset.texture.split(",")[1], "base64").toString(), /gray-camo|woodland-camo|fixture:swatch/);
    const admin = await payload({ audience: "admin", token: "fixture-admin", model });
    assert.equal(admin.audience, "admin"); assert.ok(admin.swatch); assert.ok(Object.keys(admin.layers).length);
    const compactAdmin = await payload({ audience: "admin", token: "fixture-admin", model, compact: true });
    assert.deepEqual(codec.expandPatternAssets(compactAdmin), admin.patterns);
    assert.deepEqual(compactAdmin.layers, admin.layers); assert.equal(compactAdmin.swatch, admin.swatch);
    const expanded = codec.expandPatternAssets(compactAdmin);
    assert.equal(expanded["RED LIZARD"], expanded["BLACK SNAKE"], "decoded aliases share one source object");
    assert.equal(expanded["MATTE RED"], expanded["MATTE BLACK"]);
    for (const name of policy.PUBLIC_SPECIAL_PATTERNS) assert.deepEqual(admin.patterns[name], released.patterns[name]);
    for (const name of ["GRAY CAMO", "WOODLAND CAMO"]) {
      if (patterns.SPECIAL_PATTERNS.some(pattern => pattern.name === name)) assert.ok(admin.patterns[name], `${name} should be in the authenticated studio only`);
    }
  }
  const malformed = codec.expandPatternAssets({ patternSources: [{ texture: "source", swatch: "swatch" }], patternRefs: { "RED LIZARD": 0, "BLUE LIZARD": -1, "GREEN LIZARD": 10, "NAVY LIZARD": "0" } });
  assert.deepEqual(Object.keys(malformed), ["RED LIZARD"]);
  console.log("PASS legacy/compact round-trip, 45 public references in 10 sources, admin private catalog and invalid-reference rejection");
  // Removing FLOWER A's key and cipher must not affect any customer response.
  delete process.env.SIMULATOR_SPECIAL_ASSET_KEY;
  for (const name of Object.keys(encrypted)) if (!name.includes("/material-")) delete encrypted[name];
  assertPublic(await payload({ audience: "public" }));
  assertPublic(await payload({ audience: "public", token: "forged", admin: true, material: "FLOWER A" }));
  console.log("PASS public payload never depends on or exposes FLOWER A ciphertext");
  for (const body of [{}, { token: "forged" }, { audience: "admin", token: "forged" }, { audience: "ADMIN", admin: true }])
    assert.equal((await call({ action: "assets", model: "high", ...body })).status, 401);
  assert.equal((await call({ audience: "public", action: "assets", model: "../secret" })).status, 400);
  assert.equal((await call({ audience: "public", action: "publish", model: "high" })).status, 400);
  assert.equal((await call({ audience: "public", action: "ping" })).status, 200);
  console.log("PASS forged/admin/malformed requests cannot widen the released catalog");
  delete process.env.SIMULATOR_REFERENCE_MATERIALS_20261021_KEY;
  assertPublic(await payload({ audience: "public" }));
  process.env.SIMULATOR_REFERENCE_MATERIALS_20261021_KEY = randomBytes(32).toString("base64");
  assertPublic(await payload({ audience: "public" }));
  console.log("PASS missing or invalid optional reference key retains the released catalog");
} finally { for (const name of keyNames) delete process.env[name]; }

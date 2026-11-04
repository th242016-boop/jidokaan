// Exercise the admin-only request handler and retained subset filtering with isolated ciphertext fixtures.
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
const keyNames = ["SIMULATOR_SPECIAL_ASSET_KEY", "SIMULATOR_SPECIAL_PATTERN_KEY", "SIMULATOR_SPECIAL_METALLIC_KEY", "SIMULATOR_REFERENCE_MATERIALS_20261021_KEY", "SIMULATOR_SILVER_WEAVE_PHOTO_KEY", "SIMULATOR_BLACK_LIZARD_20261023_KEY", "SIMULATOR_BLACK_LIZARD_PLATES_KEY", "SIMULATOR_IVORY_ORNAMENT_KEY"];
for (const name of keyNames) assert.equal(process.env[name], undefined, "Run in isolation without live keys");
const keys = keyNames.map(() => randomBytes(32));
const encrypted = {};
const filenames = new Set(await readdir(resolve(root, "src/lib/special-assets")));
for (const photo of ["ivory-ornament", "gray-lizard", "silver-snake", "mint-gold-pearl", "wine-crocodile"])
  assert.ok(filenames.has(`material-${photo}-photo.enc`), "each private original photograph must be bundled");
for (const source of ["black-lizard-20261023", "black-lizard-plates"])
  for (const suffix of ["", "-swatch"])
    assert.ok(filenames.has(`material-${source}${suffix}.enc`), "independent black textures and swatches must be bundled");
for (const name of ["reference-lizard", "reference-silver-weave", "gray-camo", "woodland-camo"])
  for (const suffix of ["", "-swatch"]) filenames.add(`material-${name}${suffix}.enc`);
for (const filename of filenames) {
  if (!filename.endsWith(".enc")) continue;
  const keyIndex = /^material-(ivory-ornament|gray-lizard|silver-snake|mint-gold-pearl|wine-crocodile)-photo\.enc$/.test(filename) ? 7
    : /^material-black-lizard-plates(-swatch)?\.enc$/.test(filename) ? 6
    : /^material-black-lizard-20261023(-swatch)?\.enc$/.test(filename) ? 5
    : filename === "material-silver-weave-photo.enc" ? 4
    : /^material-(reference-lizard|reference-silver-weave|gray-camo|woodland-camo)(-swatch)?\.enc$/.test(filename) ? 3
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
const lizardNames = (await load("lizard-materials")).LIZARD_SURFACES.map(material => material.name);
assert.equal(lizardNames.length, 9);
const call = body => api.handleSpecialRequest(new Request("http://fixture/api/simulator-special", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
}));
const payload = async body => { const response = await call({ token: "fixture-admin", action: "assets", model: "high", ...body }); assert.equal(response.status, 200); assert.equal(response.headers.get("cache-control"), "no-store"); return response.json(); };
const assertPublic = result => {
  assert.equal(result.audience, "public"); assert.equal(result.swatch, undefined); assert.deepEqual(result.layers, {});
  assert.deepEqual(Object.keys(result.patterns).sort(), [...policy.PUBLIC_SPECIAL_PATTERNS].sort());
  for (const denied of ["FLOWER A", "GRAY CAMO", "WOODLAND CAMO", "IVORY ORNAMENT", "GRAY LIZARD", "SILVER SNAKE", "MINT GOLD PEARL", "WINE CROCODILE", "FUTURE MATERIAL"]) assert.equal(result.patterns[denied], undefined);
};
try {
  keyNames.forEach((name, i) => { process.env[name] = keys[i].toString("base64"); });
  assert.equal(policy.PUBLIC_SPECIAL_PATTERNS.length, 45);
  for (const denied of ["FLOWER A", "GRAY CAMO", "WOODLAND CAMO", "IVORY ORNAMENT", "GRAY LIZARD", "SILVER SNAKE", "MINT GOLD PEARL", "WINE CROCODILE", "FUTURE MATERIAL"]) assert.equal(policy.isPublicSpecialPattern(denied), false);
  for (const model of ["high", "mid"]) {
    const released = await payload({ audience: "public", model }); assertPublic(released);
    const black = released.patterns["BLACK SNAKE"];
    assert.equal(Buffer.from(black.texture.split(",")[1], "base64").toString(), "fixture:material-black-lizard-plates.enc");
    assert.equal(Buffer.from(black.swatch.split(",")[1], "base64").toString(), "fixture:material-black-lizard-plates-swatch.enc");
    assert.equal(black.sourceCrop, undefined);
    for (const name of lizardNames) assert.deepEqual(released.patterns[name], black, `${name} must use the same elongated scale texture and swatch`);
    const weave = released.patterns["SILVER WEAVE"];
    assert.equal(Buffer.from(weave.texture.split(",")[1], "base64").toString(), "fixture:material-silver-weave-photo.enc");
    assert.equal(weave.swatch, weave.texture);
    assert.deepEqual(weave.sourceCrop, [230 / 484, 340 / 860, 140 / 484, 140 / 860]);
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
    for (const asset of compact.patternSources) assert.doesNotMatch(Buffer.from(asset.texture.split(",")[1], "base64").toString(), /gray-camo|woodland-camo|ivory-ornament|gray-lizard|silver-snake|mint-gold-pearl|wine-crocodile|fixture:swatch/);
    const admin = await payload({ audience: "admin", token: "fixture-admin", model });
    assert.equal(admin.audience, "admin"); assert.ok(admin.swatch); assert.ok(Object.keys(admin.layers).length);
    assert.equal(Object.keys(admin.patterns).length, 52);
    const ornament = admin.patterns["IVORY ORNAMENT"];
    assert.ok(ornament, `${model}: the new material must be available to administrators`);
    assert.equal(Buffer.from(ornament.texture.split(",")[1], "base64").toString(), "fixture:material-ivory-ornament-photo.enc");
    assert.equal(ornament.swatch, ornament.texture, "the button and leather mapping must sample the same unmodified photograph");
    assert.deepEqual(ornament.sourceCrop, [180 / 832, 170 / 870, 360 / 832, 360 / 870]);
    const grayLizard = admin.patterns["GRAY LIZARD"];
    assert.ok(grayLizard, `${model}: the original gray lizard must be available to administrators`);
    assert.equal(Buffer.from(grayLizard.texture.split(",")[1], "base64").toString(), "fixture:material-gray-lizard-photo.enc");
    assert.equal(grayLizard.swatch, grayLizard.texture);
    assert.deepEqual(grayLizard.sourceCrop, [300 / 1153, 260 / 2048, 800 / 1153, 800 / 2048]);
    assert.notDeepEqual(grayLizard, admin.patterns["BLACK SNAKE"], "gray lizard is the supplied material, not a dye of the old black atlas");
    const silverSnake = admin.patterns["SILVER SNAKE"];
    assert.ok(silverSnake, `${model}: the supplied silver snake must be available to administrators`);
    assert.equal(Buffer.from(silverSnake.texture.split(",")[1], "base64").toString(), "fixture:material-silver-snake-photo.enc");
    assert.equal(silverSnake.swatch, silverSnake.texture, "silver snake swatch and panels sample one original photograph");
    assert.deepEqual(silverSnake.sourceCrop, [302 / 590, 177 / 831, 72 / 590, 72 / 831]);
    for (const name of ["NATURAL SNAKE", "BLACK SNAKE", "GRAY LIZARD"])
      assert.notDeepEqual(silverSnake, admin.patterns[name], "silver snake must not alias a different material's topology");
    const mintGoldPearl = admin.patterns["MINT GOLD PEARL"];
    assert.ok(mintGoldPearl, `${model}: mint gold pearl must be available to administrators`);
    assert.equal(Buffer.from(mintGoldPearl.texture.split(",")[1], "base64").toString(), "fixture:material-mint-gold-pearl-photo.enc");
    assert.equal(mintGoldPearl.swatch, mintGoldPearl.texture, "mint gold pearl swatch and panels sample the user's original photograph");
    const mintCrop = (await load("mint-gold-pearl-material")).MINT_GOLD_PEARL_CROP;
    assert.deepEqual(mintGoldPearl.sourceCrop, mintCrop);
    assert.ok(mintCrop.every(value => Number.isFinite(value) && value >= 0 && value <= 1));
    assert.ok(mintCrop[2] > 0 && mintCrop[3] > 0 && mintCrop[0] + mintCrop[2] <= 1 && mintCrop[1] + mintCrop[3] <= 1);
    for (const name of ["NATURAL SNAKE", "BLACK SNAKE", "GRAY LIZARD", "SILVER SNAKE", "PINK GOLD"])
      assert.notDeepEqual(mintGoldPearl, admin.patterns[name], "mint gold pearl must retain its own photographed topology");
    const wineCrocodile = admin.patterns["WINE CROCODILE"];
    assert.ok(wineCrocodile, `${model}: wine crocodile must be available to administrators`);
    assert.equal(Buffer.from(wineCrocodile.texture.split(",")[1], "base64").toString(), "fixture:material-wine-crocodile-photo.enc");
    assert.equal(wineCrocodile.swatch, wineCrocodile.texture, "wine crocodile swatch and panels sample the user's original photograph");
    const wineCrop = (await load("wine-crocodile-material")).WINE_CROCODILE_CROP;
    assert.deepEqual(wineCrocodile.sourceCrop, wineCrop);
    assert.ok(wineCrop.every(value => Number.isFinite(value) && value >= 0 && value <= 1));
    assert.ok(wineCrop[2] > 0 && wineCrop[3] > 0 && wineCrop[0] + wineCrop[2] <= 1 && wineCrop[1] + wineCrop[3] <= 1);
    for (const name of ["NATURAL SNAKE", "BLACK SNAKE", "GRAY LIZARD", "SILVER SNAKE", "MINT GOLD PEARL"])
      assert.notDeepEqual(wineCrocodile, admin.patterns[name], "wine crocodile must retain its own photographed scale topology");
    const compactAdmin = await payload({ audience: "admin", token: "fixture-admin", model, compact: true });
    assert.deepEqual(codec.expandPatternAssets(compactAdmin), admin.patterns);
    assert.deepEqual(compactAdmin.layers, admin.layers); assert.equal(compactAdmin.swatch, admin.swatch);
    const expanded = codec.expandPatternAssets(compactAdmin);
    assert.deepEqual(expanded["IVORY ORNAMENT"], ornament, "compact delivery preserves the exact hand-free source crop");
    assert.deepEqual(expanded["GRAY LIZARD"], grayLizard, "compact delivery preserves the mixed-shape gray source and its crop");
    assert.deepEqual(expanded["SILVER SNAKE"], silverSnake, "compact delivery preserves the silver snake photograph and source crop");
    assert.deepEqual(expanded["MINT GOLD PEARL"], mintGoldPearl, "compact delivery preserves mint gold pearl and its source crop");
    assert.deepEqual(expanded["WINE CROCODILE"], wineCrocodile, "compact delivery preserves wine crocodile and its source crop");
    for (const name of lizardNames)
      assert.equal(expanded[name], expanded["BLACK SNAKE"], "all nine lizard colors share one decoded atlas object");
    assert.equal(expanded["MATTE RED"], expanded["MATTE BLACK"]);
    for (const name of policy.PUBLIC_SPECIAL_PATTERNS) assert.deepEqual(admin.patterns[name], released.patterns[name]);
    for (const name of ["GRAY CAMO", "WOODLAND CAMO", "IVORY ORNAMENT", "GRAY LIZARD", "SILVER SNAKE", "MINT GOLD PEARL", "WINE CROCODILE"]) {
      if (patterns.SPECIAL_PATTERNS.some(pattern => pattern.name === name)) assert.ok(admin.patterns[name], `${name} should be in the authenticated studio only`);
    }
  }
  const withPrivatePhotos = await payload({ audience: "admin" });
  const priorReleasedPatterns = (await payload({ audience: "public" })).patterns;
  const expectOnlyPhotosUnavailable = async unavailable => {
    const expected = Object.fromEntries(Object.entries(withPrivatePhotos.patterns).filter(([name]) => !unavailable.includes(name)));
    for (const model of ["high", "mid"]) {
      const admin = await payload({ audience: "admin", model, compact: true });
      assert.deepEqual(codec.expandPatternAssets(admin), expected, "a failed photo must not change any unrelated material");
      assert.ok(admin.swatch); assert.ok(Object.keys(admin.layers).length, "FLOWER A remains available");
      for (const material of ["IVORY ORNAMENT", "GRAY LIZARD", "SILVER SNAKE", "MINT GOLD PEARL", "WINE CROCODILE"]) {
        const released = await payload({ audience: "public", model, material });
        assertPublic(released);
        assert.deepEqual(released.patterns, priorReleasedPatterns, "private asset failures cannot affect the retained subset");
      }
    }
  };
  const photographicMaterials = ["IVORY ORNAMENT", "GRAY LIZARD", "SILVER SNAKE", "MINT GOLD PEARL", "WINE CROCODILE"];
  delete process.env.SIMULATOR_IVORY_ORNAMENT_KEY;
  await expectOnlyPhotosUnavailable(photographicMaterials);
  process.env.SIMULATOR_IVORY_ORNAMENT_KEY = "invalid";
  await expectOnlyPhotosUnavailable(photographicMaterials);
  process.env.SIMULATOR_IVORY_ORNAMENT_KEY = randomBytes(32).toString("base64");
  await expectOnlyPhotosUnavailable(photographicMaterials);
  process.env.SIMULATOR_IVORY_ORNAMENT_KEY = keys[7].toString("base64");
  for (const [name, file] of [["IVORY ORNAMENT", "ivory-ornament"], ["GRAY LIZARD", "gray-lizard"], ["SILVER SNAKE", "silver-snake"], ["MINT GOLD PEARL", "mint-gold-pearl"], ["WINE CROCODILE", "wine-crocodile"]]) {
    const path = `./special-assets/material-${file}-photo.enc`;
    const ciphertext = encrypted[path];
    delete encrypted[path];
    await expectOnlyPhotosUnavailable([name]);
    const damaged = Buffer.from(ciphertext, "base64");
    damaged[damaged.length - 1] ^= 1;
    encrypted[path] = damaged.toString("base64");
    await expectOnlyPhotosUnavailable([name]);
    encrypted[path] = ciphertext;
  }
  assert.deepEqual((await payload({ audience: "admin" })).patterns, withPrivatePhotos.patterns);
  console.log("PASS private ornament/gray lizard/silver snake/mint gold pearl/wine crocodile photos, compact crops, shared photo-key failure and per-source missing/corrupt isolation on both models");
  const malformed = codec.expandPatternAssets({ patternSources: [{ texture: "source", swatch: "swatch" }], patternRefs: { "RED LIZARD": 0, "BLUE LIZARD": -1, "GREEN LIZARD": 10, "NAVY LIZARD": "0" } });
  assert.deepEqual(Object.keys(malformed), ["RED LIZARD"]);
  console.log("PASS legacy/compact round-trip, 45 public references in 10 sources, one shared lizard atlas, admin private catalog and invalid-reference rejection");
  const cropped = { "FLOWER B": { texture: "same", swatch: "same", sourceCrop: [0, 0, 0.5, 0.5] }, "FLOWER C": { texture: "same", swatch: "same", sourceCrop: [0.5, 0.5, 0.5, 0.5] } };
  assert.deepEqual(codec.expandPatternAssets(codec.compactPatternAssets(cropped)), cropped, "distinct source crops must not share an alias");
  delete process.env.SIMULATOR_SILVER_WEAVE_PHOTO_KEY;
  const fallbackWeave = (await payload({ audience: "public" })).patterns["SILVER WEAVE"];
  assert.equal(fallbackWeave.sourceCrop, undefined);
  assert.equal(Buffer.from(fallbackWeave.texture.split(",")[1], "base64").toString(), "fixture:material-reference-silver-weave.enc");
  process.env.SIMULATOR_SILVER_WEAVE_PHOTO_KEY = keys[4].toString("base64");
  console.log("PASS original-photo selection/crop, independent aliases and prior-source fallback");
  const preferredCatalog = (await payload({ audience: "public" })).patterns;
  // The preferred atlas must not depend on the retired reference keys. In
  // particular, colored lizards must not silently fall back while black works.
  delete process.env.SIMULATOR_BLACK_LIZARD_20261023_KEY;
  delete process.env.SIMULATOR_REFERENCE_MATERIALS_20261021_KEY;
  for (const model of ["high", "mid"]) {
    const independent = await payload({ audience: "public", model, compact: true });
    const expanded = codec.expandPatternAssets(independent);
    assertPublic({ ...independent, patterns: expanded });
    for (const name of lizardNames) assert.deepEqual(expanded[name], preferredCatalog[name]);
  }
  process.env.SIMULATOR_BLACK_LIZARD_20261023_KEY = keys[5].toString("base64");
  process.env.SIMULATOR_REFERENCE_MATERIALS_20261021_KEY = keys[3].toString("base64");
  console.log("PASS preferred lizard family remains available without either older reference key");
  const expectPlatesFallback = async () => {
    const result = await payload({ audience: "public", compact: true });
    assert.equal(result.patternSources.length, 11);
    const expanded = codec.expandPatternAssets(result);
    assertPublic({ ...result, patterns: expanded });
    assert.equal(Buffer.from(expanded["BLACK SNAKE"].texture.split(",")[1], "base64").toString(), "fixture:material-black-lizard-20261023.enc");
    assert.equal(Buffer.from(expanded["BLACK SNAKE"].swatch.split(",")[1], "base64").toString(), "fixture:material-black-lizard-20261023-swatch.enc");
    assert.notEqual(expanded["BLACK SNAKE"], expanded["WHITE SNAKE"]);
    const white = expanded["WHITE SNAKE"];
    assert.equal(Buffer.from(white.texture.split(",")[1], "base64").toString(), "fixture:material-reference-lizard.enc");
    assert.equal(Buffer.from(white.swatch.split(",")[1], "base64").toString(), "fixture:material-reference-lizard-swatch.enc");
    for (const name of lizardNames.filter(name => name !== "BLACK SNAKE"))
      assert.equal(expanded[name], white, `${name} must retain its complete shared-reference fallback`);
    for (const name of policy.PUBLIC_SPECIAL_PATTERNS) {
      if (!lizardNames.includes(name)) assert.deepEqual(expanded[name], preferredCatalog[name], `${name} must not change with the lizard atlas`);
    }
    for (const model of ["high", "mid"]) {
      const admin = await payload({ audience: "admin", token: "fixture-admin", model, compact: true });
      const adminPatterns = codec.expandPatternAssets(admin);
      for (const name of lizardNames) assert.deepEqual(adminPatterns[name], expanded[name], `${name} fallback must be identical for admin and public`);
    }
  };
  delete process.env.SIMULATOR_BLACK_LIZARD_PLATES_KEY;
  await expectPlatesFallback();
  process.env.SIMULATOR_BLACK_LIZARD_PLATES_KEY = "invalid";
  await expectPlatesFallback();
  process.env.SIMULATOR_BLACK_LIZARD_PLATES_KEY = randomBytes(32).toString("base64");
  await expectPlatesFallback();
  process.env.SIMULATOR_BLACK_LIZARD_PLATES_KEY = keys[6].toString("base64");
  for (const suffix of ["", "-swatch"]) {
    const filename = `./special-assets/material-black-lizard-plates${suffix}.enc`;
    const ciphertext = encrypted[filename];
    delete encrypted[filename];
    await expectPlatesFallback();
    const damaged = Buffer.from(ciphertext, "base64");
    damaged[damaged.length - 1] ^= 1;
    encrypted[filename] = damaged.toString("base64");
    await expectPlatesFallback();
    encrypted[filename] = ciphertext;
  }
  assert.deepEqual((await payload({ audience: "public" })).patterns, preferredCatalog);
  console.log("PASS all nine lizards prefer the elongated atlas; missing/invalid key and damaged pairs retain complete prior sources for public/admin and both models");
  // Exercise the existing fallback chain independently of the new preferred
  // source, so it cannot mask a regression in an older deployment's key setup.
  delete process.env.SIMULATOR_BLACK_LIZARD_PLATES_KEY;
  await expectPlatesFallback();
  const independentCatalog = (await payload({ audience: "public" })).patterns;
  const expectBlackFallback = async () => {
    const result = await payload({ audience: "public", compact: true });
    assert.equal(result.patternSources.length, 10);
    const expanded = codec.expandPatternAssets(result);
    assertPublic({ ...result, patterns: expanded });
    assert.equal(expanded["BLACK SNAKE"], expanded["WHITE SNAKE"]);
    assert.equal(Buffer.from(expanded["BLACK SNAKE"].texture.split(",")[1], "base64").toString(), "fixture:material-reference-lizard.enc");
    for (const name of policy.PUBLIC_SPECIAL_PATTERNS) {
      if (name !== "BLACK SNAKE") assert.deepEqual(expanded[name], independentCatalog[name], `${name} must not change with the independent black source`);
    }
  };
  delete process.env.SIMULATOR_BLACK_LIZARD_20261023_KEY;
  await expectBlackFallback();
  process.env.SIMULATOR_BLACK_LIZARD_20261023_KEY = "invalid";
  await expectBlackFallback();
  process.env.SIMULATOR_BLACK_LIZARD_20261023_KEY = randomBytes(32).toString("base64");
  await expectBlackFallback();
  process.env.SIMULATOR_BLACK_LIZARD_20261023_KEY = keys[5].toString("base64");
  for (const suffix of ["", "-swatch"]) {
    const filename = `./special-assets/material-black-lizard-20261023${suffix}.enc`;
    const ciphertext = encrypted[filename];
    delete encrypted[filename];
    await expectBlackFallback();
    const damaged = Buffer.from(ciphertext, "base64");
    damaged[damaged.length - 1] ^= 1;
    encrypted[filename] = damaged.toString("base64");
    await expectBlackFallback();
    encrypted[filename] = ciphertext;
  }
  assert.deepEqual((await payload({ audience: "public" })).patterns, independentCatalog);
  console.log("PASS independent black source missing/invalid key and missing/damaged pair fall back without changing other materials");
  // Removing FLOWER A's key and cipher must not affect an authenticated subset response.
  delete process.env.SIMULATOR_SPECIAL_ASSET_KEY;
  for (const name of Object.keys(encrypted)) if (!name.includes("/material-")) delete encrypted[name];
  assertPublic(await payload({ audience: "public" }));
  assertPublic(await payload({ audience: "public", admin: true, material: "FLOWER A" }));
  console.log("PASS public payload never depends on or exposes FLOWER A ciphertext");
  for (const audience of [undefined, "public", "admin", "ADMIN"]) {
    for (const token of [undefined, "", "forged"]) {
      for (const action of ["ping", "assets"]) {
        for (const material of ["MINT GOLD PEARL", "WINE CROCODILE"]) {
          const denied = await call({ audience, token, action, model: "high", admin: true, material });
          assert.equal(denied.status, 401, `${audience ?? "default"} ${action}/${material} rejects missing/forged credentials`);
          assert.equal(denied.headers.get("cache-control"), "no-store");
          assert.deepEqual(await denied.json(), { error: "AUTH" });
        }
      }
    }
  }
  assert.equal((await call({ token: "fixture-admin", audience: "public", action: "assets", model: "../secret" })).status, 400);
  assert.equal((await call({ token: "fixture-admin", audience: "public", action: "publish", model: "high" })).status, 400);
  assert.equal((await call({ token: "fixture-admin", audience: "public", action: "ping" })).status, 200);
  console.log("PASS all special API actions require administrator authentication, including public-audience requests");
  delete process.env.SIMULATOR_REFERENCE_MATERIALS_20261021_KEY;
  const noSharedReference = await payload({ audience: "public" });
  assertPublic(noSharedReference);
  assert.deepEqual(noSharedReference.patterns["BLACK SNAKE"], independentCatalog["BLACK SNAKE"]);
  process.env.SIMULATOR_REFERENCE_MATERIALS_20261021_KEY = randomBytes(32).toString("base64");
  const invalidSharedReference = await payload({ audience: "public" });
  assertPublic(invalidSharedReference);
  assert.deepEqual(invalidSharedReference.patterns["BLACK SNAKE"], independentCatalog["BLACK SNAKE"]);
  delete process.env.SIMULATOR_BLACK_LIZARD_20261023_KEY;
  const legacyBlack = await payload({ audience: "public" });
  assertPublic(legacyBlack);
  assert.equal(Buffer.from(legacyBlack.patterns["BLACK SNAKE"].texture.split(",")[1], "base64").toString(), "fixture:material-black-snake.enc");
  console.log("PASS missing or invalid optional reference key retains the released catalog");
} finally { for (const name of keyNames) delete process.env[name]; }

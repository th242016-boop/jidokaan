// Isolated authentication and asset checks. Never uses the production DB or session.
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const temp = await mkdtemp(resolve(tmpdir(), "jidokaan-special-test-"));
const oldCwd = process.cwd();
process.env.DATABASE_URL = "";
process.chdir(temp);
globalThis.fetch = async () => { throw new Error("OUTBOUND_NETWORK_BLOCKED"); };
const server = await createServer({ configFile: false, root,
  resolve: { alias: { "@": resolve(root, "src") } },
  server: { middlewareMode: true, hmr: false }, appType: "custom" });
let db;
let count = 0;
async function check(label, fn) { await fn(); count++; console.log(`PASS ${label}`); }
try {
  db = await server.ssrLoadModule("/src/lib/db.ts");
  const auth = await server.ssrLoadModule("/src/lib/admin-auth.server.ts");
  const api = await server.ssrLoadModule("/src/lib/simulator-special.server.ts");
  const special = await server.ssrLoadModule("/src/lib/simulator-special.ts");
  const sim = await server.ssrLoadModule("/src/lib/simulator-config.ts");
  const palette = await server.ssrLoadModule("/src/lib/mesh-laces.ts");
  const beads = await server.ssrLoadModule("/src/lib/bead-material.ts");
  const solids = await server.ssrLoadModule("/src/lib/special-solids.ts");
  const patterns = await server.ssrLoadModule("/src/lib/special-patterns.ts");
  const finishes = await server.ssrLoadModule("/src/lib/special-finishes.ts");
  const snakes = await server.ssrLoadModule("/src/lib/snake-materials.ts");
  const design = await server.ssrLoadModule("/src/lib/design-order.ts");
  const call = body => api.handleSpecialRequest(new Request("http://localhost/api/simulator-special", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  }));
  await check("anonymous, forged and malformed access never returns assets", async () => {
    for (const token of [undefined, "fake", "a".repeat(64)]) {
      const res = await call({ token, action: "assets", model: "high" });
      assert.equal(res.status, 401);
      assert.equal(res.headers.get("cache-control"), "no-store");
      assert.deepEqual(await res.json(), { error: "AUTH" });
    }
    assert.equal((await api.handleSpecialRequest(new Request("http://localhost/api/simulator-special"))).status, 401);
  });
  const token = await auth.createSession();
  await check("real session enables mode; no client flag grants access", async () => {
    assert.equal((await call({ token, action: "ping" })).status, 200);
    assert.equal((await call({ admin: true, action: "ping" })).status, 401);
    assert.equal((await call({ token, action: "assets", model: "../secret" })).status, 400);
  });
  await check("missing server key fails closed", async () => {
    const key = process.env.SIMULATOR_SPECIAL_ASSET_KEY;
    delete process.env.SIMULATOR_SPECIAL_ASSET_KEY;
    try { assert.equal((await call({ token, action: "assets", model: "high" })).status, 503); }
    finally { if (key) process.env.SIMULATOR_SPECIAL_ASSET_KEY = key; }
  });
  if (process.env.SIMULATOR_SPECIAL_ASSET_KEY) {
    await check("authenticated material payload has only supported model layers", async () => {
      for (const model of ["high", "mid"]) {
        const res = await call({ token, action: "assets", model });
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.deepEqual(Object.keys(body.layers), special.flowerPartsFor(model));
        if (process.env.SIMULATOR_SPECIAL_PATTERN_KEY) {
          assert.deepEqual(Object.keys(body.patterns).sort(), patterns.SPECIAL_PATTERNS.map(pattern => pattern.name).sort());
          for (const pattern of patterns.SPECIAL_PATTERNS) {
            assert.match(body.patterns[pattern.name].texture, /^data:image\/(png|jpeg|webp);base64,/);
            assert.match(body.patterns[pattern.name].swatch, /^data:image\/(png|jpeg|webp);base64,/);
          }
          for (const finish of finishes.SPECIAL_FINISHES) {
            const shared = finish.kind === "matte" ? "MATTE BLACK" : "BLACK SUEDE";
            assert.deepEqual(body.patterns[finish.name], body.patterns[shared], "All colors reuse the neutral material");
          }
          assert.deepEqual(body.patterns["WHITE SNAKE"], body.patterns["BLACK SNAKE"], "White snake shares protected scale topology");
          for (const snake of snakes.SNAKE_MATERIALS)
            assert.deepEqual(body.patterns[snake.name], body.patterns["NATURAL SNAKE"], "Natural and dyed snakes share the protected python topology");
          assert.notDeepEqual(body.patterns["NATURAL SNAKE"], body.patterns["BLACK SNAKE"], "Natural python is a separate material from the existing embossed snake");
        } else assert.deepEqual(body.patterns, {});
        for (const data of [body.swatch, ...Object.values(body.layers)]) {
          const png = Buffer.from(data.split(",")[1], "base64");
          assert.equal(png.subarray(1, 4).toString(), "PNG");
          assert.ok(!png.includes(Buffer.from("XML:com.adobe.xmp")));
        }
        if (process.env.SPECIAL_CLEAN_REFERENCE) {
          const source = await readFile(resolve(process.env.SPECIAL_CLEAN_REFERENCE, "jidokaan-flower-b.png"));
          assert.deepEqual(Buffer.from(body.layers.b.split(",")[1], "base64"), source);
        }
      }
    });
  }
  await check("floral drafts and ordinary order specifications stay separate", async () => {
    const normal = sim.defaultPartNames();
    const draft = { names: { ...normal }, flowers: {} };
    const floral = special.selectSpecial(draft, "b", "FLOWER A");
    assert.equal(floral.flowers.b, true);
    assert.deepEqual(normal, sim.defaultPartNames());
    assert.deepEqual(floral.names, normal);
    assert.deepEqual(special.specialOverrides(floral, { swatch: "swatch", layers: { b: "flower-b" } }), { b: "flower-b" });
    assert.deepEqual(special.specialOverrides(floral, null), {});
    const red = special.selectSpecial(floral, "b", "RED");
    assert.equal(red.flowers.b, false); assert.equal(red.names.b, "RED");
    assert.equal(design.completeDesign({ ...normal, b: "FLOWER A" }), null);
    assert.equal(design.completeDesign(red.names).b, "RED");
  });
  await check("stocked mesh and lace colors stay independent of each other and orders", async () => {
    assert.deepEqual(palette.LACE_COLORS, ["RED", "BLUE", "YELLOW", "WHITE", "BLACK", "HOT PINK", "GRAY", "GREEN"]);
    for (const model of ["high", "mid"]) {
      const normal = sim.defaultPartNames();
      const initial = { names: { ...normal, model }, flowers: {} };
      for (const mesh of palette.MESH_COLORS) for (const laces of palette.LACE_COLORS) {
        const a = special.selectMesh(initial, mesh);
        const b = special.selectLaces(a, laces);
        assert.equal(special.meshSelection(b), mesh);
        assert.equal(special.laceSelection(b), laces);
        assert.deepEqual(b.names, a.names);
        assert.ok(design.completeDesign(b.names));
        const c = special.selectMesh(b, "WHITE");
        assert.equal(special.laceSelection(c), laces);
        assert.equal(special.laceSelection(special.selectSpecial(b, "b", "BLUE")), laces);
      }
      assert.equal(special.selectLaces(initial, "GOLD"), initial);
      assert.equal(special.selectMesh(initial, "GOLD"), initial);
      assert.deepEqual(initial.names, { ...normal, model });
    }
  });
  await check("upper-window beads stay high-only and independent of mesh, laces and legacy L", async () => {
    assert.deepEqual(beads.BEAD_COLORS, ["GOLD", "SILVER", "RED", "ORANGE", "YELLOW", "GREEN", "BLUE", "NAVY", "PURPLE"]);
    const initial = { names: { ...sim.defaultPartNames(), model: "high" }, flowers: {} };
    assert.equal(special.beadSelection(initial), "NONE");
    for (const color of beads.BEAD_COLORS) {
      const selected = special.selectBeads(initial, color);
      assert.equal(special.beadSelection(selected), color);
      assert.deepEqual(selected.names, initial.names, "Beads never replace legacy linked names.l");
      assert.ok(design.completeDesign(selected.names));
      const mesh = special.selectMesh(selected, "RED");
      const laces = special.selectLaces(mesh, "BLUE");
      const finish = special.selectSpecial(laces, "f", "MATTE KHAKI");
      assert.equal(special.beadSelection(finish), color);
      assert.equal(special.meshSelection(finish), "RED");
      assert.equal(special.laceSelection(finish), "BLUE");
      assert.equal(finish.names.l, sim.linkedLColor(finish.names.d, "", finish.names.i, "", finish.names.a, "").name);
      const removed = special.selectBeads(finish, "NONE");
      assert.equal(special.beadSelection(removed), "NONE");
      assert.deepEqual(removed.names, finish.names);
      assert.deepEqual(removed.patterns, finish.patterns);
      const mid = { ...selected, names: { ...selected.names, model: "mid" } };
      assert.equal(special.beadSelection(mid), "NONE", "Stale high bead state cannot appear on mid");
      assert.equal(special.selectBeads(mid, color), mid);
    }
    assert.equal(special.selectBeads(initial, "PINK"), initial);
    assert.equal(special.selectBeads(initial, "WHITE"), initial);
    assert.equal(special.beadSelection(initial), "NONE");
  });
  await check("public AQUA is selectable, serializable and order-valid on every available leather panel", async () => {
    const mintIndex = sim.FULL_COLORS.findIndex(color => color.name === "MINT");
    assert.equal(sim.FULL_COLORS[mintIndex + 1].name, "AQUA");
    assert.notEqual(sim.colorByName("AQUA").color, sim.colorByName("MINT").color);
    for (const model of ["high", "mid"]) {
      const initial = { ...sim.defaultPartNames(), model };
      const supported = patterns.patternPartsFor(model);
      for (const part of supported) {
        const names = { ...initial, [part]: "AQUA" };
        names.l = sim.linkedLColor(names.d, "", names.i, "", names.a, "").name;
        const complete = design.completeDesign(JSON.parse(JSON.stringify(names)));
        assert.ok(complete, `${model} ${part}: AQUA ordinary order is complete`);
        assert.equal(complete[part], "AQUA");
        assert.match(design.designKey(complete), new RegExp(`${part}:AQUA`));
        const url = sim.photoLayerFor(part, "AQUA", names);
        assert.match(url, /aqua\.png/);
        const png = await readFile(resolve(root, "public", url.split("?")[0].slice(1)));
        assert.equal(png.subarray(1, 4).toString(), "PNG");
      }
      for (const part of ["a", "k"]) assert.equal(design.completeDesign({ ...initial, [part]: "AQUA" }), null);
      if (model === "mid") assert.equal(design.completeDesign({ ...initial, g: "AQUA" }), null);
    }
  });
  await check("special GRAY stays separate, replaces FLOWER, and follows hidden line linkage", async () => {
    for (const model of ["high", "mid"]) {
      const initial = { names: { ...sim.defaultPartNames(), model }, flowers: {} };
      const supported = solids.specialSolidPartsFor(model);
      assert.equal(supported.length, model === "high" ? 9 : 8);
      assert.equal(supported.includes("g"), model === "high");
      const layers = Object.fromEntries([...supported, "l"].map(part => [part, `gray-${part}`]));
      for (const part of supported) {
        const gray = special.selectSpecial(initial, part, "GRAY");
        assert.equal(gray.solids[part], "GRAY");
        assert.equal(special.specialSolidOverrides(gray, layers)[part], `gray-${part}`);
        assert.ok(design.completeDesign(gray.names));
        assert.equal(sim.photoLayerFor(part, "GRAY", initial.names), undefined);
        assert.equal(design.completeDesign({ ...initial.names, [part]: "GRAY" }), null);
        const red = special.selectSpecial(gray, part, "RED");
        assert.equal(red.solids[part], undefined);
        assert.equal(special.specialSolidOverrides(red, layers)[part], undefined);
      }
      for (const part of ["a", "k", "l", ...(model === "mid" ? ["g"] : [])])
        assert.equal(special.selectSpecial(initial, part, "GRAY"), initial);
      const grayB = special.selectSpecial(initial, "b", "GRAY");
      const floral = special.selectSpecial(grayB, "b", "FLOWER A");
      assert.equal(floral.solids.b, undefined); assert.equal(floral.flowers.b, true);
      const grayAgain = special.selectSpecial(floral, "b", "GRAY");
      assert.equal(grayAgain.flowers.b, false); assert.equal(grayAgain.solids.b, "GRAY");
      const grayI = special.selectSpecial(initial, "i", "GRAY");
      assert.equal(special.specialSolidOverrides(grayI, layers).l, "gray-l");
      const grayD = special.selectSpecial(grayI, "d", "GRAY");
      assert.equal(grayD.names.l, "WHITE");
      assert.equal(special.specialSolidOverrides(grayD, layers).l, undefined);
      assert.ok(design.completeDesign(grayD.names));
      const restored = special.selectSpecial(grayD, "d", "WHITE");
      assert.equal(special.specialSolidOverrides(restored, layers).l, "gray-l");
      assert.deepEqual(initial.names, { ...sim.defaultPartNames(), model });
    }
  });
  await check("new materials are model-safe, mutually exclusive, and never ordinary order colors", async () => {
    const requestedColors = ["RED", "ORANGE", "YELLOW", "GREEN", "BLUE", "NAVY", "PURPLE", "KHAKI", "PINK", "WHITE", "BLACK"];
    const requestedFinishes = [...requestedColors.map(color => `MATTE ${color}`), ...requestedColors.map(color => `${color} SUEDE`)];
    assert.deepEqual(finishes.SPECIAL_FINISHES.map(finish => finish.name), requestedFinishes);
    const requestedSnakes = ["NATURAL SNAKE", "HOT PINK SNAKE", "ORANGE SNAKE", "SKY BLUE SNAKE", "GREEN SNAKE", "YELLOW SNAKE"];
    assert.deepEqual(snakes.SNAKE_MATERIALS.map(snake => snake.name), requestedSnakes);
    assert.equal(patterns.SPECIAL_PATTERNS.length, 34);
    assert.deepEqual(new Set(patterns.SPECIAL_PATTERNS.map(pattern => pattern.name)), new Set(["FLOWER B", "FLOWER C", "BLACK SNAKE", "WHITE SNAKE", ...requestedSnakes, "SILVER WEAVE", "MICRO HOUNDSTOOTH", ...requestedFinishes]));
    for (const model of ["high", "mid"]) {
      const initial = { names: { ...sim.defaultPartNames(), model }, flowers: {} };
      const original = structuredClone(initial);
      const supported = patterns.patternPartsFor(model);
      assert.equal(supported.length, model === "high" ? 9 : 8);
      assert.equal(supported.includes("g"), model === "high");
      for (const { name } of patterns.SPECIAL_PATTERNS) {
        const allowed = patterns.patternPartsFor(model, name);
        assert.deepEqual(allowed, supported, `${model} ${name}: all existing leather panels`);
        for (const part of allowed) {
          const patterned = special.selectSpecial(initial, part, name);
          assert.equal(patterned.patterns[part], name);
          assert.equal(patterned.names[part], "WHITE");
          assert.equal(patterned.flowers[part], false);
          assert.equal(patterned.solids[part], undefined);
          assert.ok(design.completeDesign(patterned.names));
          assert.equal(sim.photoLayerFor(part, name, initial.names), undefined);
          assert.equal(design.completeDesign({ ...initial.names, [part]: name }), null);
          const gray = special.selectSpecial(patterned, part, "GRAY");
          assert.equal(gray.patterns[part], undefined);
          assert.equal(gray.solids[part], "GRAY");
          const patternedAgain = special.selectSpecial(gray, part, name);
          assert.equal(patternedAgain.solids[part], undefined);
          assert.equal(patternedAgain.patterns[part], name);
          const blue = special.selectSpecial(patternedAgain, part, "BLUE");
          assert.equal(blue.patterns[part], undefined);
          assert.equal(blue.names[part], "BLUE");
        }
        for (const part of "abcdefghijkl".split("").filter(part => !allowed.includes(part)))
          assert.equal(special.selectSpecial(initial, part, name), initial);
      }
      const patterned = special.selectSpecial(initial, "b", "FLOWER B");
      const flowerA = special.selectSpecial(patterned, "b", "FLOWER A");
      assert.equal(flowerA.patterns.b, undefined);
      assert.equal(flowerA.flowers.b, true);
      const flowerC = special.selectSpecial(flowerA, "b", "FLOWER C");
      assert.equal(flowerC.flowers.b, false);
      assert.equal(flowerC.patterns.b, "FLOWER C");
      const snake = special.selectSpecial(flowerC, "b", "BLACK SNAKE");
      assert.equal(snake.patterns.b, "BLACK SNAKE");
      const secondPart = special.selectSpecial(snake, "c", "FLOWER B");
      assert.equal(secondPart.patterns.b, "BLACK SNAKE");
      assert.equal(secondPart.patterns.c, "FLOWER B");
      for (const { name: finish } of finishes.SPECIAL_FINISHES) {
        const trial = special.selectSpecial(secondPart, "b", finish);
        assert.equal(trial.patterns.b, finish);
        assert.equal(trial.patterns.c, "FLOWER B");
        assert.equal(trial.flowers.b, false);
        assert.ok(design.completeDesign(trial.names));
        const floral = special.selectSpecial(trial, "b", "FLOWER A");
        assert.equal(floral.patterns.b, undefined);
        assert.equal(floral.flowers.b, true);
        const restored = special.selectSpecial(floral, "b", finish);
        assert.equal(restored.patterns.b, finish);
        assert.equal(restored.flowers.b, false);
        const black = special.selectSpecial(restored, "b", "BLACK");
        assert.equal(black.patterns.b, undefined);
        assert.equal(black.names.b, "BLACK");
        assert.equal(black.patterns.c, "FLOWER B");
        const mixed = special.selectSpecial(trial, "c", "YELLOW SUEDE");
        assert.equal(mixed.patterns.b, finish);
        assert.equal(mixed.patterns.c, "YELLOW SUEDE");
        const cWhite = special.selectSpecial(mixed, "c", "WHITE");
        assert.equal(cWhite.patterns.b, finish);
        assert.equal(cWhite.patterns.c, undefined);
        assert.equal(cWhite.names.c, "WHITE");
      }
      const redMesh = special.selectMesh(secondPart, "RED");
      const blueLaces = special.selectLaces(redMesh, "BLUE");
      assert.deepEqual(blueLaces.patterns, secondPart.patterns);
      assert.deepEqual(initial, original);
    }
  });
  await check("python dye families preserve tonal ordering and natural neutral relief", async () => {
    const mean = rgb => rgb.reduce((sum, channel) => sum + channel, 0) / 3;
    const samples = [25, 65, 110, 170, 225].map(value => [value, value, value]);
    for (const snake of snakes.SNAKE_MATERIALS) {
      const rendered = samples.map(rgb => snakes.snakeSurface(...rgb, snake.name));
      for (const rgb of rendered) {
        assert.equal(rgb.length, 3);
        for (const channel of rgb) assert.ok(Number.isFinite(channel) && channel >= 0 && channel <= 255);
      }
      for (let i = 1; i < rendered.length; i++)
        assert.ok(mean(rendered[i]) > mean(rendered[i - 1]), `${snake.name}: raised light scales cannot invert into dark cells`);
      const [r, g, b] = rendered[3];
      if (snake.name === "NATURAL SNAKE") assert.deepEqual(snakes.snakeSurface(130, 115, 90, snake.name), [130, 115, 90]);
      if (snake.name === "HOT PINK SNAKE") assert.ok(r > g * 1.4 && b > g * 1.1);
      if (snake.name === "ORANGE SNAKE") assert.ok(r > g * 1.25 && g > b * 1.25);
      if (snake.name === "SKY BLUE SNAKE") assert.ok(b > r * 1.25 && g > r * 1.1);
      if (snake.name === "GREEN SNAKE") assert.ok(g > r * 1.2 && g > b * 1.1);
      if (snake.name === "YELLOW SNAKE") assert.ok(r > b * 1.5 && g > b * 1.4);
    }
    assert.equal(snakes.snakeMaterialFor("BLACK SNAKE"), undefined);
    assert.equal(snakes.snakeMaterialFor("WHITE SNAKE"), undefined);
    assert.equal(snakes.snakeMaterialFor("SKY BLUE"), undefined);
  });
  await check("logout immediately revokes asset access on the server", async () => {
    await auth.destroySession(token);
    assert.equal((await call({ token, action: "ping" })).status, 401);
    assert.equal((await call({ token, action: "assets", model: "high" })).status, 401);
  });
  await check("expired session cannot fetch materials", async () => {
    const expired = await auth.createSession();
    const sql = await db.getSql();
    await sql.query("update admin_sessions set expires_at = now() - interval '1 second'");
    assert.equal((await call({ token: expired, action: "assets", model: "high" })).status, 401);
  });
  console.log(`${count} special checks passed (temporary database only).`);
} finally {
  await server.close();
  const instance = await globalThis.__pgliteInstanceV2__;
  await instance?.close();
  process.chdir(oldCwd); await rm(temp, { recursive: true, force: true });
}

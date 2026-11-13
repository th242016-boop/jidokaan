// Isolated A-material state regression. No production keys, sessions, or network.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";
import { createServer } from "vite";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key),
};
globalThis.window = { localStorage: globalThis.localStorage };
const server = await createServer({ configFile: false, root,
  resolve: { alias: { "@": resolve(root, "src") } },
  server: { middlewareMode: true, hmr: false }, appType: "custom" });
const plain = value => JSON.parse(JSON.stringify(value));
let checks = 0;
async function check(label, fn) { await fn(); checks++; console.log(`PASS ${label}`); }
try {
  const sim = await server.ssrLoadModule("/src/lib/simulator-config.ts");
  const special = await server.ssrLoadModule("/src/lib/simulator-special.ts");
  const mesh = await server.ssrLoadModule("/src/lib/mesh-laces.ts");
  const patterns = await server.ssrLoadModule("/src/lib/special-patterns.ts");
  const solids = await server.ssrLoadModule("/src/lib/special-solids.ts");
  const catalog = await server.ssrLoadModule("/src/lib/simulator-catalog.ts");
  const design = await server.ssrLoadModule("/src/lib/design-order.ts");
  const { useStore } = await server.ssrLoadModule("/src/lib/store.ts");

  await check("blue A is separate from leather patterns, ordinary colors and independent lace selection", () => {
    for (const model of ["high", "mid"]) {
      const base = special.selectLaces(special.selectMesh(special.createWhiteSpecialDraft(model), "BLACK"), "RED");
      const before = plain(base);
      const patterned = special.selectMeshPattern(base, "BLUE LEOPARD");
      assert.equal(patterned.meshPattern, "BLUE LEOPARD");
      assert.equal(special.laceSelection(patterned), "RED");
      assert.equal(patterned.patterns?.a, undefined);
      assert.ok(design.completeDesign(patterned.names), "Pattern must retain an order-valid ordinary backing layer");
      assert.notEqual(patterned.names.a, "BLUE LEOPARD");
      assert.deepEqual(plain(base), before, "Selecting fabric must not mutate the previous draft");
      for (const laces of mesh.LACE_COLORS) {
        const next = special.selectLaces(patterned, laces);
        assert.equal(next.meshPattern, "BLUE LEOPARD");
        assert.equal(special.laceSelection(next), laces);
        assert.deepEqual(next.names, patterned.names);
      }
      for (const color of mesh.MESH_COLORS) {
        const next = special.selectMesh(patterned, color);
        assert.equal(next.meshPattern, undefined, "Solid A color replaces the fabric");
        assert.equal(special.meshSelection(next), color);
        assert.equal(special.laceSelection(next), "RED");
      }
      assert.equal(special.selectMeshPattern(base, "FLOWER B"), base, "Only BLUE LEOPARD is enabled for A");
      assert.equal(special.selectMeshPattern(base, "MATTE BLACK"), base);
      assert.equal(special.selectMeshPattern(base, "unknown"), base);
      assert.equal(special.selectSpecial(base, "a", "BLUE LEOPARD"), base, "Leather selector cannot bypass A's separate path");
    }
  });

  await check("A fabric preserves beads, model, other leather choices and legacy L rules", () => {
    for (const model of ["high", "mid"]) for (const d of ["WHITE", "BLACK", "RED"]) {
      let base = special.createWhiteSpecialDraft(model);
      base = special.selectSpecial(base, "d", d);
      base = special.selectSpecial(base, "i", "GOLD");
      base = special.selectSpecial(base, "b", "BLUE LEOPARD");
      base = special.selectSpecial(base, "c", "IVORY");
      base = special.selectBeads(base, "SILVER");
      const next = special.selectMeshPattern(base, "BLUE LEOPARD");
      assert.equal(sim.modelOf(next.names), model);
      assert.equal(next.patterns.b, "BLUE LEOPARD");
      assert.equal(next.solids.c, "IVORY");
      assert.equal(special.beadSelection(next), model === "high" ? "SILVER" : "NONE");
      assert.equal(next.names.l, sim.linkedLColor(next.names.d, "", next.names.i, "", next.names.a, "").name);
      assert.ok(!patterns.patternPartsFor(model, "BLUE LEOPARD").includes("a"));
      if (model === "mid") assert.ok(!patterns.patternPartsFor(model).includes("g"));
      assert.equal(special.createWhiteSpecialDraft(model).meshPattern, undefined);
    }
  });

  // The actual Special controller runs; only rendering, network and React's
  // scheduling are isolated so model/auth/reset races can be reproduced.
  let active;
  const equalDeps = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const React = {
    useRef(initial) { const i = active.index++; return active.slots[i] ??= { current: initial }; },
    useState(initial) {
      const owner = active, i = owner.index++;
      if (!(i in owner.slots)) owner.slots[i] = typeof initial === "function" ? initial() : initial;
      return [owner.slots[i], value => {
        const next = typeof value === "function" ? value(owner.slots[i]) : value;
        if (!Object.is(owner.slots[i], next)) { owner.slots[i] = next; owner.dirty = true; }
      }];
    },
    useCallback(fn, deps) {
      const i = active.index++, previous = active.slots[i];
      if (!previous || !equalDeps(previous.deps, deps)) active.slots[i] = { fn, deps };
      return active.slots[i].fn;
    },
    useEffect(effect, deps) {
      const i = active.index++, previous = active.slots[i];
      if (!previous || !equalDeps(previous.deps, deps)) active.effects.push(() => {
        previous?.cleanup?.(); active.slots[i] = { deps, cleanup: effect() };
      });
    },
  };
  const listeners = new Map();
  const listen = (name, fn) => { const list = listeners.get(name) ?? new Set(); list.add(fn); listeners.set(name, list); };
  const unlisten = (name, fn) => listeners.get(name)?.delete(fn);
  const dispatch = name => [...(listeners.get(name) ?? [])].forEach(fn => fn());
  let authenticated = true, assetAvailable = true, renderStatus = "ready";
  let renderInputs;
  const dependencies = {
    react: React, sonner: { toast: { error() {} } },
    "./admin-session": { ADMIN_SESSION_EVENT: "session-change", readAdminToken: () => authenticated ? "test-admin" : "" },
    "./simulator-config": sim, "./simulator-special": special, "./mesh-laces": mesh,
    "./special-patterns": patterns, "./special-solids": solids, "./simulator-catalog": catalog,
    "./design-order": design,
    "./pattern-asset-wire": { expandPatternAssets: data => data.patterns },
    "./use-mesh-laces": { useMeshLaces: (enabled, model, color, laces, beads, pattern) => {
      renderInputs = { enabled, model, color, laces, beads, pattern };
      const pending = Boolean(pattern) && renderStatus === "loading";
      const failed = Boolean(pattern) && renderStatus === "failed";
      return { ready: enabled, failed: false, loading: false,
        patternReady: !pattern || renderStatus === "ready", patternFailed: failed, patternLoading: pending,
        renderReady: enabled && !pending && !failed,
        layer: enabled && !pending && !failed ? (pattern ? "blue-A-layer" : "solid-A-layer") : undefined };
    } },
    "./use-special-solids": { useSpecialSolids: enabled => ({ ready: enabled, loading: false, failed: false, layers: {} }) },
    "./use-special-patterns": { useSpecialPatterns: enabled => ({ ready: enabled, loading: false, failed: false, layers: {} }) },
  };
  const source = await readFile(resolve(root, "src/lib/use-special-simulator.ts"), "utf8");
  const compiled = ts.transpileModule(source,
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports,
    require: id => { if (!(id in dependencies)) throw new Error(`Unexpected dependency: ${id}`); return dependencies[id]; },
    AbortController, clearInterval() {}, BroadcastChannel: undefined,
    window: { addEventListener: listen, removeEventListener: unlisten, setInterval: () => 1 },
    document: { hidden: false, addEventListener: listen, removeEventListener: unlisten },
    fetch: async (_url, request) => {
      const body = JSON.parse(request.body);
      const ok = authenticated || body.shareToken === "test-share";
      return { ok, status: ok ? 200 : 401,
        json: async () => ({ audience: body.shareToken ? "shared" : "admin", layers: {},
          patterns: assetAvailable ? { "BLUE LEOPARD": { texture: "test-blue-tile", swatch: "test-blue-swatch" } } : {} }) };
    },
  });
  function createHarness(model = "high", shareToken) {
    return { index: 0, slots: [], effects: [], dirty: true,
      props: [model, { ...sim.defaultPartNames(), ...(model === "mid" ? { model } : {}) }, shareToken], result: null,
      render() { active = this; this.index = 0; this.effects = []; this.dirty = false; this.result = module.exports.useSpecialSimulator(...this.props); },
      async settle() {
        for (let i = 0; i < 20; i++) {
          if (this.dirty) { this.render(); for (const effect of this.effects) { active = this; effect(); } }
          await new Promise(resolve => setImmediate(resolve));
          if (!this.dirty) return;
        }
        throw new Error("Hook did not settle");
      },
      async call(method, ...args) { const result = this.result[method](...args); await this.settle(); return result; },
      dispose() { for (const slot of this.slots) slot?.cleanup?.(); },
    };
  }
  const hook = createHarness();
  await hook.settle(); await hook.call("toggle");
  const visible = result => plain({ names: result.names, flowers: result.flowers, solids: result.solids,
    patterns: result.patterns, mesh: result.mesh, meshPattern: result.meshPattern, laces: result.laces, beads: result.beads });

  await check("admin A selection uses protected asset without changing public store or cart", async () => {
    const ordinary = useStore.getState(), saved = new Map(storage);
    await hook.call("selectLaces", "HOT PINK");
    await hook.call("selectMeshPattern", "BLUE LEOPARD");
    assert.equal(hook.result.meshPattern, "BLUE LEOPARD");
    assert.equal(hook.result.laces, "HOT PINK");
    assert.equal(renderInputs.pattern?.name, "BLUE LEOPARD");
    assert.equal(renderInputs.pattern.asset.texture, "test-blue-tile");
    assert.equal(hook.result.overrides.a, "blue-A-layer");
    assert.equal(hook.result.previewReady, true);
    assert.equal(useStore.getState(), ordinary);
    assert.deepEqual(storage, saved);
    const before = visible(hook.result);
    await hook.call("selectMeshPattern", "FLOWER B");
    assert.deepEqual(visible(hook.result), before);
  });

  await check("recommendation replaces A fabric and undo restores fabric with its separate lace color", async () => {
    const before = visible(hook.result), snapshot = hook.result.snapshotDraft();
    assert.ok(snapshot);
    assert.equal(await hook.call("applyRecommendation", sim.defaultPartNames(), "GREEN", "YELLOW"), true);
    assert.equal(hook.result.meshPattern, undefined);
    assert.equal(hook.result.mesh, "GREEN");
    assert.equal(hook.result.laces, "YELLOW");
    assert.equal(await hook.call("restoreDraft", snapshot), true);
    assert.deepEqual(visible(hook.result), before);
  });

  await check("model switches keep independent A choices and no G is introduced on mid", async () => {
    hook.props = ["mid", { ...sim.defaultPartNames(), model: "mid" }, undefined]; hook.dirty = true; await hook.settle();
    assert.equal(hook.result.meshPattern, undefined);
    await hook.call("selectMeshPattern", "BLUE LEOPARD");
    await hook.call("selectLaces", "GREEN");
    assert.equal(hook.result.meshPattern, "BLUE LEOPARD");
    assert.equal(hook.result.laces, "GREEN");
    assert.equal(hook.result.beads, "NONE");
    assert.ok(!patterns.patternPartsFor("mid").includes("g"));
    hook.props = ["high", sim.defaultPartNames(), undefined]; hook.dirty = true; await hook.settle();
    assert.equal(hook.result.meshPattern, "BLUE LEOPARD");
    assert.equal(hook.result.laces, "HOT PINK");
  });

  await check("pending or failed fabric render cannot be exported, and reset returns white immediately", async () => {
    renderStatus = "loading"; hook.dirty = true; await hook.settle();
    assert.equal(hook.result.previewReady, false);
    renderStatus = "failed"; hook.dirty = true; await hook.settle();
    assert.equal(hook.result.previewReady, false);
    await hook.call("reset");
    assert.equal(hook.result.meshPattern, undefined);
    assert.equal(hook.result.mesh, "WHITE");
    assert.equal(hook.result.laces, "WHITE");
    assert.equal(hook.result.beads, "NONE");
    assert.equal(hook.result.previewReady, true);
    assert.equal(hook.result.overrides.a, "solid-A-layer");
    renderStatus = "ready";
  });

  await check("logout clears private A selection and stale controls cannot reintroduce it", async () => {
    await hook.call("selectMeshPattern", "BLUE LEOPARD");
    const stale = hook.result;
    authenticated = false; dispatch("session-change");
    stale.selectMeshPattern("BLUE LEOPARD");
    await hook.settle();
    assert.equal(hook.result.enabled, false);
    assert.equal(hook.result.meshPattern, undefined);
    assert.equal(hook.result.overrides.a, undefined);
    hook.dispose();
  });

  await check("shared link gets A fabric while anonymous or missing-asset sessions cannot select it", async () => {
    const shared = createHarness("mid", "test-share");
    await shared.settle();
    assert.equal(shared.result.canUsePrivateCatalog, true);
    await shared.call("selectMeshPattern", "BLUE LEOPARD");
    assert.equal(shared.result.meshPattern, "BLUE LEOPARD");
    shared.dispose();
    const anonymous = createHarness(); await anonymous.settle();
    await anonymous.call("selectMeshPattern", "BLUE LEOPARD");
    assert.equal(anonymous.result.enabled, false);
    assert.equal(anonymous.result.meshPattern, undefined);
    anonymous.dispose();
    authenticated = true; assetAvailable = false;
    const missing = createHarness(); await missing.settle(); await missing.call("toggle");
    await missing.call("selectMeshPattern", "BLUE LEOPARD");
    assert.equal(missing.result.meshPattern, undefined);
    missing.dispose();
  });
  console.log(`${checks} blue-leopard A state checks passed`);
} finally {
  await server.close(); delete globalThis.localStorage; delete globalThis.window;
}

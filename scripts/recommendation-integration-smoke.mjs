// State-boundary regression checks. No production credentials, assets or network.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";
import { createServer } from "vite";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const memory = new Map();
globalThis.localStorage = {
  getItem: key => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
  removeItem: key => memory.delete(key),
};
globalThis.window = { localStorage: globalThis.localStorage };
const server = await createServer({ configFile: false, root,
  resolve: { alias: { "@": resolve(root, "src") } },
  server: { middlewareMode: true, hmr: false }, appType: "custom" });

let checks = 0;
async function check(label, fn) { await fn(); checks++; console.log(`PASS ${label}`); }
const plain = value => JSON.parse(JSON.stringify(value));
try {
  const sim = await server.ssrLoadModule("/src/lib/simulator-config.ts");
  const design = await server.ssrLoadModule("/src/lib/design-order.ts");
  const special = await server.ssrLoadModule("/src/lib/simulator-special.ts");
  const mesh = await server.ssrLoadModule("/src/lib/mesh-laces.ts");
  const solids = await server.ssrLoadModule("/src/lib/special-solids.ts");
  const patterns = await server.ssrLoadModule("/src/lib/special-patterns.ts");
  const catalog = await server.ssrLoadModule("/src/lib/simulator-catalog.ts");
  const { useStore } = await server.ssrLoadModule("/src/lib/store.ts");
  const red = { ...sim.defaultPartNames(), b: "RED", d: "BLUE" };
  red.l = sim.linkedLColor(red.d, "", red.i, "", red.a, "").name;

  await check("atomic ordinary apply preserves sizing, market, cart and inactive model", () => {
    useStore.getState().setDraftModel("mid");
    useStore.getState().setPartColor("b", "#1546c4", "BLUE");
    useStore.getState().setDraftModel("high");
    useStore.getState().setDraftSize("245");
    useStore.getState().setDraftFit("women");
    useStore.getState().applyMarket("ja", "USD");
    useStore.getState().addCustomBoot(1, false);
    const before = useStore.getState();
    const events = [];
    const unsubscribe = useStore.subscribe(state => events.push(state));
    assert.equal(useStore.getState().setDraftDesign(red), true);
    unsubscribe();
    const after = useStore.getState();
    assert.equal(events.length, 1);
    assert.deepEqual(after.draftPartNames, red);
    assert.deepEqual(after.draftParts, design.designColors(red));
    assert.equal(after.cart, before.cart);
    assert.equal(after.modelDrafts.mid, before.modelDrafts.mid);
    assert.equal(after.draftSize, "245");
    assert.equal(after.draftFit, "women");
    assert.equal(after.locale, "ja");
    assert.equal(after.currency, "USD");
    assert.deepEqual(after.modelDrafts.high.names, red);
  });
  await check("invalid palette, broken hidden linkage and stale model are rejected", () => {
    const before = useStore.getState();
    for (const invalid of [
      { ...red, a: "RED" }, { ...red, b: "GRAY" }, { ...red, l: "GOLD" },
      { ...red, model: "mid" }, { ...red, model: "low" },
    ]) assert.equal(useStore.getState().setDraftDesign(invalid), false);
    assert.equal(useStore.getState(), before);
  });
  await check("recommended design persists and checkout receives same model and colors", () => {
    useStore.getState().addCustomBoot(1, false);
    const item = useStore.getState().cart.at(-1);
    assert.deepEqual(item.partNames, red);
    assert.deepEqual(item.partColors, design.designColors(red));
    assert.equal(item.size, "245");
    assert.equal(item.sizeFit, "women");
    assert.deepEqual(JSON.parse(memory.get("jidokaan-store-v32")).state.draftPartNames, red);
    useStore.getState().setDraftModel("mid");
    const mid = { ...red, model: "mid", g: "WHITE" };
    assert.equal(useStore.getState().setDraftDesign(mid), true);
    useStore.getState().addCustomBoot(1, false);
    assert.equal(useStore.getState().cart.at(-1).productId, "drone-mid");
    assert.deepEqual(useStore.getState().cart.at(-1).partNames, mid);
  });

  // Run the real hook with a small deterministic hook scheduler. Rendering/asset
  // hooks are stubbed; the actual auth effects, mutation guards and draft logic run.
  let active;
  const equalDeps = (left, right) => left && right && left.length === right.length && left.every((v, i) => Object.is(v, right[i]));
  const React = {
    useRef(initial) {
      const index = active.index++;
      return active.slots[index] ??= { current: initial };
    },
    useState(initial) {
      const owner = active, index = owner.index++;
      if (!(index in owner.slots)) owner.slots[index] = typeof initial === "function" ? initial() : initial;
      return [owner.slots[index], value => {
        const next = typeof value === "function" ? value(owner.slots[index]) : value;
        if (!Object.is(owner.slots[index], next)) { owner.slots[index] = next; owner.dirty = true; }
      }];
    },
    useCallback(fn, deps) {
      const index = active.index++, previous = active.slots[index];
      if (!previous || !equalDeps(previous.deps, deps)) active.slots[index] = { fn, deps };
      return active.slots[index].fn;
    },
    useEffect(effect, deps) {
      const index = active.index++, previous = active.slots[index];
      if (!previous || !equalDeps(previous.deps, deps)) {
        active.effects.push(() => {
          previous?.cleanup?.();
          active.slots[index] = { deps, cleanup: effect() };
        });
      }
    },
  };
  const listeners = new Map();
  const listen = (name, fn) => { const values = listeners.get(name) ?? new Set(); values.add(fn); listeners.set(name, values); };
  const unlisten = (name, fn) => listeners.get(name)?.delete(fn);
  const dispatch = name => [...(listeners.get(name) ?? [])].forEach(fn => fn());
  let authenticated = true;
  const dependencies = {
    react: React, sonner: { toast: { error() {} } },
    "./admin-session": { ADMIN_SESSION_EVENT: "session-change", readAdminToken: () => authenticated ? "test-admin" : "" },
    "./simulator-config": sim, "./simulator-special": special, "./mesh-laces": mesh,
    "./special-solids": solids, "./special-patterns": patterns, "./simulator-catalog": catalog,
    "./design-order": design,
    "./pattern-asset-wire": { expandPatternAssets: data => data.patterns },
    "./use-mesh-laces": { useMeshLaces: enabled => ({ ready: enabled, loading: false, failed: false, layer: enabled ? "mesh-layer" : undefined }) },
    "./use-special-solids": { useSpecialSolids: enabled => ({ ready: enabled, loading: false, failed: false, layers: {} }) },
    "./use-special-patterns": { useSpecialPatterns: enabled => ({ ready: enabled, loading: false, failed: false, layers: {} }) },
  };
  const compiled = ts.transpileModule(await readFile(resolve(root, "src/lib/use-special-simulator.ts"), "utf8"),
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
      return { ok: authenticated || Boolean(body.shareToken), status: authenticated ? 200 : 401,
        json: async () => ({ audience: body.shareToken ? "shared" : "admin",
          layers: { b: "flower-b", c: "flower-c" },
          patterns: { "FLOWER B": { texture: "pattern-texture", swatch: "pattern-swatch" } } }) };
    },
  });
  function createHarness() {
    return {
      index: 0, slots: [], effects: [], dirty: true,
      props: ["high", sim.defaultPartNames(), undefined], result: null,
      render() { active = this; this.index = 0; this.effects = []; this.dirty = false; this.result = module.exports.useSpecialSimulator(...this.props); },
      async settle() {
        for (let iteration = 0; iteration < 15; iteration++) {
          if (this.dirty) { this.render(); for (const effect of this.effects) { active = this; effect(); } }
          await new Promise(resolve => setImmediate(resolve));
          if (!this.dirty) return;
        }
        throw new Error("Hook did not settle");
      },
      async call(method, ...args) { const result = this.result[method](...args); await this.settle(); return result; },
    };
  }
  const hook = createHarness();
  await hook.settle();
  assert.equal(hook.result.snapshotDraft(), null);
  await hook.call("toggle");
  assert.equal(hook.result.assetsReady, true);
  const visibleDraft = result => plain({ names: result.names, flowers: result.flowers, solids: result.solids,
    patterns: result.patterns, mesh: result.mesh, laces: result.laces, beads: result.beads });

  await check("special recommendation atomically replaces material maps and keeps proper mesh backing", async () => {
    await hook.call("select", "b", "FLOWER A");
    await hook.call("select", "c", "FLOWER B");
    await hook.call("select", "d", "GRAY");
    await hook.call("selectMesh", "GREEN");
    await hook.call("selectLaces", "RED");
    await hook.call("selectBeads", "GOLD");
    const before = visibleDraft(hook.result);
    const snapshot = hook.result.snapshotDraft();
    assert.ok(snapshot);
    assert.deepEqual(Object.keys(snapshot), [], "Snapshot does not expose private draft fields");
    assert.equal(await hook.call("applyRecommendation", red, "NAVY", "YELLOW"), true);
    assert.equal(hook.result.mesh, "NAVY");
    assert.equal(hook.result.laces, "YELLOW");
    assert.equal(hook.result.beads, "NONE");
    assert.equal(hook.result.names.a, "WHITE");
    assert.ok(design.completeDesign(hook.result.names));
    assert.deepEqual(plain(hook.result.solids), {});
    assert.deepEqual(plain(hook.result.patterns), {});
    assert.ok(!Object.values(hook.result.flowers).some(Boolean));
    assert.equal(await hook.call("restoreDraft", snapshot), true);
    assert.deepEqual(visibleDraft(hook.result), before, "Undo restores every special selection exactly");
    assert.equal(await hook.call("restoreDraft", {}), false, "Foreign handles cannot restore a draft");
  });
  await check("special rejects invalid palette and cross-model recommendations without mutations", async () => {
    const before = visibleDraft(hook.result);
    for (const [names, meshColor, laceColor] of [
      [{ ...red, model: "mid" }, "WHITE", "WHITE"], [red, "GOLD", "WHITE"],
      [red, "WHITE", "ORANGE"], [{ ...red, b: "GRAY" }, "WHITE", "WHITE"],
    ]) assert.equal(await hook.call("applyRecommendation", names, meshColor, laceColor), false);
    assert.deepEqual(visibleDraft(hook.result), before);
  });
  await check("old callbacks and undo handles cannot cross model or mode changes", async () => {
    const stale = hook.result, snapshot = stale.snapshotDraft();
    hook.props = ["mid", { ...sim.defaultPartNames(), model: "mid" }, undefined]; hook.dirty = true;
    await hook.settle();
    assert.equal(stale.applyRecommendation(red, "WHITE", "WHITE"), false);
    assert.equal(hook.result.restoreDraft(snapshot), false);
    const mid = { ...red, model: "mid", g: "WHITE" };
    assert.equal(await hook.call("applyRecommendation", mid, "BLACK", "RED"), true);
    assert.equal(hook.result.names.a, "BLACK");
    assert.equal(hook.result.names.l, "BLACK");
    assert.equal(hook.result.beads, "NONE");
    const beforeToggle = hook.result, modeSnapshot = beforeToggle.snapshotDraft();
    beforeToggle.toggle();
    assert.equal(beforeToggle.applyRecommendation(mid, "WHITE", "WHITE"), false, "Mode change invalidates callbacks synchronously");
    await hook.settle(); await hook.call("toggle");
    assert.equal(hook.result.restoreDraft(modeSnapshot), false);
  });
  await check("auth clear invalidates in-flight callbacks and snapshots before rerender", async () => {
    const stale = hook.result, snapshot = stale.snapshotDraft();
    authenticated = false;
    dispatch("session-change");
    assert.equal(stale.restoreDraft(snapshot), false);
    assert.equal(stale.applyRecommendation({ ...red, model: "mid" }, "WHITE", "WHITE"), false);
    await hook.settle();
    assert.equal(hook.result.available, false);
    assert.equal(hook.result.enabled, false);
    assert.equal(hook.result.snapshotDraft(), null);
  });
  console.log(`${checks} recommendation integration checks passed`);
} finally {
  await server.close();
  delete globalThis.localStorage;
  delete globalThis.window;
}

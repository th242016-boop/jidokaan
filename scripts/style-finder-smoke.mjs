// Real wizard handlers + recommendation engine with deterministic React/Image
// adapters. Browser focus/layout are checked separately in the preview.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";
import { createServer } from "vite";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const server = await createServer({ configFile: false, root,
  resolve: { alias: { "@": resolve(root, "src") } },
  server: { middlewareMode: true, hmr: false }, appType: "custom" });
let checks = 0;
async function check(label, fn) { await fn(); checks++; console.log(`PASS ${label}`); }
const plain = value => JSON.parse(JSON.stringify(value));
try {
  const sim = await server.ssrLoadModule("/src/lib/simulator-config.ts");
  const engine = await server.ssrLoadModule("/src/lib/style-recommendations.ts");
  const design = await server.ssrLoadModule("/src/lib/design-order.ts");
  let active;
  const React = {
    useRef(initial) { const index = active.index++; return active.slots[index] ??= { current: initial }; },
    useState(initial) {
      const owner = active, index = owner.index++;
      if (!(index in owner.slots)) owner.slots[index] = typeof initial === "function" ? initial() : initial;
      return [owner.slots[index], value => {
        if (!owner.mounted) return;
        const next = typeof value === "function" ? value(owner.slots[index]) : value;
        if (!Object.is(next, owner.slots[index])) { owner.slots[index] = next; owner.dirty = true; }
      }];
    },
    useEffect(fn, deps) {
      const owner = active, index = owner.index++, old = owner.slots[index];
      if (!old || !deps || old.deps.some((value, i) => !Object.is(value, deps[i]))) {
        owner.effects.push(() => { old?.cleanup?.(); owner.slots[index] = { deps, cleanup: fn() }; });
      }
    },
  };
  const jsx = (type, props) => ({ type, props: props ?? {} });
  const imageQueue = [];
  class Image {
    naturalWidth = 1424;
    set src(value) { this.url = value; if (value) imageQueue.push(this); }
    get src() { return this.url; }
  }
  const store = selector => selector(active.store);
  store.getState = () => active.store;
  const deps = {
    react: React, "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "@radix-ui/react-dialog": Object.fromEntries(["Root", "Portal", "Overlay", "Content", "Title", "Description", "Close"].map(key => [key, `Dialog.${key}`])),
    "lucide-react": Object.fromEntries(["ArrowRight", "Check", "ChevronLeft", "LoaderCircle", "Sparkles", "X"].map(key => [key, `Icon.${key}`])),
    "@/lib/store": { useStore: store }, "@/lib/simulator-config": sim,
    "@/lib/style-recommendations": engine, "@/lib/design-order": design,
    "@/lib/utils": { cn: (...parts) => parts.filter(Boolean).join(" ") },
  };
  const compiled = ts.transpileModule(await readFile(resolve(root, "src/components/customizer/style-finder.tsx"), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports, Image, AbortController, clearTimeout,
    window: { setTimeout }, document: { querySelector: () => ({ focus() {} }) },
    require: id => { if (!(id in deps)) throw new Error(`Unexpected wizard dependency ${id}`); return deps[id]; },
  });
  function nodes(node) {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(nodes);
    if (node.type === "Dialog.Root" && !node.props.open) return [node];
    return [node, ...nodes(node.props.children)];
  }
  function text(node) {
    if (node === null || node === undefined || typeof node === "boolean") return "";
    if (Array.isArray(node)) return node.map(text).join("");
    if (typeof node !== "object") return String(node);
    return text(node.props.children);
  }
  function createHarness(isSpecial = false) {
    const harness = {
      index: 0, slots: [], effects: [], mounted: true, dirty: true, tree: null,
      calls: { standard: [], special: [], restore: [], applied: 0 },
      props: { model: "high", locale: "ko", disabled: false },
      store: null,
      render() {
        active = this; this.index = 0; this.effects = []; this.dirty = false;
        if (!this.props.special.enabled) this.props.special.names = this.store.draftPartNames;
        this.tree = module.exports.StyleFinder(this.props);
        for (const effect of this.effects) effect();
      },
      refresh() { if (this.dirty && this.mounted) this.render(); },
      findButton(label, exact = true) {
        const found = nodes(this.tree).find(node => node.type === "button" && (exact ? text(node) === label : text(node).includes(label)));
        assert.ok(found, `Button missing: ${label}`); return found;
      },
      click(label, exact = true) {
        active = this; const node = this.findButton(label, exact);
        assert.ok(!node.props.disabled, `Button disabled: ${label}`);
        node.props.onClick?.(); this.refresh();
      },
      clickColor(name, avoid = false) {
        const phrase = `${avoid ? "피하고 싶은 색" : "좋아하는 색을 골라주세요"}: ${name}`;
        const node = nodes(this.tree).find(node => node.props["aria-label"] === phrase);
        assert.ok(node, `Color missing ${phrase}`); node.props.onClick(); this.refresh();
      },
      async images({ fail = false } = {}) {
        for (let i = 0; i < 40; i++) {
          active = this;
          for (const image of imageQueue.splice(0)) { if (fail) image.onerror?.(); else image.onload?.(); }
          await new Promise(resolve => setImmediate(resolve)); this.refresh();
          if (!imageQueue.length && (!this.mounted || !nodes(this.tree).some(n => n.props["aria-busy"] === true))) return;
        }
        throw new Error("Image preparation did not settle");
      },
      close() { nodes(this.tree).find(n => n.type === "Dialog.Root").props.onOpenChange(false); this.refresh(); },
      unmount() { this.mounted = false; for (const slot of this.slots) slot?.cleanup?.(); },
    };
    const before = { ...sim.defaultPartNames(), b: "GREEN" };
    harness.store = {
      draftPartNames: before,
      setDraftDesign(input) {
        const names = design.completeDesign(input);
        if (!names || sim.modelOf(names) !== harness.props.model) return false;
        harness.calls.standard.push(plain(names)); this.draftPartNames = names; harness.dirty = true; return true;
      },
    };
    const special = {
      enabled: isSpecial, assetsReady: true, meshReady: true, busy: false,
      names: { ...before }, mesh: "WHITE", laces: "RED", beads: "GOLD",
      flowers: { b: true }, solids: { d: "GRAY" }, patterns: { c: "FLOWER B" },
      snapshotDraft: () => ({ previous: plain({ names: special.names, mesh: special.mesh, laces: special.laces, beads: special.beads,
        flowers: special.flowers, solids: special.solids, patterns: special.patterns }) }),
      applyRecommendation: (names, mesh, laces) => {
        harness.calls.special.push(plain({ names, mesh, laces }));
        Object.assign(special, { names: design.completeDesign(names), mesh, laces, beads: "NONE", flowers: {}, solids: {}, patterns: {} });
        harness.dirty = true; return true;
      },
      restoreDraft: snapshot => { harness.calls.restore.push(snapshot); Object.assign(special, snapshot.previous); harness.dirty = true; return true; },
    };
    harness.props.special = special;
    harness.props.onApplied = () => harness.calls.applied++;
    harness.render(); return harness;
  }
  function answerWizard(h) {
    h.click("나와 어울리는 커스텀 찾기", false);
    assert.equal(h.findButton("다음").props.disabled, true);
    assert.equal(nodes(h.tree).filter(n => n.type === "img").length, 5);
    h.click("깔끔한 클래식", false); h.click("다음");
    assert.equal(h.findButton("다음").props.disabled, true);
    h.clickColor("레드"); h.clickColor("블루"); h.click("다음");
    h.click("확실하게 눈에 띄게", false); h.click("다음");
    // Optional MBTI may be skipped without blocking apply.
    h.click("나와 어울리는 커스텀 해보기");
    assert.ok(nodes(h.tree).some(n => n.props["aria-busy"] === true));
  }
  await check("ordinary wizard applies a valid choice only after images load; retry keeps original undo", async () => {
    const h = createHarness(); const before = plain(h.store.draftPartNames);
    answerWizard(h); assert.equal(h.calls.standard.length, 0);
    await h.images(); assert.equal(h.calls.standard.length, 1);
    assert.ok(design.completeDesign(h.store.draftPartNames));
    const first = plain(h.store.draftPartNames);
    h.click("다른 조합 추천받기"); await h.images();
    assert.equal(h.calls.standard.length, 2);
    assert.notDeepEqual(h.store.draftPartNames, first);
    h.click("추천 전 디자인으로 돌아가기");
    assert.deepEqual(h.store.draftPartNames, before);
    assert.equal(h.calls.applied, 3); h.unmount();
  });
  await check("Special wizard applies independent mesh/laces and restores its private snapshot", async () => {
    const h = createHarness(true); const before = h.props.special.snapshotDraft().previous;
    answerWizard(h); await h.images();
    assert.equal(h.calls.standard.length, 0); assert.equal(h.calls.special.length, 1);
    assert.equal(h.props.special.beads, "NONE");
    assert.ok(h.calls.special[0].mesh); assert.ok(h.calls.special[0].laces);
    h.click("추천 전 디자인으로 돌아가기");
    assert.equal(h.calls.restore.length, 1);
    assert.deepEqual(h.props.special.snapshotDraft().previous, before); h.unmount();
  });
  await check("cancelled preparation and unmounted model contexts cannot apply a recommendation", async () => {
    for (const unmount of [false, true]) {
      const h = createHarness(); const before = plain(h.store.draftPartNames);
      answerWizard(h);
      if (unmount) h.unmount(); else h.close();
      await h.images();
      assert.equal(h.calls.standard.length, 0); assert.deepEqual(h.store.draftPartNames, before);
      h.unmount();
    }
  });
  await check("asset failure preserves draft and shows actionable error", async () => {
    const h = createHarness(); const before = plain(h.store.draftPartNames);
    answerWizard(h); await h.images({ fail: true });
    assert.equal(h.calls.standard.length, 0); assert.deepEqual(h.store.draftPartNames, before);
    assert.ok(nodes(h.tree).some(n => n.props.role === "alert" && text(n).includes("기존 디자인은 그대로")));
    h.close(); h.unmount();
  });
  await check("rejecting both base colors prevents mutation and identifies the restriction", async () => {
    const h = createHarness(); h.click("나와 어울리는 커스텀 찾기", false);
    h.click("깔끔한 클래식", false); h.click("다음"); h.clickColor("레드");
    h.clickColor("화이트", true); h.clickColor("블랙", true); h.click("다음"); h.click("다음");
    h.click("나와 어울리는 커스텀 해보기");
    assert.equal(h.calls.standard.length, 0);
    assert.ok(nodes(h.tree).some(n => n.props.role === "alert" && text(n).includes("화이트 또는 블랙")));
    h.close(); h.unmount();
  });
  console.log(`${checks} style finder UI-handler checks passed`);
} finally { await server.close(); }

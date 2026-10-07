// Isolated image-pipeline checks with fake images/canvas. No browser, network, or real payment.
import assert from "node:assert/strict";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const server = await createServer({
  configFile: false,
  root,
  resolve: { alias: { "@": resolve(root, "src") } },
  server: { middlewareMode: true },
  appType: "custom",
});
const originals = {
  Image: globalThis.Image,
  document: globalThis.document,
  fetch: globalThis.fetch,
  setTimeout: globalThis.setTimeout,
};
globalThis.fetch = async () => {
  throw new Error("OUTBOUND_NETWORK_BLOCKED");
};
let live, peak, sources, draws, qualityCalls, canvases, mode;
const validJpeg = "data:image/jpeg;base64,/9j/2Q==";
function reset(nextMode = "ok") {
  live = 0;
  peak = 0;
  sources = [];
  draws = [];
  qualityCalls = [];
  canvases = [];
  mode = nextMode;
}
class FakeImage {
  naturalWidth = 1424;
  naturalHeight = 1392;
  onload = null;
  onerror = null;
  current = "";
  set src(value) {
    if (this.current) live--;
    this.current = value;
    if (!value) return;
    sources.push(value);
    live++;
    peak = Math.max(peak, live);
    if (mode === "hang") return;
    queueMicrotask(() => {
      if (this.current) (mode === "fail" ? this.onerror : this.onload)?.();
    });
  }
  get src() {
    return this.current;
  }
}
globalThis.Image = FakeImage;
globalThis.document = {
  createElement(name) {
    assert.equal(name, "canvas");
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({
        fillStyle: "",
        fillRect() {},
        drawImage(img, x, y, w, h) {
          draws.push({ src: img.src, x, y, w, h });
        },
      }),
      toDataURL(type, quality) {
        assert.equal(type, "image/jpeg");
        qualityCalls.push(quality);
        if (mode === "oversize" && quality === 0.9)
          return "data:image/jpeg;base64,/9j/" + "A".repeat(600000);
        if (mode === "tainted") throw new Error("CANVAS_SECURITY_ERROR");
        return validJpeg;
      },
    };
    canvases.push(canvas);
    return canvas;
  },
};
let count = 0;
async function check(label, fn) {
  reset();
  await fn();
  assert.equal(live, 0, "release decoded images");
  assert.ok(
    canvases.every((c) => c.width === 0 && c.height === 0),
    "release canvas backing stores",
  );
  count++;
  console.log(`PASS ${label}`);
}
try {
  const design = await server.ssrLoadModule("/src/lib/design-order.ts");
  const sim = await server.ssrLoadModule("/src/lib/simulator-config.ts");
  const names = { ...sim.defaultPartNames(), b: "GOLD", c: "RED", k: "BLACK" };
  await check("layer order and contain geometry survive sequential rendering", async () => {
    assert.equal(await design.captureDesign(names), validJpeg);
    const expected = [
      sim.PHOTO_BASE,
      ...sim.SIM_PARTS.map((p) => sim.REAL_LAYERS[p.id]?.[names[p.id]]).filter(Boolean),
    ];
    assert.deepEqual(
      draws.map((d) => d.src),
      expected,
    );
    assert.equal(peak, 1, "never retain all layers simultaneously");
    assert.ok(
      draws.every(
        (d) => Math.abs(d.w - 1000) < 0.001 && Math.abs(d.h - (1392 / 1424) * 1000) < 0.001,
      ),
    );
  });
  await check("mid-cut capture uses exact mid masks and excludes G", async () => {
    const mid = { ...names, model: "mid", a: "BLACK", e: "GOLD", f: "SILVER", h: "SKY BLUE" };
    assert.equal(await design.captureDesign(mid), validJpeg);
    assert.equal(draws[0].src, "/simulator/mid/base.jpg?v=1");
    for (const [part, color] of [["a","black"],["e","gold"],["f","silver"],["h","sky-blue"]])
      assert.ok(draws.some(d => d.src === `/simulator/mid/${part}/${color}.png?v=1`));
    assert.ok(draws.every(d => !d.src.includes("/g-") && !d.src.includes("guide")));
    assert.equal(peak, 1);
  });
  await check("special export replaces the selected layer at the same geometry", async () => {
    const floral = "data:image/png;base64,FLOWER_TEST";
    assert.equal(await design.captureDesign(names, { layerOverrides: { b: floral } }), validJpeg);
    assert.ok(draws.some(d => d.src === floral));
    assert.ok(draws.every(d => d.src !== sim.REAL_LAYERS.b.GOLD));
    assert.equal(draws.filter(d => d.src === floral).length, 1);
    assert.equal(peak, 1);
  });
  await check(
    "large JPEG falls back without losing the design or exceeding payload limit",
    async () => {
      mode = "oversize";
      assert.equal(await design.captureDesign(names), validJpeg);
      assert.deepEqual(qualityCalls, [0.9, 0.85]);
    },
  );
  await check("failed image remains an error and a fresh retry succeeds", async () => {
    mode = "fail";
    await assert.rejects(design.captureDesign(names), /DESIGN_IMAGE_FAILED/);
    assert.equal(live, 0);
    mode = "ok";
    assert.equal(await design.captureDesign(names), validJpeg);
  });
  await check("cart changes cancel stale image work and clean up", async () => {
    mode = "hang";
    const controller = new AbortController();
    const pending = design.captureDesign(names, { signal: controller.signal });
    controller.abort();
    await assert.rejects(pending, /DESIGN_IMAGE_ABORTED/);
    assert.equal(sources.length, 1);
  });
  await check(
    "a stalled image reaches an error state instead of waiting indefinitely",
    async () => {
      mode = "hang";
      globalThis.setTimeout = (fn) => originals.setTimeout(fn, 5);
      try {
        await assert.rejects(design.captureDesign(names), /DESIGN_IMAGE_TIMEOUT/);
      } finally {
        globalThis.setTimeout = originals.setTimeout;
      }
    },
  );
  await check("canvas failures propagate and release resources", async () => {
    mode = "tainted";
    await assert.rejects(design.captureDesign(names), /CANVAS_SECURITY_ERROR/);
  });
  console.log(
    `${count} image-pipeline checks passed; fake image/canvas only, no visual or device test claimed.`,
  );
} finally {
  Object.assign(globalThis, originals);
  await server.close();
}

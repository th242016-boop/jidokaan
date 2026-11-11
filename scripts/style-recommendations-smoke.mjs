// Pure recommendation and real order-contract checks. No DB, tokens or network.
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const server = await createServer({ configFile: false, root, server: { middlewareMode: true, hmr: false }, appType: "custom" });
let count = 0;
const check = (label, fn) => { fn(); count++; console.log(`PASS ${label}`); };
try {
  const engine = await server.ssrLoadModule("/src/lib/style-recommendations.ts");
  const config = await server.ssrLoadModule("/src/lib/simulator-config.ts");
  const stock = await server.ssrLoadModule("/src/lib/mesh-laces.ts");
  const orders = await server.ssrLoadModule("/src/lib/design-order.ts");
  const { recommendStyle, STYLE_PRESETS, RECOMMENDATION_COLORS, RecommendationConstraintError } = engine;
  const colors = RECOMMENDATION_COLORS.map(item => item.name);
  const preferences = { styleId: "clean", likedColors: ["RED", "BLUE"], avoidedColors: [], intensity: "accent" };
  const standard = { model: "high", special: false };
  const major = names => [names.b, names.c, names.d];
  const visible = result => [...result.activeParts.filter(part => part !== "a").map(part => result.names[part]), result.meshColor, result.laceColor, result.names.l];
  const fingerprint = result => JSON.stringify([result.names, result.meshColor, result.laceColor]);

  check("all five example choices are distinct valid real-photograph designs", () => {
    assert.equal(STYLE_PRESETS.length, 5);
    const examples = STYLE_PRESETS.map(preset => engine.stylePresetExample(preset.id));
    assert.equal(new Set(examples.map(fingerprint)).size, 5);
    for (const example of examples) assert.ok(orders.completeDesign(example.names));
    assert.equal(colors.includes("GRAY"), false);
  });

  check("every style, intensity, model and variant conforms to stock and order contracts", () => {
    for (const style of STYLE_PRESETS) for (const model of ["high", "mid"]) {
      for (const special of [false, true]) for (const intensity of ["quiet", "accent", "bold"]) {
        for (let variant = 0; variant < 3; variant++) {
          const result = recommendStyle({ ...preferences, styleId: style.id, intensity }, { model, special }, variant);
          assert.ok(orders.completeDesign(result.names), `${style.id}/${model}/${special}/${intensity}/${variant}`);
          assert.ok(stock.MESH_COLORS.includes(result.meshColor));
          assert.ok(stock.LACE_COLORS.includes(result.laceColor));
          if (!special) {
            assert.ok(["WHITE", "BLACK"].includes(result.meshColor));
            assert.equal(result.meshColor, result.laceColor);
            assert.equal(result.names.a, result.meshColor);
          } else assert.equal(result.names.a, result.meshColor === "BLACK" ? "BLACK" : "WHITE");
          for (const part of result.activeParts.filter(part => !["a", "k"].includes(part))) {
            assert.ok(colors.includes(result.names[part]));
            assert.ok(config.PHOTO_NATIVE[part] === result.names[part] || config.photoLayerFor(part, result.names[part], { model }));
          }
          assert.ok(!result.activeParts.includes("l"));
          if (model === "mid") { assert.ok(!result.activeParts.includes("g")); assert.equal(result.names.g, "WHITE"); }
          const names = result.names;
          assert.equal(names.l, config.linkedLColor(names.d, "", names.i, "", names.a, "").name);
          for (const favorite of preferences.likedColors) assert.ok(major(names).includes(favorite));
        }
      }
    }
  });

  check("each supported favorite is meaningful even in quiet designs; each pair is retained", () => {
    for (const first of colors) for (const second of colors) {
      const result = recommendStyle({ ...preferences, likedColors: [first, second], intensity: "quiet" }, standard);
      assert.ok(major(result.names).includes(first), first);
      assert.ok(major(result.names).includes(second), second);
      assert.deepEqual([...result.explanation.appliedLikes].sort(), [...new Set([first, second])].sort());
    }
  });

  check("disliked colors are excluded from all visible parts, mesh, laces, outsole and linked line", () => {
    for (const avoided of colors) for (const model of ["high", "mid"]) for (const special of [false, true]) {
      const result = recommendStyle({ ...preferences, likedColors: ["RED", "BLUE"], intensity: "bold", avoidedColors: [avoided] }, { model, special });
      assert.ok(!visible(result).includes(avoided), `${avoided}/${model}/${special}`);
    }
    const result = recommendStyle({ ...preferences, likedColors: ["RED", "BLUE"], avoidedColors: ["RED", "BLACK", "GOLD"] }, standard);
    assert.ok(!visible(result).some(color => ["RED", "BLACK", "GOLD"].includes(color)));
    assert.ok(major(result.names).includes("BLUE"));
    assert.ok(result.explanation.notes.some(note => note.code === "AVOIDED_LIKED_COLOR" && note.colors.includes("RED")));
  });

  check("impossible exclusions produce explicit constraints without inventing a forbidden fallback", () => {
    for (const special of [false, true]) {
      assert.throws(() => recommendStyle({ ...preferences, avoidedColors: ["WHITE", "BLACK"] }, { ...standard, special }),
        error => error instanceof RecommendationConstraintError && error.code === "NO_ALLOWED_BASE_COLOR");
      assert.throws(() => recommendStyle({ ...preferences, avoidedColors: colors }, { ...standard, special }),
        error => error instanceof RecommendationConstraintError && error.code === "NO_ALLOWED_LEATHER_COLOR");
    }
  });

  check("retry offers three distinct compositions when at least two leather colors are possible", () => {
    for (const style of STYLE_PRESETS) for (const intensity of ["quiet", "accent", "bold"]) {
      const results = [0, 1, 2].map(variant => recommendStyle({ ...preferences, styleId: style.id, intensity }, standard, variant));
      assert.equal(new Set(results.map(fingerprint)).size, 3, `${style.id}/${intensity}`);
    }
    const onlyWhite = { ...preferences, likedColors: [], avoidedColors: colors.filter(color => color !== "WHITE") };
    assert.ok(visible(recommendStyle(onlyWhite, standard)).every(color => color === "WHITE"));
  });

  check("stable seeds and MBTI tie-breaking never change explicit preferences or palette weighting", () => {
    const input = Object.freeze({ ...preferences, likedColors: Object.freeze(["RED", "BLUE"]), avoidedColors: Object.freeze(["GOLD"]), mbti: "INFP" });
    const context = Object.freeze({ ...standard });
    assert.deepEqual(recommendStyle(input, context, 1), recommendStyle(input, context, 1));
    assert.deepEqual(recommendStyle({ ...input, mbti: "unknown" }, context), recommendStyle({ ...input, mbti: undefined }, context));
    const paletteCounts = result => Object.entries(result.names).filter(([part]) => !["model", "l"].includes(part)).map(([,color]) => color).sort();
    assert.deepEqual(paletteCounts(recommendStyle({ ...input, mbti: "INFP" }, context)), paletteCounts(recommendStyle({ ...input, mbti: "ESTJ" }, context)));
    const changed = recommendStyle(input, context);
    changed.names.b = "FLOWER A";
    changed.explanation.notes.push({ code: "UNAVAILABLE_LIKED_COLOR", colors: ["GRAY"] });
    assert.notEqual(recommendStyle(input, context).names.b, "FLOWER A");
  });

  check("unknown or private option names cannot enter recommendations; unsupported stock is explained", () => {
    const result = recommendStyle({ ...preferences, styleId: "FLOWER A", likedColors: ["FLOWER A", "MATTE RED", "GRAY", "RED"], intensity: "bogus", mbti: "<script>" }, standard, Infinity);
    assert.equal(result.styleId, "clean");
    assert.equal(result.intensity, "accent");
    assert.equal(result.variant, 0);
    assert.ok(visible(result).every(color => colors.includes(color)));
    assert.ok(result.explanation.notes.some(note => note.code === "UNAVAILABLE_LIKED_COLOR" && note.colors.includes("GRAY")));
    assert.ok(major(result.names).includes("RED"));
  });
  console.log(`Recommendation smoke checks passed: ${count}`);
} finally { await server.close(); }

// Uses the actual native assets and browser Canvas implementation, without an
// application server, administrator session, production database or network.
// CHROMIUM_EXECUTABLE_PATH may point to a locally installed headless Chromium.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import { chromium } from "playwright";

const root = new URL("../", import.meta.url);
const source = await readFile(new URL("src/lib/mesh-laces.ts", root), "utf8");
const code = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
} }).outputText;
const image = async path => `data:image/${path.endsWith(".jpg") ? "jpeg" : "png"};base64,${
  (await readFile(new URL(`public/simulator/${path}`, root))).toString("base64")}`;
const browser = await chromium.launch({ headless: true,
  ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}),
  args: ["--no-sandbox", "--disable-gpu"],
});
try {
  const page = await browser.newPage();
  await page.route("**/*", route => route.abort());
  await page.addScriptTag({ content: `window.renderer = (() => { const exports = {}; ${code}; return exports; })();` });
  for (const model of ["high", "mid"]) {
    const result = await page.evaluate(async ({ model, white, black }) => {
      const images = await Promise.all([white, black].map(async src => {
        const im = new Image(); im.src = src; await im.decode(); return im;
      }));
      const api = window.renderer;
      const data = api.splitMeshLacePixels(images[0], images[1], model);
      const expect = (condition, label) => { if (!condition) throw new Error(`${model}: ${label}`); };
      expect(data.width === 1424 && data.height === 1392, "native dimensions");
      // Photograph-reviewed points: old tongue triangles cut these lace pixels.
      for (const [x, y] of [[625, 873], [626, 875], [612, 855], [600, 841], [565, 955]]) {
        expect(data.white[(y * data.width + x) * 4 + 3] === 255, `source lace ${x},${y}`);
        expect(data.lace[y * data.width + x] === 255, `continuous lace ${x},${y}`);
      }
      for (const [x, y] of [[587, 900], [630, 748]])
        expect(data.lace[y * data.width + x] === 0, `exposed mesh ${x},${y}`);
      for (const color of ["WHITE", "BLACK"]) {
        const rendered = api.renderMeshLaces(data, color, color).data;
        const original = color === "WHITE" ? data.white : data.black;
        for (let p = 0; p < data.lace.length; p++) {
          const i = p * 4;
          expect(rendered[i + 3] === data.white[i + 3], `${color} alpha ${p}`);
          if (data.white[i + 3]) for (let c = 0; c < 3; c++)
            expect(rendered[i + c] === original[i + c], `${color} original pixel ${p}`);
        }
      }
      let combinations = 0;
      for (const mesh of api.MESH_COLORS) for (const laces of api.LACE_COLORS) {
        const out = api.renderMeshLaces(data, mesh, laces).data;
        for (let p = 0; p < data.lace.length; p++)
          if (out[p * 4 + 3] !== data.white[p * 4 + 3]) throw new Error(`changed alpha: ${mesh}/${laces}/${p}`);
        combinations++;
      }
      const neutral = api.renderMeshLaces(data, "WHITE", "WHITE").data;
      const blue = api.renderMeshLaces(data, "WHITE", "BLUE").data;
      const red = api.renderMeshLaces(data, "RED", "BLUE").data;
      let laceChanges = 0, meshChanges = 0;
      for (let p = 0; p < data.lace.length; p++) {
        if (!data.white[p * 4 + 3]) continue;
        for (let c = 0; c < 3; c++) {
          const i = p * 4 + c;
          if (data.lace[p] === 0) expect(neutral[i] === blue[i], "lace selection affected mesh");
          if (data.lace[p] === 255) expect(blue[i] === red[i], "mesh selection affected lace");
          if (neutral[i] !== blue[i]) laceChanges++;
          if (blue[i] !== red[i]) meshChanges++;
        }
      }
      expect(laceChanges > 0 && meshChanges > 0, "independent color changes");
      return { combinations, laceChanges, meshChanges };
    }, { model,
      white: await image(model === "high" ? "photo/base.jpg" : "mid/a/white.png"),
      black: await image(model === "high" ? "photo/tints/a-black.png" : "mid/a/black.png"),
    });
    assert.equal(result.combinations, 55);
    console.log(`PASS ${model}: native alpha, original WHITE/BLACK, lace continuity, separate mesh and laces, 55 color combinations`);
  }
} finally { await browser.close(); }

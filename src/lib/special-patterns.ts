import { partsForModel, photoLayerFor, type BootModel, type PartId } from "./simulator-config";
import { SPECIAL_FINISHES, finishFor } from "./special-finishes";
import { applyMaterialStitches } from "./material-stitches";
import { SNAKE_MATERIALS, recolorSnakePixels, snakeMaterialFor } from "./snake-materials";
import { LIZARD_MATERIALS, lizardMaterialFor, recolorLizardPixels } from "./lizard-materials";

export const SPECIAL_PATTERNS = [
  { name: "FLOWER B", label: "FLOWER B" },
  { name: "FLOWER C", label: "FLOWER C" },
  // Keep the established internal IDs and approved rendering for these two.
  { name: "BLACK SNAKE", label: "BLACK LIZARD" },
  { name: "WHITE SNAKE", label: "WHITE LIZARD" },
  ...LIZARD_MATERIALS,
  ...SNAKE_MATERIALS,
  { name: "SILVER WEAVE", label: "SILVER WEAVE" },
  { name: "MICRO HOUNDSTOOTH", label: "MICRO HOUNDSTOOTH" },
  { name: "BRONZE", label: "BRONZE" },
  { name: "PINK GOLD", label: "PINK GOLD" },
  ...SPECIAL_FINISHES,
] as const;
export type SpecialPatternName = typeof SPECIAL_PATTERNS[number]["name"];
export type SpecialPatternAssets = Partial<Record<SpecialPatternName, { texture: string; swatch: string }>>;
export type PatternSelections = Partial<Record<PartId, SpecialPatternName>>;
export type PatternLayers = Partial<Record<PartId, string>>;
export const isSpecialPattern = (name: string): name is SpecialPatternName =>
  SPECIAL_PATTERNS.some(pattern => pattern.name === name);
export const isMetallicPattern = (name: string): name is "BRONZE" | "PINK GOLD" =>
  name === "BRONZE" || name === "PINK GOLD";
export const patternPartsFor = (model: BootModel, _name?: SpecialPatternName): PartId[] =>
  partsForModel({ model }).filter(part => part.type === "full" && part.id !== "l").map(part => part.id);

// Approximate motif sizes in the 1424×1392 photograph. They are visual previews,
// not a physical cutting layout; the references are finished shoes, not flat scans.
const TILE_SIZE: Partial<Record<SpecialPatternName, number>> = {
  "FLOWER B": 540, "FLOWER C": 650, "BLACK SNAKE": 420, "WHITE SNAKE": 420,
  "NATURAL SNAKE": 520, "HOT PINK SNAKE": 520, "ORANGE SNAKE": 520,
  "SKY BLUE SNAKE": 520, "GREEN SNAKE": 520, "YELLOW SNAKE": 520,
  "SILVER WEAVE": 294, "MICRO HOUNDSTOOTH": 220,
  "BRONZE": 380, "PINK GOLD": 420,
};

// Each leather panel represents a separately cut piece. Keep the grain direction
// and motif size, but start at a different point so prints do not join at seams.
// Fixed offsets also keep previews, model switching and exports reproducible.
const PANEL_CUT_OFFSETS: Partial<Record<PartId, readonly [number, number]>> = {
  b: [0, 0], c: [0.37, 0.61], d: [0.73, 0.23],
  e: [0.19, 0.83], f: [0.61, 0.43], g: [0.89, 0.71],
  h: [0.43, 0.17], i: [0.11, 0.53], j: [0.79, 0.97],
};

// Shared black scale topology is recolored monotonically: raised bright rims
// remain bright and recessed cells remain darker. Never invert the relief.
// The filter uses the same linear transfer for the protected source swatch.
export const WHITE_SNAKE_SWATCH_FILTER = "grayscale(1) contrast(0.15) brightness(1.92)";
export const whiteSnakeSurface = (r: number, g: number, b: number) =>
  Math.min(255, 208.08 + 0.288 * (0.2126 * r + 0.7152 * g + 0.0722 * b));

// Apply metal light in linear RGB, not by adding display-encoded gray/white.
// This keeps the rose/copper reflection colored and preserves highlight detail.
const LINEAR_RGB = Array.from({ length: 256 }, (_, value) => {
  const srgb = value / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
});
const displayRGB = (value: number) => {
  const linear = Math.max(0, Math.min(1, value));
  return Math.round(255 * (linear <= 0.0031308 ? linear * 12.92 : 1.055 * linear ** (1 / 2.4) - 0.055));
};

// Reuse the same photographed light direction with a response appropriate to
// each surface. Matte/suede spread the light broadly instead of looking metallic.
export function surfaceLightProfile(name: SpecialPatternName) {
  const finish = finishFor(name);
  if (finish?.kind === "matte") return { blur: 26, floor: 0.18, peak: 1.22, sheen: 0.006 };
  if (finish?.kind === "suede") return { blur: 36, floor: 0.20, peak: 1.18, sheen: 0.002 };
  if (name === "BLACK SNAKE") return { blur: 14, floor: 0.20, peak: 1.18, sheen: 0.055 };
  if (name === "WHITE SNAKE") return { blur: 16, floor: 0.52, peak: 1.22, sheen: 0.025 };
  if (lizardMaterialFor(name)) return { blur: 14, floor: 0.24, peak: 1.18, sheen: 0.035 };
  if (snakeMaterialFor(name)) return { blur: 16, floor: 0.24, peak: 1.14, sheen: 0.035 };
  if (name === "FLOWER B") return { blur: 22, floor: 0.28, peak: 1.14, sheen: 0.028 };
  if (name === "FLOWER C") return { blur: 26, floor: 0.30, peak: 1.10, sheen: 0.012 };
  if (name === "SILVER WEAVE") return { blur: 16, floor: 0.18, peak: 1.18, sheen: 0.075 };
  if (name === "MICRO HOUNDSTOOTH") return { blur: 26, floor: 0.30, peak: 1.10, sheen: 0.006 };
  return undefined; // The approved BRONZE/PINK GOLD response stays unchanged.
}

/** Map a flat material into the existing native silhouette, including lace holes.
 * RED provides the mask and diffuse dark details. Its neutral patent reflections
 * are not copied directly. Leather finishes use shared neutral microtexture and
 * independent base colors, with broad low-intensity light for surface curvature.
 */
export function renderPatternPixels(source: ImageData, material: ImageData, name: SpecialPatternName, softReflection?: ImageData, fineDetail?: ImageData, part: PartId = "b", metalReflection?: ImageData): ImageData {
  const { width, height, data: src } = source;
  const out = new ImageData(width, height);
  const finish = finishFor(name);
  const snake = snakeMaterialFor(name);
  const lizard = lizardMaterialFor(name);
  const metallic = isMetallicPattern(name);
  const lightProfile = surfaceLightProfile(name);
  const bronze = name === "BRONZE";
  const metallicSheen = (bronze ? [255, 211, 143] : [255, 222, 212]).map(value => LINEAR_RGB[value]);
  // Recolor before mapping; swatches use this identical pixel transfer.
  const surface = snake ? recolorSnakePixels(material, snake.name)
    : lizard ? recolorLizardPixels(material, lizard.name) : material;
  const tile = TILE_SIZE[name] ?? (lizard || finish?.kind === "suede" ? 420 : 600);
  const [cutU, cutV] = finish ? [0, 0] : PANEL_CUT_OFFSETS[part] ?? [0, 0];
  // Neutral maps carry surface character only. Normalizing their average avoids
  // baking a black/gray photograph into all colors, especially white and yellow.
  let materialMean = 0;
  if (finish || metallic) {
    for (let t = 0; t < material.data.length; t += 4) materialMean +=
      (material.data[t] + material.data[t + 1] + material.data[t + 2]) / 3;
    materialMean = Math.max(1, materialMean / (material.width * material.height));
  }
  const radians = -0.48, cos = Math.cos(radians), sin = Math.sin(radians);
  const mirror = (value: number, size: number) => {
    const doubled = size * 2;
    const mod = ((value % doubled) + doubled) % doubled;
    return Math.min(size - 1, mod < size ? mod : doubled - 1 - mod);
  };
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    const alpha = src[i + 3];
    if (!alpha) continue;
    // A small smooth warp avoids a visibly flat, rigid texture on rounded panels.
    const dx = x - 700, dy = y - 700;
    const u = (cos * dx - sin * dy + 18 * Math.sin(dy / 230)) / tile + cutU;
    const v = (sin * dx + cos * dy + 12 * Math.sin(dx / 190)) / tile + cutV;
    const tx = mirror(Math.floor(u * material.width), material.width);
    const ty = mirror(Math.floor(v * material.height), material.height);
    const t = (ty * material.width + tx) * 4;
    // Red-channel darkness retains seam/stitch detail without reusing the broad
    // white enamel highlights. The texture's own grain/specular detail remains.
    const shade = 0.2 + 0.8 * Math.pow(Math.min(1.04, src[i] / 235), 0.8);
    if (lightProfile && metalReflection) {
      // The guide is neutral light only: no GOLD hue, grain or alpha is copied.
      // One shared calibration preserves which faces point toward the light.
      const broadRed = softReflection?.data[i] ?? src[i];
      const redLight = softReflection ? Math.min(1, Math.min(softReflection.data[i + 1], softReflection.data[i + 2]) / 180) : 0;
      const fallback = Math.min(1, 0.44 * broadRed / 220 + 0.38 * redLight);
      const confidence = Math.min(1, metalReflection.data[i + 3] / 96);
      const reference = (0.2126 * metalReflection.data[i] + 0.7152 * metalReflection.data[i + 1] + 0.0722 * metalReflection.data[i + 2]) / 255;
      const light = Math.max(0, Math.min(1, (reference * confidence + fallback * (1 - confidence) - 0.14) / 0.72));
      const whiteFinish = name === "MATTE WHITE" || name === "WHITE SUEDE";
      const shape = whiteFinish ? 0.58 + 0.42 * light ** 0.65
        : lightProfile.floor + (lightProfile.peak - lightProfile.floor) * light ** 0.9;
      const darkDetail = 0.32 + 0.68 * Math.min(1, src[i] / 155) ** 0.9;
      let grain = 1, stitch = 1;
      if (finish) {
        const luminance = (material.data[t] + material.data[t + 1] + material.data[t + 2]) / 3;
        grain = 1 + (luminance / materialMean - 1) * (finish.kind === "matte" ? 0.12 : whiteFinish ? 0.65 * 0.55 : 0.65);
        // Preserve the perceptual nap contrast when moving its multiplier from
        // display RGB into linear light. Do not use stronger gloss to mimic nap.
        if (finish.kind === "suede") grain *= grain;
        const fineRed = fineDetail?.data[i] ?? src[i];
        const specular = fineDetail ? Math.min(fineDetail.data[i + 1], fineDetail.data[i + 2]) : 0;
        stitch = 1 + Math.max(-80, Math.min(35, src[i] - fineRed)) / 255 * (specular < 25 ? 1.2 : 0.15);
      }
      const whiteSnake = name === "WHITE SNAKE"
        ? Math.round(whiteSnakeSurface(material.data[t], material.data[t + 1], material.data[t + 2])) : undefined;
      const r = finish?.rgb[0] ?? whiteSnake ?? surface.data[t];
      const g = finish?.rgb[1] ?? whiteSnake ?? surface.data[t + 1];
      const b = finish?.rgb[2] ?? whiteSnake ?? surface.data[t + 2];
      // Retain printed dark patches. Fine raised snake/foil grain catches more
      // light; the diffuse matte/suede families use almost no additive sheen.
      const relief = finish ? 1 : Math.max(0.3, Math.min(1.2, (r + g + b) / (3 * 150)));
      const reflected = lightProfile.sheen * light ** 2 * relief;
      const detail = (darkDetail * stitch) ** 2;
      const diffuse = shape * grain;
      const red = (LINEAR_RGB[r] * diffuse + reflected) * detail;
      const green = (LINEAR_RGB[g] * diffuse + reflected) * detail;
      const blue = (LINEAR_RGB[b] * diffuse + reflected) * detail;
      const peak = Math.max(red, green, blue), excess = Math.max(0, peak - 0.92);
      const highlightScale = excess ? (0.92 + 0.08 * excess / (0.08 + excess)) / peak : 1;
      out.data[i] = displayRGB(red * highlightScale);
      out.data[i + 1] = displayRGB(green * highlightScale);
      out.data[i + 2] = displayRGB(blue * highlightScale);
      out.data[i + 3] = alpha;
      continue;
    }
    if (finish) {
      const luminance = (material.data[t] + material.data[t + 1] + material.data[t + 2]) / 3;
      const matte = finish.kind === "matte";
      // Matte grain should be almost invisible at product scale. Suede retains
      // soft short-nap variation; neither uses the old coarse black texture.
      const surface = 1 + (luminance / materialMean - 1) * (matte ? 0.12 : 0.65);
      // Even RED contains sharp highlight borders in its red channel. Reusing
      // that channel directly makes white/yellow look enamel-coated. Use only
      // blurred broad shape light, retaining unblurred *dark* seam/edge detail.
      const broadRed = softReflection?.data[i] ?? src[i];
      const shape = 0.70 + 0.30 * Math.pow(Math.min(1.03, broadRed / 220), 0.9);
      const darkDetail = 0.32 + 0.68 * Math.pow(Math.min(1, src[i] / 155), 0.9);
      const light = softReflection
        ? Math.pow(Math.min(1, Math.min(softReflection.data[i + 1], softReflection.data[i + 2]) / 180), 0.9)
        : 0;
      const reflection = light * (matte ? 21 : 7);
      // Restore only fine stitch/seam contrast, suppressing it inside specular
      // regions. Broad mask coverage adds a soft curved edge without changing
      // the output silhouette or recreating the sharp patent-light shapes.
      const fineRed = fineDetail?.data[i] ?? src[i];
      const specular = fineDetail ? Math.min(fineDetail.data[i + 1], fineDetail.data[i + 2]) : 0;
      const stitch = 1 + Math.max(-80, Math.min(35, src[i] - fineRed)) / 255 * (specular < 25 ? 1.2 : 0.15);
      const coverage = (softReflection?.data[i + 3] ?? 255) / 255;
      const volume = (0.78 + 0.22 * Math.pow(coverage, 0.7)) * (0.90 + 0.10 * light);
      if (name === "MATTE WHITE" || name === "WHITE SUEDE") {
        // White needs a brighter diffuse response: merely changing its RGB to
        // 255 still leaves it gray after the old shape/volume multiplications.
        // Lift broad shadows only; retain native dark seams, fine stitches and
        // short nap, without restoring any of the sharp patent reflections.
        const whiteLight = 0.965 * Math.pow(Math.min(1, shape * volume), 0.22);
        const whiteSurface = 1 + (surface - 1) * (matte ? 1 : 0.55);
        const value = Math.max(0, Math.min(255, Math.round(
          255 * whiteLight * darkDetail * whiteSurface * stitch + light * (matte ? 3 : 1))));
        out.data[i] = out.data[i + 1] = out.data[i + 2] = value;
        out.data[i + 3] = alpha;
        continue;
      }
      for (let c = 0; c < 3; c++) out.data[i + c] = Math.max(0, Math.min(255,
        Math.round(finish.rgb[c] * shape * darkDetail * surface * stitch * volume + reflection)));
      out.data[i + 3] = alpha;
      continue;
    }
    if (name === "WHITE SNAKE") {
      const albedo = whiteSnakeSurface(material.data[t], material.data[t + 1], material.data[t + 2]);
      const broadRed = softReflection?.data[i] ?? src[i];
      const shape = 0.72 + 0.28 * Math.pow(Math.min(1.03, broadRed / 220), 0.9);
      const darkDetail = 0.32 + 0.68 * Math.pow(Math.min(1, src[i] / 155), 0.9);
      const light = softReflection
        ? Math.pow(Math.min(1, Math.min(softReflection.data[i + 1], softReflection.data[i + 2]) / 180), 1.1)
        : 0;
      const value = Math.min(255, Math.round(albedo * shape * darkDetail + 18 * light));
      out.data[i] = out.data[i + 1] = out.data[i + 2] = value;
      out.data[i + 3] = alpha;
      continue;
    }
    if (metallic) {
      // GOLD supplies photographed metal reflections following the real panel
      // curvature. Use one calibration for every part, without copying its hue,
      // grain or silhouette. This is photographic relighting, not a 3D BRDF.
      const broadRed = softReflection?.data[i] ?? src[i];
      const darkDetail = 0.32 + 0.68 * Math.pow(Math.min(1, src[i] / 155), 0.9);
      const redLight = softReflection
        ? Math.min(1, Math.min(softReflection.data[i + 1], softReflection.data[i + 2]) / 180)
        : 0;
      const fallback = Math.min(1, 0.44 * broadRed / 220 + 0.38 * redLight);
      // Blurred Canvas RGB is unpremultiplied. Fade to the RED fallback only
      // where the GOLD reference has insufficient coverage, never to black.
      const confidence = metalReflection ? Math.min(1, metalReflection.data[i + 3] / 96) : 0;
      const goldLight = metalReflection
        ? (0.2126 * metalReflection.data[i] + 0.7152 * metalReflection.data[i + 1] + 0.0722 * metalReflection.data[i + 2]) / 255
        : fallback;
      const light = Math.max(0, Math.min(1, (goldLight * confidence + fallback * (1 - confidence) - 0.14) / 0.72));
      const shape = 0.22 + 1.18 * light ** 1.3;
      const grain = ((material.data[t] + material.data[t + 1] + material.data[t + 2]) / 3) / materialMean;
      // Crumpled bronze catches the light on its existing bright creases; the
      // smoother pink gold gets a broader, gentler lobe with fine grain intact.
      const relief = bronze ? Math.max(0.35, Math.min(1.4, 0.65 + 0.45 * (grain - 1))) : Math.max(0.9, Math.min(1.1, 1 + 0.08 * (grain - 1)));
      const reflection = (bronze ? 0.50 * light ** 2.2 : 0.24 * light ** 2) * relief;
      const detail = darkDetail ** 2;
      const r = (LINEAR_RGB[material.data[t]] * shape + metallicSheen[0] * reflection) * detail;
      const g = (LINEAR_RGB[material.data[t + 1]] * shape + metallicSheen[1] * reflection) * detail;
      const b = (LINEAR_RGB[material.data[t + 2]] * shape + metallicSheen[2] * reflection) * detail;
      // Roll off bright reflections together, so pink/red does not clip first
      // and lose grain or shift hue. Midtones and shadows remain untouched.
      const peak = Math.max(r, g, b), excess = Math.max(0, peak - 0.85);
      const highlightScale = excess ? (0.85 + 0.15 * excess / (0.15 + excess)) / peak : 1;
      out.data[i] = displayRGB(r * highlightScale);
      out.data[i + 1] = displayRGB(g * highlightScale);
      out.data[i + 2] = displayRGB(b * highlightScale);
      out.data[i + 3] = alpha;
      continue;
    }
    if (snake || lizard || name === "SILVER WEAVE" || name === "MICRO HOUNDSTOOTH") {
      // The neutral reference carries scale/thread relief and printed markings.
      // Broad shape light gives curvature without copying sharp patent bands.
      const broadRed = softReflection?.data[i] ?? src[i];
      const shape = 0.72 + 0.28 * Math.pow(Math.min(1.03, broadRed / 220), 0.9);
      const darkDetail = 0.32 + 0.68 * Math.pow(Math.min(1, src[i] / 155), 0.9);
      const light = softReflection
        ? Math.pow(Math.min(1, Math.min(softReflection.data[i + 1], softReflection.data[i + 2]) / 180), 1.1)
        : 0;
      const sheen = light * (name === "SILVER WEAVE" ? 19 : name === "MICRO HOUNDSTOOTH" ? 8 : 14);
      for (let c = 0; c < 3; c++) out.data[i + c] = Math.min(255, Math.round(surface.data[t + c] * shape * darkDetail + sheen));
      out.data[i + 3] = alpha;
      continue;
    }
    // This leather has shallow embossing and a low, continuous satin reflection.
    // Blur the photograph's neutral light before reusing a restrained amount;
    // the hard patent highlight is never copied. Floral materials stay unchanged.
    const sheen = name === "BLACK SNAKE" && softReflection
      ? 60 * Math.pow(Math.min(1, Math.min(softReflection.data[i + 1], softReflection.data[i + 2]) / 180), 1.1)
      : 0;
    for (let c = 0; c < 3; c++) out.data[i + c] = Math.min(255, Math.round(material.data[t + c] * shade + sheen));
    out.data[i + 3] = alpha;
  }
  return out;
}

// Weak asset ownership lets decoded material previews disappear after logout.
// Cache encoded layers only; avoid retaining dozens of full RGBA photographs.
const caches = new WeakMap<SpecialPatternAssets, Map<string, Promise<string>>>();
export function loadPatternLayer(model: BootModel, part: PartId, name: SpecialPatternName, assets: SpecialPatternAssets): Promise<string> {
  if (!patternPartsFor(model, name).includes(part)) return Promise.reject(new Error("PATTERN_PART"));
  const texture = assets[name]?.texture;
  const url = photoLayerFor(part, "RED", { model });
  if (!texture || !url) return Promise.reject(new Error("PATTERN_UNAVAILABLE"));
  let cache = caches.get(assets);
  if (!cache) { cache = new Map(); caches.set(assets, cache); }
  const key = `${model}:${part}:${name}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const pending = (async () => {
    const source = new Image(), material = new Image(), metal = new Image();
    const sourceCanvas = document.createElement("canvas"), materialCanvas = document.createElement("canvas");
    try {
      source.src = url; material.src = texture;
      await Promise.all([source.decode(), material.decode()]);
      if (source.naturalWidth !== 1424 || source.naturalHeight !== 1392) throw new Error("PATTERN_SOURCE_SIZE");
      sourceCanvas.width = source.naturalWidth; sourceCanvas.height = source.naturalHeight;
      materialCanvas.width = material.naturalWidth; materialCanvas.height = material.naturalHeight;
      const ctx = sourceCanvas.getContext("2d", { willReadFrequently: true });
      const textureCtx = materialCanvas.getContext("2d", { willReadFrequently: true });
      if (!ctx || !textureCtx) throw new Error("PATTERN_CANVAS");
      ctx.drawImage(source, 0, 0); textureCtx.drawImage(material, 0, 0);
      const sourcePixels = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
      let softReflection: ImageData | undefined;
      let fineDetail: ImageData | undefined;
      let metalReflection: ImageData | undefined;
      const finish = finishFor(name);
      const metallic = isMetallicPattern(name);
      const lightProfile = surfaceLightProfile(name);
      if (metallic || lightProfile) {
        const metalUrl = photoLayerFor(part, "GOLD", { model });
        if (metalUrl) {
          metal.src = metalUrl;
          // A missing optional light map must not hide an otherwise available
          // material. RED remains the fallback and the sole alpha authority.
          const decoded = await metal.decode().then(() => true, () => false);
          if (decoded && metal.naturalWidth === source.naturalWidth && metal.naturalHeight === source.naturalHeight) {
            ctx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
            ctx.filter = `blur(${metallic ? (name === "BRONZE" ? 6 : 10) : lightProfile!.blur}px)`;
            ctx.drawImage(metal, 0, 0);
            ctx.filter = "none";
            metalReflection = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
          }
        }
      }
      if (finish) {
        ctx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
        ctx.filter = "blur(2px)";
        ctx.drawImage(source, 0, 0);
        ctx.filter = "none";
        fineDetail = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
      }
      if (lightProfile || metallic) {
        ctx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
        ctx.filter = `blur(${finish ? (finish.kind === "matte" ? 32 : 42) : name === "PINK GOLD" ? 26 : 18}px)`;
        ctx.drawImage(source, 0, 0);
        ctx.filter = "none";
        softReflection = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
      }
      const result = renderPatternPixels(sourcePixels,
        textureCtx.getImageData(0, 0, materialCanvas.width, materialCanvas.height), name, softReflection, fineDetail, part, metalReflection);
      await applyMaterialStitches(result, sourcePixels, model, part,
        name === "FLOWER B" || snakeMaterialFor(name) || name === "SILVER WEAVE" || name === "MICRO HOUNDSTOOTH" || metallic
          ? "dense" : name === "FLOWER C" ? "regular" : undefined);
      ctx.putImageData(result, 0, 0);
      return sourceCanvas.toDataURL("image/png");
    } finally {
      source.src = ""; material.src = ""; metal.src = "";
      sourceCanvas.width = sourceCanvas.height = materialCanvas.width = materialCanvas.height = 0;
    }
  })().catch(error => { cache!.delete(key); throw error; });
  cache.set(key, pending);
  return pending;
}

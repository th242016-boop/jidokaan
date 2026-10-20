import { partsForModel, photoLayerFor, type BootModel, type PartId } from "./simulator-config";
import { SPECIAL_FINISHES, finishFor } from "./special-finishes";
import { applyMaterialStitches } from "./material-stitches";

export const SPECIAL_PATTERNS = [
  { name: "FLOWER B", label: "FLOWER B" },
  { name: "FLOWER C", label: "FLOWER C" },
  { name: "BLACK SNAKE", label: "BLACK SNAKE" },
  { name: "WHITE SNAKE", label: "WHITE SNAKE" },
  ...SPECIAL_FINISHES,
] as const;
export type SpecialPatternName = typeof SPECIAL_PATTERNS[number]["name"];
export type SpecialPatternAssets = Partial<Record<SpecialPatternName, { texture: string; swatch: string }>>;
export type PatternSelections = Partial<Record<PartId, SpecialPatternName>>;
export type PatternLayers = Partial<Record<PartId, string>>;
export const isSpecialPattern = (name: string): name is SpecialPatternName =>
  SPECIAL_PATTERNS.some(pattern => pattern.name === name);
export const patternPartsFor = (model: BootModel, _name?: SpecialPatternName): PartId[] =>
  partsForModel({ model }).filter(part => part.type === "full" && part.id !== "l").map(part => part.id);

// Approximate motif sizes in the 1424×1392 photograph. They are visual previews,
// not a physical cutting layout; the references are finished shoes, not flat scans.
const TILE_SIZE: Partial<Record<SpecialPatternName, number>> = {
  "FLOWER B": 540, "FLOWER C": 650, "BLACK SNAKE": 420, "WHITE SNAKE": 420,
};

// Shared black scale topology is recolored monotonically: raised bright rims
// remain bright and recessed cells remain darker. Never invert the relief.
// The filter uses the same linear transfer for the protected source swatch.
export const WHITE_SNAKE_SWATCH_FILTER = "grayscale(1) contrast(0.15) brightness(1.92)";
export const whiteSnakeSurface = (r: number, g: number, b: number) =>
  Math.min(255, 208.08 + 0.288 * (0.2126 * r + 0.7152 * g + 0.0722 * b));

/** Map a flat material into the existing native silhouette, including lace holes.
 * RED provides the mask and diffuse dark details. Its neutral patent reflections
 * are not copied directly. Leather finishes use shared neutral microtexture and
 * independent base colors, with broad low-intensity light for surface curvature.
 */
export function renderPatternPixels(source: ImageData, material: ImageData, name: SpecialPatternName, softReflection?: ImageData, fineDetail?: ImageData): ImageData {
  const { width, height, data: src } = source;
  const out = new ImageData(width, height);
  const finish = finishFor(name);
  const tile = TILE_SIZE[name] ?? (finish?.kind === "suede" ? 420 : 600);
  // Neutral maps carry surface character only. Normalizing their average avoids
  // baking a black/gray photograph into all colors, especially white and yellow.
  let materialMean = 0;
  if (finish) {
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
    const u = (cos * dx - sin * dy + 18 * Math.sin(dy / 230)) / tile;
    const v = (sin * dx + cos * dy + 12 * Math.sin(dx / 190)) / tile;
    const tx = mirror(Math.floor(u * material.width), material.width);
    const ty = mirror(Math.floor(v * material.height), material.height);
    const t = (ty * material.width + tx) * 4;
    // Red-channel darkness retains seam/stitch detail without reusing the broad
    // white enamel highlights. The texture's own grain/specular detail remains.
    const shade = 0.2 + 0.8 * Math.pow(Math.min(1.04, src[i] / 235), 0.8);
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
    const source = new Image(), material = new Image();
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
      const finish = finishFor(name);
      if (finish) {
        ctx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
        ctx.filter = "blur(2px)";
        ctx.drawImage(source, 0, 0);
        ctx.filter = "none";
        fineDetail = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
      }
      if (name === "BLACK SNAKE" || name === "WHITE SNAKE" || finish) {
        ctx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
        ctx.filter = `blur(${finish ? (finish.kind === "matte" ? 32 : 42) : 18}px)`;
        ctx.drawImage(source, 0, 0);
        ctx.filter = "none";
        softReflection = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
      }
      const result = renderPatternPixels(sourcePixels,
        textureCtx.getImageData(0, 0, materialCanvas.width, materialCanvas.height), name, softReflection, fineDetail);
      await applyMaterialStitches(result, sourcePixels, model, part,
        name === "FLOWER B" ? "dense" : name === "FLOWER C" ? "regular" : undefined);
      ctx.putImageData(result, 0, 0);
      return sourceCanvas.toDataURL("image/png");
    } finally {
      source.src = ""; material.src = "";
      sourceCanvas.width = sourceCanvas.height = materialCanvas.width = materialCanvas.height = 0;
    }
  })().catch(error => { cache!.delete(key); throw error; });
  cache.set(key, pending);
  return pending;
}

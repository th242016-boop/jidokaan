import { partsForModel, photoLayerFor, type BootModel, type PartId } from "./simulator-config";

export const SPECIAL_PATTERNS = [
  { name: "FLOWER B", label: "FLOWER B" },
  { name: "FLOWER C", label: "FLOWER C" },
  { name: "BLACK SNAKE", label: "BLACK SNAKE" },
] as const;
export type SpecialPatternName = typeof SPECIAL_PATTERNS[number]["name"];
export type SpecialPatternAssets = Partial<Record<SpecialPatternName, { texture: string; swatch: string }>>;
export type PatternSelections = Partial<Record<PartId, SpecialPatternName>>;
export type PatternLayers = Partial<Record<PartId, string>>;
export const isSpecialPattern = (name: string): name is SpecialPatternName =>
  SPECIAL_PATTERNS.some(pattern => pattern.name === name);
export const patternPartsFor = (model: BootModel): PartId[] =>
  partsForModel({ model }).filter(part => part.type === "full" && part.id !== "l").map(part => part.id);

// Approximate motif sizes in the 1424×1392 photograph. They are visual previews,
// not a physical cutting layout; the references are finished shoes, not flat scans.
const TILE_SIZE: Record<SpecialPatternName, number> = { "FLOWER B": 540, "FLOWER C": 650, "BLACK SNAKE": 420 };

/** Map a flat material into the existing native silhouette, including lace holes.
 * RED provides the mask and diffuse dark details. Its neutral patent reflections
 * are deliberately not added: each material already carries its own texture.
 */
export function renderPatternPixels(source: ImageData, material: ImageData, name: SpecialPatternName): ImageData {
  const { width, height, data: src } = source;
  const out = new ImageData(width, height);
  const tile = TILE_SIZE[name];
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
    for (let c = 0; c < 3; c++) out.data[i + c] = Math.min(255, Math.round(material.data[t + c] * shade));
    out.data[i + 3] = alpha;
  }
  return out;
}

// Weak asset ownership lets decoded material previews disappear after logout.
// Cache encoded layers only; avoid retaining dozens of full RGBA photographs.
const caches = new WeakMap<SpecialPatternAssets, Map<string, Promise<string>>>();
export function loadPatternLayer(model: BootModel, part: PartId, name: SpecialPatternName, assets: SpecialPatternAssets): Promise<string> {
  if (!patternPartsFor(model).includes(part)) return Promise.reject(new Error("PATTERN_PART"));
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
      const result = renderPatternPixels(ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height),
        textureCtx.getImageData(0, 0, materialCanvas.width, materialCanvas.height), name);
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

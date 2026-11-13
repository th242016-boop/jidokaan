import { colorByName, partsForModel, photoLayerFor, type BootModel, type ColorOpt, type PartId } from "./simulator-config";

export type SpecialSolid = "GRAY" | "IVORY";
export const SPECIAL_SOLID_COLORS: ColorOpt[] = [
  colorByName("GRAY")!,
  // Warm cream from the jacket reference; neutral highlights remain white.
  { name: "IVORY", color: "#f8edd9", isBright: true },
];
export const isSpecialSolid = (name: string): name is SpecialSolid => name === "GRAY" || name === "IVORY";
// Keep new dyes private even if the historical public Special subset returns.
export const isPublicSpecialSolid = (name: string): boolean => name === "GRAY";
export const specialSolidColorsFor = (canUsePrivateCatalog: boolean): ColorOpt[] =>
  SPECIAL_SOLID_COLORS.filter(color => canUsePrivateCatalog || isPublicSpecialSolid(color.name));
export const specialSolidPartsFor = (model: BootModel): PartId[] =>
  partsForModel({ model }).filter(part => part.type === "full" && part.id !== "l").map(part => part.id);
type PartLayers = Partial<Record<PartId, string>>;
export type SpecialSolidLayers = Partial<Record<SpecialSolid, PartLayers>>;
const PATENT_RGB: Record<SpecialSolid, readonly [number, number, number]> = {
  GRAY: [122, 125, 132],
  IVORY: [248, 237, 217],
};

/** Preserve the source's exact alpha, shading, stitching and specular highlights.
 * In a red material photo, the neutral component is the reflected light; the
 * remaining red chroma is diffuse material color. Recolor only that component.
 * This is deliberately different from the matte mesh renderer.
 */
export function renderSolidPatent(source: ImageData, color: SpecialSolid): ImageData {
  const result = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
  const pigment = PATENT_RGB[color];
  for (let i = 0; i < result.data.length; i += 4) {
    if (!source.data[i + 3]) continue;
    const neutral = Math.min(source.data[i], source.data[i + 1], source.data[i + 2]);
    let diffuse = Math.max(0, source.data[i] - neutral);
    if (color === "IVORY" && diffuse > 0) {
      // Pale enamel returns more diffuse light than the photographed red dye.
      // Lift its midtones without tinting neutral reflections or opening the
      // deepest seam shadows. The GRAY transfer remains byte-for-byte intact.
      const capacity = 255 - neutral;
      const shade = diffuse / capacity;
      const shoulder = Math.max(0, Math.min(1, (shade - 0.15) / 0.35));
      const weight = shoulder * shoulder * (3 - 2 * shoulder);
      diffuse += (capacity * Math.pow(shade, 0.62) - diffuse) * weight;
    }
    for (let c = 0; c < 3; c++) result.data[i + c] = Math.round(neutral + diffuse * pigment[c] / 255);
  }
  return result;
}

export function renderGrayPatent(source: ImageData): ImageData {
  return renderSolidPatent(source, "GRAY");
}

// At most 2 colors × (10 high-cut sources + 3 mid-cut replacements). Cache
// encoded layers, not full-size decoded images, to keep phone memory bounded.
const layerCache = new Map<string, Promise<string>>();
export function loadSolidPatent(url: string, color: SpecialSolid): Promise<string> {
  const key = `${color}:${url}`;
  const cached = layerCache.get(key);
  if (cached) return cached;
  const pending = (async () => {
    const image = new Image();
    const canvas = document.createElement("canvas");
    try {
      image.src = url;
      await image.decode();
      if (image.naturalWidth !== 1424 || image.naturalHeight !== 1392) throw new Error("SPECIAL_SOLID_SIZE");
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("SPECIAL_SOLID_CANVAS");
      ctx.drawImage(image, 0, 0);
      ctx.putImageData(renderSolidPatent(ctx.getImageData(0, 0, canvas.width, canvas.height), color), 0, 0);
      return canvas.toDataURL("image/png");
    } finally { image.src = ""; canvas.width = canvas.height = 0; }
  })().catch(error => { layerCache.delete(key); throw error; });
  layerCache.set(key, pending);
  return pending;
}

export function loadGrayPatent(url: string): Promise<string> {
  return loadSolidPatent(url, "GRAY");
}

export async function loadSpecialSolidLayers(model: BootModel, signal?: AbortSignal): Promise<SpecialSolidLayers> {
  const result: SpecialSolidLayers = {};
  for (const color of ["GRAY", "IVORY"] as const) {
    const layers: PartLayers = {};
    for (const part of [...specialSolidPartsFor(model), "l" as const]) {
      if (signal?.aborted) throw new Error("SPECIAL_SOLID_ABORTED");
      const url = photoLayerFor(part, "RED", { model });
      if (!url) throw new Error("SPECIAL_SOLID_SOURCE");
      layers[part] = await loadSolidPatent(url, color);
    }
    result[color] = layers;
  }
  return result;
}

import { colorByName, partsForModel, photoLayerFor, type BootModel, type PartId } from "./simulator-config";

export type SpecialSolid = "GRAY";
export const SPECIAL_SOLID_COLORS = [colorByName("GRAY")!];
export const isSpecialSolid = (name: string): name is SpecialSolid => name === "GRAY";
export const specialSolidPartsFor = (model: BootModel): PartId[] =>
  partsForModel({ model }).filter(part => part.type === "full" && part.id !== "l").map(part => part.id);
export type SpecialSolidLayers = Partial<Record<PartId, string>>;

/** Preserve the source's exact alpha, shading, stitching and specular highlights.
 * In a red material photo, the neutral component is the reflected light; the
 * remaining red chroma is diffuse material color. Recolor only that component.
 * This is deliberately different from the matte mesh renderer.
 */
export function renderGrayPatent(source: ImageData): ImageData {
  const result = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
  const gray = [122, 125, 132]; // Existing GRAY swatch, #7a7d84.
  for (let i = 0; i < result.data.length; i += 4) {
    if (!source.data[i + 3]) continue;
    const neutral = Math.min(source.data[i], source.data[i + 1], source.data[i + 2]);
    const diffuse = Math.max(0, source.data[i] - neutral);
    for (let c = 0; c < 3; c++) result.data[i + c] = Math.round(neutral + diffuse * gray[c] / 255);
  }
  return result;
}

// At most the existing 10 high-cut sources plus 3 mid-cut replacements. Cache
// encoded layers, not full-size decoded images, to keep phone memory bounded.
const layerCache = new Map<string, Promise<string>>();
export function loadGrayPatent(url: string): Promise<string> {
  const cached = layerCache.get(url);
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
      ctx.putImageData(renderGrayPatent(ctx.getImageData(0, 0, canvas.width, canvas.height)), 0, 0);
      return canvas.toDataURL("image/png");
    } finally { image.src = ""; canvas.width = canvas.height = 0; }
  })().catch(error => { layerCache.delete(url); throw error; });
  layerCache.set(url, pending);
  return pending;
}

export async function loadSpecialSolidLayers(model: BootModel, signal?: AbortSignal): Promise<SpecialSolidLayers> {
  const result: SpecialSolidLayers = {};
  for (const part of [...specialSolidPartsFor(model), "l" as const]) {
    if (signal?.aborted) throw new Error("SPECIAL_SOLID_ABORTED");
    const url = photoLayerFor(part, "RED", { model });
    if (!url) throw new Error("SPECIAL_SOLID_SOURCE");
    result[part] = await loadGrayPatent(url);
  }
  return result;
}

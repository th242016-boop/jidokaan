// All nine lizard colorways use one raised-scale reference. The legacy black /
// white internal IDs remain compatible with saved selections; python is separate.
export const LIZARD_MATERIALS = [
  { name: "RED LIZARD", label: "RED LIZARD", color: "#c51d2b", rgb: [197, 29, 43] },
  { name: "ORANGE LIZARD", label: "ORANGE LIZARD", color: "#e85d04", rgb: [232, 93, 4] },
  { name: "YELLOW LIZARD", label: "YELLOW LIZARD", color: "#edc618", rgb: [237, 198, 24] },
  { name: "GREEN LIZARD", label: "GREEN LIZARD", color: "#0e7a32", rgb: [14, 122, 50] },
  { name: "BLUE LIZARD", label: "BLUE LIZARD", color: "#1546c4", rgb: [21, 70, 196] },
  { name: "NAVY LIZARD", label: "NAVY LIZARD", color: "#0a1858", rgb: [10, 24, 88] },
  { name: "PURPLE LIZARD", label: "PURPLE LIZARD", color: "#6b21a8", rgb: [107, 33, 168] },
] as const;

export const LIZARD_SURFACES = [
  { name: "BLACK SNAKE", label: "BLACK LIZARD", color: "#242629", rgb: [36, 38, 41] },
  { name: "WHITE SNAKE", label: "WHITE LIZARD", color: "#eeeeeb", rgb: [238, 238, 235] },
  ...LIZARD_MATERIALS,
] as const;

export type LizardMaterialName = typeof LIZARD_SURFACES[number]["name"];
export type LizardSwatches = Partial<Record<LizardMaterialName, string>>;
type LizardAssets = Partial<Record<LizardMaterialName, { swatch: string }>>;
export const lizardMaterialFor = (name: string) => LIZARD_SURFACES.find(material => material.name === name);
export const isLizardPattern = (name: string) =>
  name === "BLACK SNAKE" || name === "WHITE SNAKE" || Boolean(lizardMaterialFor(name));

const colorTables = new Map<LizardMaterialName, Uint8ClampedArray>();
for (const material of LIZARD_SURFACES) {
  const table = new Uint8ClampedArray(256 * 3);
  for (let luminance = 0; luminance < 256; luminance++) {
    // The shared raised-scale map carries both dark grooves and bright rims.
    // Keep the full range rather than lifting all pixels to nearly one color.
    const dyedRelief = 0.12 + 0.88 * Math.min(1, luminance / 32) ** 0.8;
    const rimReflection = (Math.max(0, luminance - 22) / 233) ** 0.78;
    for (let c = 0; c < 3; c++) {
      let value: number;
      if (material.name === "BLACK SNAKE") {
        // Open black midtones so curved cells remain readable at shoe scale;
        // retain deep crevices and the neutral rim light of the reference.
        value = 235 * (luminance / 255) ** 0.72;
      } else if (material.name === "WHITE SNAKE") {
        // White fields stay white, but the recessed scale boundaries retain
        // contrast. The former 208 + .288L transfer erased almost all relief.
        value = luminance <= 28
          ? material.rgb[c] * (luminance / 28) ** 0.32
          : material.rgb[c] + (255 - material.rgb[c]) * ((luminance - 28) / 227) ** 0.8;
      } else {
        const dyed = material.rgb[c] * dyedRelief;
        value = dyed + (255 - dyed) * rimReflection;
      }
      table[luminance * 3 + c] = Math.round(value);
    }
  }
  colorTables.set(material.name, table);
}

/** One transfer for both material rendering and selection swatches. */
export function recolorLizardPixels(source: ImageData, name: LizardMaterialName): ImageData {
  const result = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
  const table = colorTables.get(name)!;
  for (let i = 0; i < source.data.length; i += 4) {
    const t = Math.round(0.2126 * source.data[i] + 0.7152 * source.data[i + 1] + 0.0722 * source.data[i + 2]) * 3;
    result.data[i] = table[t];
    result.data[i + 1] = table[t + 1];
    result.data[i + 2] = table[t + 2];
  }
  return result;
}

// Decoded protected previews are owned weakly by their authenticated asset set.
const swatchCache = new WeakMap<LizardAssets, Promise<LizardSwatches>>();
export function loadLizardSwatches(assets: LizardAssets): Promise<LizardSwatches> {
  const cached = swatchCache.get(assets);
  if (cached) return cached;
  const pending = (async () => {
    const swatches: LizardSwatches = {};
    const image = new Image();
    const canvas = document.createElement("canvas");
    let previousSource: string | undefined;
    let pixels: ImageData | undefined;
    try {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("LIZARD_SWATCH_CANVAS");
      for (const material of LIZARD_SURFACES) {
        const swatch = assets[material.name]?.swatch;
        if (!swatch) continue;
        if (previousSource !== swatch) {
          image.src = swatch;
          await image.decode();
          canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
          ctx.drawImage(image, 0, 0);
          pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
          previousSource = swatch;
        }
        ctx.putImageData(recolorLizardPixels(pixels!, material.name), 0, 0);
        swatches[material.name] = canvas.toDataURL("image/png");
      }
      return swatches;
    } finally {
      image.src = "";
      canvas.width = canvas.height = 0;
    }
  })().catch(error => { swatchCache.delete(assets); throw error; });
  swatchCache.set(assets, pending);
  return pending;
}

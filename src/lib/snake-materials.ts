// All six colorways use the same photographed python topology. These colors
// describe the pale scale fields; the irregular dark markings stay charcoal.
export const SNAKE_MATERIALS = [
  { name: "NATURAL SNAKE", label: "NATURAL SNAKE", color: "#d5cfba", rgb: [213, 207, 186] },
  { name: "HOT PINK SNAKE", label: "HOT PINK SNAKE", color: "#d73694", rgb: [215, 54, 148] },
  { name: "ORANGE SNAKE", label: "ORANGE SNAKE", color: "#e76736", rgb: [231, 103, 54] },
  { name: "SKY BLUE SNAKE", label: "SKY BLUE SNAKE", color: "#24b1d9", rgb: [36, 177, 217] },
  { name: "GREEN SNAKE", label: "GREEN SNAKE", color: "#16a880", rgb: [22, 168, 128] },
  { name: "YELLOW SNAKE", label: "YELLOW SNAKE", color: "#e3ce3b", rgb: [227, 206, 59] },
] as const;

export type SnakeMaterialName = typeof SNAKE_MATERIALS[number]["name"];
export type SnakeSwatches = Partial<Record<SnakeMaterialName, string>>;
type SnakeAssets = Partial<Record<SnakeMaterialName, { swatch: string }>>;

export const snakeMaterialFor = (name: string) => SNAKE_MATERIALS.find(material => material.name === name);

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const colorTables = new Map<SnakeMaterialName, Uint8ClampedArray>();
for (const material of SNAKE_MATERIALS) {
  if (material.name === "NATURAL SNAKE") continue;
  const table = new Uint8ClampedArray(256 * 3);
  for (let luminance = 0; luminance < 256; luminance++) {
    // A smooth transition preserves the source's mottled/feathered pattern
    // boundaries. Dark printed patches are not dyed into a colored negative.
    const transition = clamp((luminance - 82) / 88);
    const field = transition * transition * (3 - 2 * transition);
    const charcoal = 18 + 0.45 * luminance;
    const scaleLight = 0.65 + 0.35 * clamp((luminance - 100) / 135);
    const glint = 15 * Math.pow(clamp((luminance - 225) / 30), 1.5);
    for (let c = 0; c < 3; c++) {
      const dyed = material.rgb[c] * scaleLight + glint;
      table[luminance * 3 + c] = Math.round(charcoal * (1 - field) + dyed * field);
    }
  }
  colorTables.set(material.name, table);
}

/** The exact same color transfer serves the material layer and its swatch. */
export function snakeSurface(r: number, g: number, b: number, name: SnakeMaterialName): readonly [number, number, number] {
  if (name === "NATURAL SNAKE") return [r, g, b];
  const table = colorTables.get(name)!;
  const i = Math.max(0, Math.min(255, Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b))) * 3;
  return [table[i], table[i + 1], table[i + 2]];
}

export function recolorSnakePixels(source: ImageData, name: SnakeMaterialName): ImageData {
  if (name === "NATURAL SNAKE") return source;
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

// Weak ownership permits the protected decoded previews to disappear on logout.
// Swatches are small, decoded once per asset set, and never use CSS tint filters.
const swatchCache = new WeakMap<SnakeAssets, Promise<SnakeSwatches>>();
export function loadSnakeSwatches(assets: SnakeAssets): Promise<SnakeSwatches> {
  const cached = swatchCache.get(assets);
  if (cached) return cached;
  const pending = (async () => {
    const swatches: SnakeSwatches = {};
    const image = new Image();
    const canvas = document.createElement("canvas");
    let previousSource: string | undefined;
    let pixels: ImageData | undefined;
    try {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("SNAKE_SWATCH_CANVAS");
      for (const material of SNAKE_MATERIALS) {
        const swatch = assets[material.name]?.swatch;
        if (!swatch) continue;
        if (material.name === "NATURAL SNAKE") { swatches[material.name] = swatch; continue; }
        if (previousSource !== swatch) {
          image.src = swatch;
          await image.decode();
          canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
          ctx.drawImage(image, 0, 0);
          pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
          previousSource = swatch;
        }
        ctx.putImageData(recolorSnakePixels(pixels!, material.name), 0, 0);
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

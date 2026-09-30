import {
  PHOTO_BASE,
  PHOTO_NATIVE,
  REAL_LAYERS,
  SIM_PARTS,
  colorByName,
  linkedLColor,
  type PartColorNames,
  type PartColors,
} from "./simulator-config";

export const ORDER_TERMS_VERSION = "2026-09-30-ems-design-v1";
export const DESIGN_VERSION = "simulator-photo-2026-09-30";

/** Stable specification identity; never merge two different custom designs. */
export function designKey(names?: Record<string, string>) {
  return names ? SIM_PARTS.map((p) => `${p.id}:${names[p.id] ?? ""}`).join("|") : "";
}

/** Missing historical information must not be silently replaced by white. */
export function completeDesign(value: unknown): PartColorNames | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const names = value as Record<string, unknown>;
  const result: Record<string, string> = {};
  for (const part of SIM_PARTS) {
    const name = names[part.id];
    if (typeof name !== "string" || !colorByName(name)) return null;
    if (name !== PHOTO_NATIVE[part.id] && !REAL_LAYERS[part.id]?.[name]) return null;
    result[part.id] = name;
  }
  const linked = linkedLColor(result.d, "", result.i, "", result.a, "");
  if (result.l !== linked.name) return null;
  return result as PartColorNames;
}

export function designColors(names: PartColorNames): PartColors {
  return Object.fromEntries(
    SIM_PARTS.map((p) => [p.id, colorByName(names[p.id])!.color]),
  ) as PartColors;
}

export function validDesignPreview(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length < 600_000 &&
    /^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/=]+$/.test(value)
  );
}

/** Same base, layer order and object-contain geometry as LayerSimulator. */
export async function captureDesign(names: PartColorNames): Promise<string> {
  if (!completeDesign(names)) throw new Error("DESIGN_REQUIRED");
  const sources = [
    PHOTO_BASE,
    ...SIM_PARTS.map((p) => REAL_LAYERS[p.id]?.[names[p.id]]).filter((s): s is string =>
      Boolean(s),
    ),
  ];
  const images = await Promise.all(
    sources.map(
      (src) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          const timeout = setTimeout(() => reject(new Error("DESIGN_IMAGE_TIMEOUT")), 20000);
          img.onload = () => {
            clearTimeout(timeout);
            resolve(img);
          };
          img.onerror = () => {
            clearTimeout(timeout);
            reject(new Error("DESIGN_IMAGE_FAILED"));
          };
          img.src = src;
        }),
    ),
  );
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1000;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("DESIGN_IMAGE_FAILED");
  ctx.fillStyle = "#121214";
  ctx.fillRect(0, 0, 1000, 1000);
  for (const img of images) {
    const ratio = Math.min(1000 / img.naturalWidth, 1000 / img.naturalHeight);
    const w = img.naturalWidth * ratio,
      h = img.naturalHeight * ratio;
    ctx.drawImage(img, (1000 - w) / 2, (1000 - h) / 2, w, h);
  }
  const preview = canvas.toDataURL("image/jpeg", 0.9);
  if (!validDesignPreview(preview)) throw new Error("DESIGN_IMAGE_FAILED");
  return preview;
}

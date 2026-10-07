import {
  photoBaseFor,
  photoLayerFor,
  partsForModel,
  modelOf,
  PHOTO_NATIVE,
  REAL_LAYERS,
  SIM_PARTS,
  colorByName,
  linkedLColor,
  type PartColorNames,
  type PartColors,
  type PartId,
} from "./simulator-config";

export const ORDER_TERMS_VERSION = "2026-10-01-shipping-buffer-v2";
export const DESIGN_VERSION = "simulator-photo-2026-09-30";

/** Stable specification identity; never merge two different custom designs. */
export function designKey(names?: Record<string, string>) {
  return names
    ? (modelOf(names) === "mid" ? "model:mid|" : "") +
        partsForModel(names)
          .map((p) => `${p.id}:${names[p.id] ?? ""}`)
          .join("|")
    : "";
}

/** Missing historical information must not be silently replaced by white. */
export function completeDesign(value: unknown): PartColorNames | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const names = value as Record<string, unknown>;
  if (names.model !== undefined && names.model !== "high" && names.model !== "mid") return null;
  const result: Record<string, string> = names.model === "mid" ? { model: "mid" } : {};
  for (const part of SIM_PARTS) {
    const name = names[part.id];
    if (typeof name !== "string" || !colorByName(name)) return null;
    if (name !== PHOTO_NATIVE[part.id] && !REAL_LAYERS[part.id]?.[name]) return null;
    if (names.model === "mid" && part.id === "g" && name !== "WHITE") return null;
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

function loadDesignImage(src: string, signal: AbortSignal | undefined, deadline: number) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("DESIGN_IMAGE_ABORTED"));
      return;
    }
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      reject(new Error("DESIGN_IMAGE_TIMEOUT"));
      return;
    }
    const img = new Image();
    let settled = false;
    const finish = (error?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
      img.onload = img.onerror = null;
      if (error) {
        img.src = "";
        reject(new Error(error));
      } else resolve(img);
    };
    const abort = () => finish("DESIGN_IMAGE_ABORTED");
    const timeout = setTimeout(() => finish("DESIGN_IMAGE_TIMEOUT"), remaining);
    signal?.addEventListener("abort", abort, { once: true });
    img.onload = () =>
      finish(img.naturalWidth > 0 && img.naturalHeight > 0 ? undefined : "DESIGN_IMAGE_FAILED");
    img.onerror = () => finish("DESIGN_IMAGE_FAILED");
    img.src = src;
  });
}

/** Same base, layer order and object-contain geometry as LayerSimulator.
 * Decode/draw/release one layer at a time; do not hold all full-size layers on phones.
 */
export async function captureDesign(
  names: PartColorNames,
  options: { signal?: AbortSignal; layerOverrides?: Partial<Record<PartId, string>> } = {},
): Promise<string> {
  if (!completeDesign(names)) throw new Error("DESIGN_REQUIRED");
  const sources = [
    photoBaseFor(names),
    ...partsForModel(names)
      .map((p) => options.layerOverrides?.[p.id] ?? photoLayerFor(p.id, names[p.id], names))
      .filter((s): s is string => Boolean(s)),
  ];
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1000;
  const deadline = Date.now() + 60_000;
  try {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("DESIGN_IMAGE_FAILED");
    ctx.fillStyle = "#121214";
    ctx.fillRect(0, 0, 1000, 1000);
    for (const src of sources) {
      const img = await loadDesignImage(src, options.signal, deadline);
      try {
        if (options.signal?.aborted) throw new Error("DESIGN_IMAGE_ABORTED");
        const ratio = Math.min(1000 / img.naturalWidth, 1000 / img.naturalHeight);
        const w = img.naturalWidth * ratio,
          h = img.naturalHeight * ratio;
        ctx.drawImage(img, (1000 - w) / 2, (1000 - h) / 2, w, h);
      } finally {
        img.src = "";
      }
    }
    // Keep the same 1000px composition; lower JPEG quality only if the order-size limit requires it.
    for (const quality of [0.9, 0.85, 0.8]) {
      const preview = canvas.toDataURL("image/jpeg", quality);
      if (validDesignPreview(preview)) return preview;
    }
    throw new Error("DESIGN_IMAGE_FAILED");
  } finally {
    canvas.width = canvas.height = 0;
  }
}

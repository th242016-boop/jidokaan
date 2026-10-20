import { photoBaseFor, type BootModel, type PartId } from "./simulator-config";

const WIDTH = 1424, HEIGHT = 1392;
type StitchSource = { original: ImageData; blurred: ImageData };
// Retain pixel data only (two native photographs per model), never images or
// canvas elements. The same native stitch positions serve every finish/color.
const sources = new Map<BootModel, Promise<StitchSource>>();

function stitchSource(model: BootModel): Promise<StitchSource> {
  const existing = sources.get(model);
  if (existing) return existing;
  const pending = (async () => {
    const image = new Image();
    const canvas = document.createElement("canvas");
    try {
      image.src = photoBaseFor({ model });
      await image.decode();
      if (image.naturalWidth !== WIDTH || image.naturalHeight !== HEIGHT) throw new Error("STITCH_SOURCE_SIZE");
      canvas.width = WIDTH; canvas.height = HEIGHT;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("STITCH_CANVAS");
      ctx.drawImage(image, 0, 0);
      const original = ctx.getImageData(0, 0, WIDTH, HEIGHT);
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.filter = "blur(2px)";
      ctx.drawImage(image, 0, 0);
      ctx.filter = "none";
      return { original, blurred: ctx.getImageData(0, 0, WIDTH, HEIGHT) };
    } finally {
      image.src = "";
      canvas.width = canvas.height = 0;
    }
  })().catch(error => { sources.delete(model); throw error; });
  sources.set(model, pending);
  return pending;
}

// These are selection corridors around photographed stitching, NOT visible
// strokes, added seams, or synthesized dash patterns. Both existing stitch rows
// are read from the native photograph inside a wide feathered corridor, then
// clipped to the original panel's narrow interior seam band.
const SEAM_CORRIDORS: Partial<Record<PartId, string>> = {
  b: "M473 1018 L413 1119 Q400 1144 430 1151 Q465 1155 490 1144 Q536 1122 570 1096 Q610 1070 650 1058 Q682 1048 700 1032 Q724 1002 737 963 L752 928 M927 840 L970 854",
  c: "M991 461 C1015 480 1028 493 1025 508 C1025 528 1011 548 1002 560 C986 589 979 614 977 636 M997 750 C1008 774 1015 801 1005 820",
};

function seamCorridor(part: PartId): Uint8ClampedArray | undefined {
  const path = SEAM_CORRIDORS[part];
  if (!path) return undefined;
  const canvas = document.createElement("canvas");
  try {
    canvas.width = WIDTH; canvas.height = HEIGHT;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("STITCH_CANVAS");
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    const geometry = new Path2D(path);
    for (const [width, opacity] of [[32, 0.25], [28, 0.65], [24, 1]]) {
      ctx.lineWidth = width;
      ctx.strokeStyle = `rgba(255,255,255,${opacity})`;
      ctx.stroke(geometry);
    }
    return ctx.getImageData(0, 0, WIDTH, HEIGHT).data;
  } finally { canvas.width = canvas.height = 0; }
}

// Other photographed patterned panels use only a narrow interior band to select
// genuine source detail. The distance mask never renders anything by itself.
function edgeDistances(source: ImageData): Float32Array {
  const { width, height, data } = source;
  const distance = new Float32Array(width * height);
  const diagonal = Math.SQRT2;
  for (let p = 0; p < distance.length; p++) distance[p] = data[p * 4 + 3] < 128 ? 0 : 32;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const p = y * width + x;
    if (!distance[p]) continue;
    let near = distance[p];
    if (x) near = Math.min(near, distance[p - 1] + 1);
    if (y) {
      near = Math.min(near, distance[p - width] + 1);
      if (x) near = Math.min(near, distance[p - width - 1] + diagonal);
      if (x + 1 < width) near = Math.min(near, distance[p - width + 1] + diagonal);
    }
    distance[p] = near;
  }
  for (let y = height - 1; y >= 0; y--) for (let x = width - 1; x >= 0; x--) {
    const p = y * width + x;
    if (!distance[p]) continue;
    let near = distance[p];
    if (x + 1 < width) near = Math.min(near, distance[p + 1] + 1);
    if (y + 1 < height) {
      near = Math.min(near, distance[p + width] + 1);
      if (x) near = Math.min(near, distance[p + width - 1] + diagonal);
      if (x + 1 < width) near = Math.min(near, distance[p + width + 1] + diagonal);
    }
    distance[p] = near;
  }
  return distance;
}

/** Restore real photographed stitch/hole contrast after material shading.
 * The exact result alpha, silhouette, material layout and all non-seam pixels
 * remain untouched. H/J have no resolvable thread detail and are skipped.
 */
export async function applyMaterialStitches(result: ImageData, source: ImageData, model: BootModel, part: PartId, floral?: "dense" | "regular"): Promise<void> {
  if (!["b", "c", "d", "e", "f", "g", "i"].includes(part)) return;
  if (result.width !== WIDTH || result.height !== HEIGHT || source.width !== WIDTH || source.height !== HEIGHT) {
    throw new Error("STITCH_LAYER_SIZE");
  }
  const reference = await stitchSource(model);
  const corridor = seamCorridor(part);
  const distances = edgeDistances(source);
  const native = reference.original.data, blurred = reference.blurred.data;
  for (let p = 0; p < WIDTH * HEIGHT; p++) {
    const i = p * 4;
    if (source.data[i + 3] < 128) continue;
    const d = distances[p];
    const interior = corridor
      ? Math.max(0, Math.min(1, (d - 1.5) / 1.5, (16 - d) / 2))
      : Math.max(0, Math.min(1, (d - 2) / 2, (14 - d) / 2));
    const weight = interior * (corridor ? corridor[i + 3] / 255 : 1);
    if (!weight) continue;
    const gray = 0.2126 * native[i] + 0.7152 * native[i + 1] + 0.0722 * native[i + 2];
    const local = 0.2126 * blurred[i] + 0.7152 * blurred[i + 1] + 0.0722 * blurred[i + 2];
    const residual = gray - local;
    // Ignore low-level JPEG noise. Both dark needle holes and bright thread rims
    // survive; an additive pass remains legible on black unlike multiplication.
    const detail = Math.sign(residual) * Math.max(0, Math.abs(residual) - 2.4);
    if (floral) {
      // Printed motifs must not color the thread itself. Restore a restrained
      // ivory rim and needle-hole shadow only where the actual photograph has
      // local seam detail. A simple additive pass disappears in dense crackle.
      const amount = Math.min(floral === "dense" ? 0.90 : 0.78, Math.abs(detail) / (floral === "dense" ? 12 : 18)) * weight * source.data[i + 3] / 255;
      const thread = detail > 0 ? [238, 234, 225] : [70, 62, 55];
      for (let c = 0; c < 3; c++) result.data[i + c] = Math.round(result.data[i + c] * (1 - amount) + thread[c] * amount);
      continue;
    }
    const contrast = Math.max(-30, Math.min(35, detail * 2.1)) * weight * source.data[i + 3] / 255;
    if (!contrast) continue;
    for (let c = 0; c < 3; c++) result.data[i + c] = Math.max(0, Math.min(255, Math.round(result.data[i + c] + contrast)));
  }
}

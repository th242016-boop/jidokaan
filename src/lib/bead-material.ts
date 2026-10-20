import type { MeshLacePixels } from "./mesh-laces";
import type { BootModel } from "./simulator-config";

export const BEAD_COLORS = ["GOLD", "SILVER", "RED", "ORANGE", "YELLOW", "GREEN", "BLUE", "NAVY", "PURPLE"] as const;
export type BeadColor = typeof BEAD_COLORS[number];
export type BeadSelection = "NONE" | BeadColor;

const COLORS: Record<BeadColor, readonly [number, number, number]> = {
  GOLD: [184, 140, 46], SILVER: [156, 164, 174],
  RED: [190, 18, 42], ORANGE: [223, 85, 15], YELLOW: [225, 178, 12],
  GREEN: [18, 125, 65], BLUE: [22, 80, 190], NAVY: [12, 31, 84], PURPLE: [101, 35, 148],
};
export const beadColorHex = (color: BeadColor) => "#" + COLORS[color].map(channel => channel.toString(16).padStart(2, "0")).join("");

/** The high-cut upper shaft window is already a disconnected A component.
 * Keep every original alpha value, including its antialiased edge. Mid-cut has
 * no G separator and no closed equivalent window, so it deliberately has none.
 */
export function createBeadMask(source: MeshLacePixels, model: BootModel): Uint8Array | undefined {
  if (model !== "high") return undefined;
  const { width, height, white } = source;
  if (width !== 1424 || height !== 1392) throw new Error("BEAD_SOURCE_SIZE");
  const mask = new Uint8Array(width * height);
  const queue = new Int32Array(mask.length);
  const seed = 310 * width + 680;
  if (!white[seed * 4 + 3]) throw new Error("BEAD_SEED_OUTSIDE_SOURCE");
  let head = 0, tail = 1;
  queue[0] = seed; mask[seed] = white[seed * 4 + 3];
  while (head < tail) {
    const p = queue[head++];
    for (const next of [p - 1, p + 1, p - width, p + width]) {
      if (next < 0 || next >= mask.length || mask[next] || !white[next * 4 + 3]) continue;
      if (Math.abs(next - p) === 1 && Math.floor(next / width) !== Math.floor(p / width)) continue;
      mask[next] = white[next * 4 + 3];
      queue[tail++] = next;
    }
  }
  // A changed or accidentally connected mask must not spill into the lower mesh.
  if (tail < 38000 || tail > 45000) throw new Error("BEAD_COMPONENT_CHANGED");
  return mask;
}

const lightCache = new WeakMap<Uint8Array, Float32Array>();
function broadLight(source: MeshLacePixels, mask: Uint8Array): Float32Array {
  const existing = lightCache.get(mask);
  if (existing) return existing;
  const sourceCanvas = document.createElement("canvas"), blurredCanvas = document.createElement("canvas");
  try {
    sourceCanvas.width = blurredCanvas.width = source.width;
    sourceCanvas.height = blurredCanvas.height = source.height;
    const ctx = sourceCanvas.getContext("2d"), blurred = blurredCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx || !blurred) throw new Error("BEAD_CANVAS");
    const pixels = new Uint8ClampedArray(source.white);
    for (let p = 0; p < mask.length; p++) pixels[p * 4 + 3] = mask[p];
    ctx.putImageData(new ImageData(pixels, source.width, source.height), 0, 0);
    // Remove the photographed mesh lattice. Only broad shoe lighting survives.
    blurred.filter = "blur(9px)";
    blurred.drawImage(sourceCanvas, 0, 0);
    const rgba = blurred.getImageData(0, 0, source.width, source.height).data;
    const light = new Float32Array(mask.length);
    for (let p = 0; p < mask.length; p++) if (mask[p]) {
      const i = p * 4;
      light[p] = Math.max(0.64, Math.min(1.08, (rgba[i] * .2126 + rgba[i + 1] * .7152 + rgba[i + 2] * .0722) / 218));
    }
    lightCache.set(mask, light);
    return light;
  } finally {
    sourceCanvas.width = sourceCanvas.height = blurredCanvas.width = blurredCanvas.height = 0;
  }
}

function hash(x: number, y: number, salt: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(salt, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Tiny irregular facets, approximately 1–3 native pixels, match the dense fine
// glitter in the supplied reference. No large gems, drawn stars, or mesh grid.
function beadPixel(x: number, y: number, color: BeadColor, light: number): readonly [number, number, number] {
  const u = (x * .83 + y * .56) / 2.6, v = (-x * .56 + y * .83) / 2.6;
  const cellX = Math.floor(u), cellY = Math.floor(v);
  let nearest = Infinity, second = Infinity, bestX = 0, bestY = 0, dx = 0, dy = 0;
  for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
    const gx = cellX + ox, gy = cellY + oy;
    const px = gx + .2 + hash(gx, gy, 1) * .6, py = gy + .2 + hash(gx, gy, 2) * .6;
    const vx = u - px, vy = v - py, distance = vx * vx + vy * vy;
    if (distance < nearest) {
      second = nearest; nearest = distance; bestX = gx; bestY = gy; dx = vx; dy = vy;
    } else second = Math.min(second, distance);
  }
  const face = dx * .8 + dy < 0;
  const facet = (.48 + hash(bestX, bestY, 3) * .72) * (face ? 1.12 : .82);
  const edge = Math.min(1, .62 + (second - nearest) * 2.8);
  const sparkle = hash(bestX, bestY, 4);
  const reflection = face && sparkle > .78 ? .12 + (sparkle - .78) * 2.8 : .012 + sparkle * .045;
  const micro = (hash(x, y, 5) - .5) * 7;
  const base = COLORS[color], rim = color === "GOLD" ? [255, 237, 169] : [255, 255, 255];
  return base.map((channel, c) => Math.max(0, Math.min(255, Math.round(
    channel * facet * edge * light * (1 - reflection) + rim[c] * reflection * (.74 + .26 * light) + micro,
  )))) as unknown as readonly [number, number, number];
}

/** Compose inside A before the surrounding leather panels are drawn. RGB only:
 * alpha and all pixels outside the selected original upper window stay intact.
 */
export function renderBeads(result: ImageData, source: MeshLacePixels, mask: Uint8Array | undefined, color: BeadSelection): void {
  if (color === "NONE" || !mask) return;
  if (!BEAD_COLORS.includes(color)) throw new Error("BEAD_COLOR");
  if (result.width !== source.width || result.height !== source.height || mask.length !== source.width * source.height) throw new Error("BEAD_LAYER_SIZE");
  const light = broadLight(source, mask);
  for (let p = 0; p < mask.length; p++) if (mask[p]) {
    const rgb = beadPixel(p % source.width, Math.floor(p / source.width), color, light[p]);
    const i = p * 4;
    result.data[i] = rgb[0]; result.data[i + 1] = rgb[1]; result.data[i + 2] = rgb[2];
  }
}

const swatches = new Map<BeadColor, string>();
export function beadSwatchDataUrl(color: BeadColor): string {
  const existing = swatches.get(color);
  if (existing) return existing;
  const canvas = document.createElement("canvas");
  try {
    canvas.width = canvas.height = 80;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("BEAD_CANVAS");
    const pixels = ctx.createImageData(80, 80);
    for (let p = 0; p < 80 * 80; p++) {
      const rgb = beadPixel(p % 80, Math.floor(p / 80), color, 1), i = p * 4;
      pixels.data[i] = rgb[0]; pixels.data[i + 1] = rgb[1]; pixels.data[i + 2] = rgb[2]; pixels.data[i + 3] = 255;
    }
    ctx.putImageData(pixels, 0, 0);
    const url = canvas.toDataURL("image/png"); swatches.set(color, url); return url;
  } finally { canvas.width = canvas.height = 0; }
}

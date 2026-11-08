// Sample the owner's original photograph, excluding hands and the rolled edge.
// The source remains unchanged; the swatch and renderer share this square crop.
export const FLOWER_D_CROP = [170 / 1153, 130 / 2048, 960 / 1153, 960 / 2048] as const;
// Calibrated visually against the supplied finished-shoe example, in the native
// 1424×1392 view. This is not a millimeter-accurate manufacturing cutting plan.
export const FLOWER_D_TILE = 360;
export const FLOWER_D_LIGHT = { blur: 26, floor: 0.38, peak: 1.10, sheen: 0.010 };
export const FLOWER_D_CUT_ANGLES: Record<string, number> = {
  b: -0.08, c: 0.06, d: 0.13, e: -0.04, f: 0.09,
  g: -0.10, h: 0.04, i: -0.06, j: 0.12,
};

/** Overlap a narrow crop margin for continuous repetition without reflecting
 * recognizable flowers/leaves. Only the 6% join is blended; the rest of the
 * photographic print is untouched. Generated at runtime, never a new drawing. */
export function flowerDRepeatTexture(source: ImageData): ImageData {
  const overlapX = Math.max(1, Math.round(source.width * 0.06));
  const overlapY = Math.max(1, Math.round(source.height * 0.06));
  const width = source.width - overlapX, height = source.height - overlapY;
  const out = new ImageData(width, height);
  const smooth = (v: number) => v * v * (3 - 2 * v);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const blendX = x < overlapX, blendY = y < overlapY;
    const wx = blendX ? smooth(x / overlapX) : 1;
    const wy = blendY ? smooth(y / overlapY) : 1;
    const x2 = blendX ? x + width : x, y2 = blendY ? y + height : y;
    for (let channel = 0; channel < 4; channel++) {
      const top = source.data[(y * source.width + x) * 4 + channel] * wx
        + source.data[(y * source.width + x2) * 4 + channel] * (1 - wx);
      const bottom = source.data[(y2 * source.width + x) * 4 + channel] * wx
        + source.data[(y2 * source.width + x2) * 4 + channel] * (1 - wx);
      out.data[(y * width + x) * 4 + channel] = Math.round(top * wy + bottom * (1 - wy));
    }
  }
  return out;
}

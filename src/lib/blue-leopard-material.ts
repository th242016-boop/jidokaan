// Royal/cobalt blue satin-like leopard from the owner's jacket reference.
// Visually calibrated in the native shoe photograph, not a measured cutting plan.
export const BLUE_LEOPARD_TILE = 420;
export const BLUE_LEOPARD_LIGHT = { blur: 24, floor: 0.36, peak: 1.16, sheen: 0.022 };

/** Join only a 6% edge strip. Keep the identifiable satin rosettes unmirrored
 * and leave interior pixels outside the overlap unchanged. */
export function blueLeopardRepeatTexture(source: ImageData): ImageData {
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

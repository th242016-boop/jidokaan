// The darker reference distinguishes white dividers from reflective foil faces.
// Its black cells are reflected surroundings, not black pigment. Use the shoe's
// photographed light field to relight them, retaining source microrelief.
// This is calibrated 2D photographic relighting, not a measured 3D BRDF.
// This smaller phase-matched patch reduces the photographed repeat boundary.
// Keep the same 0.5 source-to-shoe scale when changing the crop's dimensions.
export const SILVER_SNAKE_CROP = [302 / 590, 177 / 831, 72 / 590, 72 / 831] as const;
export const SILVER_SNAKE_TILE = 36;
export const SILVER_SNAKE_LIGHT = { blur: 8, floor: 0.28, peak: 1.15, sheen: 0.82 };

export function silverSnakeLinear(luminance: number, illumination: number): number {
  const light = Math.max(0, Math.min(1, illumination));
  const edge = Math.max(0, Math.min(1, (luminance - 105) / 115));
  const divider = edge * edge * (3 - 2 * edge);
  // Keep the photographed foil's small irregularities; do not add random
  // glitter or preserve the reference photograph's broad black reflection.
  const microrelief = Math.max(0, Math.min(1, (luminance - 16) / 90));
  const foil = 0.070 + 0.180 * light
    + 0.75 * light ** 2.1 * (0.78 + 0.22 * microrelief);
  const rim = (0.60 + 0.12 * Math.max(0, Math.min(1, luminance / 255)))
    * (0.54 + 0.46 * light) + 0.018 * light ** 2;
  return Math.min(0.97, foil * (1 - divider) + rim * divider);
}

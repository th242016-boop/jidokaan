// Original photographed mint bed and gold foil caps are different surfaces.
// Preserve their photographed outlines and microrelief; relight the two surfaces
// independently using the shoe's existing fixed-view light field. This is a
// photographic approximation, not a measured angular/iridescent BRDF.
export const MINT_GOLD_PEARL_CROP = [616 / 1153, 240 / 2048, 142 / 1153, 142 / 2048] as const;
export const MINT_GOLD_PEARL_TILE = 74;
export const MINT_GOLD_PEARL_LIGHT = { blur: 9, floor: 0.38, peak: 1.12, sheen: 0.72 };

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const linear = (value: number) => {
  const srgb = value / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
};
const mint = [129, 189, 163].map(linear);
const gold = [238, 205, 124].map(linear);
const pearl = [255, 246, 200].map(linear);

export function mintGoldPearlLinear(r: number, g: number, b: number, illumination: number): readonly [number, number, number] {
  const light = clamp(illumination);
  // Mint is distinctly greener than red. Gold stays warm even when a cap
  // reflects a dark surrounding object, so luminance alone is not a foil mask.
  const warm = clamp((r / Math.max(1, g) - 0.82) / 0.17);
  const foil = warm * warm * (3 - 2 * warm);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const relief = clamp((luminance - 45) / 195);
  const mintShape = (0.40 + 0.68 * light ** 0.85) * (0.90 + 0.10 * relief);
  const goldShape = 0.055 + 0.15 * light;
  // Source microrelief modulates actual small highlights; no random glitter.
  // In low light the mint bed dominates; toward the light the gold faces flash.
  const reflection = 0.78 * light ** 2.25 * (0.40 + 0.60 * relief ** 1.3);
  return [0, 1, 2].map(channel => Math.min(0.98,
    mint[channel] * mintShape * (1 - foil)
    + (gold[channel] * goldShape + pearl[channel] * reflection) * foil
  )) as [number, number, number];
}

// Reference-reconstructed atlas includes large belly rectangles, smaller squared
// plates and rounded flank scales together. The old small upper-photo crop
// omitted the other shapes. Use the whole atlas, never that small repeating cut.
export const WINE_CROCODILE_CROP = [0, 0, 1, 1] as const;
// A broad independent cut per panel avoids a grid of identical tiny repeats.
// Visual scale is approximate; this reconstructed atlas is not a cutting layout.
export const WINE_CROCODILE_TILE = 720;
// Broad, restrained satin. This is not the metallic/pearl light response.
export const WINE_CROCODILE_LIGHT = { blur: 30, floor: 0.58, peak: 1.16, sheen: 0.012 };

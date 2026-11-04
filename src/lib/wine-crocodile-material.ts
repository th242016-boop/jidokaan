// Reference-reconstructed atlas includes large belly rectangles, smaller squared
// plates and rounded flank scales together. The old small upper-photo crop
// omitted the other shapes. Use the whole atlas, never that small repeating cut.
export const WINE_CROCODILE_CROP = [0, 0, 1, 1] as const;
// Keep the approved atlas calibration as the reference, then reduce motif pitch
// after the panel extent calculation. Reducing only the tile would be cancelled
// by the fit-to-panel guard on broad B and tall E.
export const WINE_CROCODILE_TILE = 720;
export const WINE_CROCODILE_SCALE = 0.7;
// Normalized material regions: belly plates for B/C, smaller squared cells for
// the narrow upper panels. Coordinates select leather, not a new dye or finish.
export const WINE_CROCODILE_LARGE_REGION = [0, 535 / 1254, 735 / 1254, 719 / 1254] as const;
export const WINE_CROCODILE_SMALL_REGION = [385 / 1254, 0, 869 / 1254, 490 / 1254] as const;
// Broad, restrained satin. This is not the metallic/pearl light response.
export const WINE_CROCODILE_LIGHT = { blur: 30, floor: 0.58, peak: 1.16, sheen: 0.012 };

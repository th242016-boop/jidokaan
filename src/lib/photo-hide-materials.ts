import type { PartId } from "./simulator-config";

export const PHOTO_HIDES = [
  { name: "NAVY CRACK", label: "네이비 크랙", file: "navy-crack",
    face: { floor: 31, span: 67 },
    light: { blur: 21, floor: 0.54, peak: 1.15, sheen: 0.040 } },
  { name: "REAL CROCODILE", label: "리얼 크로커다일", file: "real-crocodile",
    face: { floor: 46, span: 84 },
    light: { blur: 17, floor: 0.50, peak: 1.15, sheen: 0.085 } },
  { name: "WHITE PYTHON", label: "화이트 뱀피", file: "white-python",
    // Light shallow embossing, not metallic silver or patent white. Let the
    // photographed grooves stay outlined when the raised scales catch light.
    face: { floor: 217, span: 28 },
    light: { blur: 26, floor: 0.82, peak: 1.055, sheen: 0.013 } },
] as const;

export const photoHideFor = (name: string) => PHOTO_HIDES.find(hide => hide.name === name);

// Projected pixel dimensions in the native 1424 × 1392 shoe photograph.
// Navy: retain the photographed tile's aspect ratio (the rows are not square).
// Croc: choose one square cut from a two-column atlas. B/C are broad belly
// plates; smaller pieces use the flank. No panel crosses the join of the atlas.
export function photoHideCut(hide: typeof PHOTO_HIDES[number], part: PartId) {
  if (hide.name === "NAVY CRACK") return { column: 0, columns: 1, tileW: 145, tileH: 145 * 434 / 361 };
  if (hide.name === "WHITE PYTHON") return { column: 0, columns: 1, tileW: 284, tileH: 284 * 520 / 800 };
  const belly = part === "b" || part === "c";
  const pitch = belly ? 270 : 192;
  return { column: belly ? 0 : 1, columns: 2, tileW: pitch, tileH: pitch };
}

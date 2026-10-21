// A finish is a shared neutral surface plus a base color, not a separately
// retouched photograph per color. Keep existing names valid for saved drafts.
// White and gray are separate stocked choices in each material family.
export const SPECIAL_FINISHES = [
  { name: "MATTE RED", label: "MATTE RED", kind: "matte", color: "#c51d2b", rgb: [197, 29, 43], assetKey: "matte-black" },
  { name: "MATTE ORANGE", label: "MATTE ORANGE", kind: "matte", color: "#e85d04", rgb: [232, 93, 4], assetKey: "matte-black" },
  { name: "MATTE YELLOW", label: "MATTE YELLOW", kind: "matte", color: "#edc618", rgb: [237, 198, 24], assetKey: "matte-black" },
  { name: "MATTE GREEN", label: "MATTE GREEN", kind: "matte", color: "#0e7a32", rgb: [14, 122, 50], assetKey: "matte-black" },
  { name: "MATTE BLUE", label: "MATTE BLUE", kind: "matte", color: "#1546c4", rgb: [21, 70, 196], assetKey: "matte-black" },
  { name: "MATTE NAVY", label: "MATTE NAVY", kind: "matte", color: "#0a1858", rgb: [10, 24, 88], assetKey: "matte-black" },
  { name: "MATTE PURPLE", label: "MATTE PURPLE", kind: "matte", color: "#6b21a8", rgb: [107, 33, 168], assetKey: "matte-black" },
  { name: "MATTE KHAKI", label: "MATTE KHAKI", kind: "matte", color: "#737044", rgb: [115, 112, 68], assetKey: "matte-black" },
  { name: "MATTE PINK", label: "MATTE PINK", kind: "matte", color: "#e07aa8", rgb: [224, 122, 168], assetKey: "matte-black" },
  { name: "MATTE WHITE", label: "MATTE WHITE", kind: "matte", color: "#ffffff", rgb: [255, 255, 255], assetKey: "matte-black" },
  { name: "MATTE GRAY", label: "MATTE GRAY", kind: "matte", color: "#cdcdcd", rgb: [205, 205, 205], assetKey: "matte-black" },
  { name: "MATTE BLACK", label: "MATTE BLACK", kind: "matte", color: "#242629", rgb: [36, 38, 41], assetKey: "matte-black" },
  { name: "RED SUEDE", label: "RED SUEDE", kind: "suede", color: "#c51d2b", rgb: [197, 29, 43], assetKey: "black-suede" },
  { name: "ORANGE SUEDE", label: "ORANGE SUEDE", kind: "suede", color: "#e85d04", rgb: [232, 93, 4], assetKey: "black-suede" },
  { name: "YELLOW SUEDE", label: "YELLOW SUEDE", kind: "suede", color: "#edc618", rgb: [237, 198, 24], assetKey: "black-suede" },
  { name: "GREEN SUEDE", label: "GREEN SUEDE", kind: "suede", color: "#0e7a32", rgb: [14, 122, 50], assetKey: "black-suede" },
  { name: "BLUE SUEDE", label: "BLUE SUEDE", kind: "suede", color: "#1546c4", rgb: [21, 70, 196], assetKey: "black-suede" },
  { name: "NAVY SUEDE", label: "NAVY SUEDE", kind: "suede", color: "#0a1858", rgb: [10, 24, 88], assetKey: "black-suede" },
  { name: "PURPLE SUEDE", label: "PURPLE SUEDE", kind: "suede", color: "#6b21a8", rgb: [107, 33, 168], assetKey: "black-suede" },
  { name: "KHAKI SUEDE", label: "KHAKI SUEDE", kind: "suede", color: "#737044", rgb: [115, 112, 68], assetKey: "black-suede" },
  { name: "PINK SUEDE", label: "PINK SUEDE", kind: "suede", color: "#e07aa8", rgb: [224, 122, 168], assetKey: "black-suede" },
  { name: "WHITE SUEDE", label: "WHITE SUEDE", kind: "suede", color: "#ffffff", rgb: [255, 255, 255], assetKey: "black-suede" },
  { name: "GRAY SUEDE", label: "GRAY SUEDE", kind: "suede", color: "#cdcdcd", rgb: [205, 205, 205], assetKey: "black-suede" },
  { name: "BLACK SUEDE", label: "BLACK SUEDE", kind: "suede", color: "#242629", rgb: [36, 38, 41], assetKey: "black-suede" },
] as const;

export type SpecialFinishName = typeof SPECIAL_FINISHES[number]["name"];
export const finishFor = (name: string) => SPECIAL_FINISHES.find(finish => finish.name === name);

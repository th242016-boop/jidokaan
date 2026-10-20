// A finish is a shared neutral surface plus a base color, not a separately
// retouched photograph per color. Keep the original black names for old drafts.
export const SPECIAL_FINISHES = [
  { name: "MATTE BLACK", label: "MATTE BLACK", kind: "matte", color: "#242629", rgb: [36, 38, 41], assetKey: "matte-black" },
  { name: "MATTE WHITE", label: "MATTE WHITE", kind: "matte", color: "#e6e5e1", rgb: [230, 229, 225], assetKey: "matte-black" },
  { name: "MATTE RED", label: "MATTE RED", kind: "matte", color: "#c51d2b", rgb: [197, 29, 43], assetKey: "matte-black" },
  { name: "MATTE YELLOW", label: "MATTE YELLOW", kind: "matte", color: "#edc618", rgb: [237, 198, 24], assetKey: "matte-black" },
  { name: "BLACK SUEDE", label: "BLACK SUEDE", kind: "suede", color: "#242629", rgb: [36, 38, 41], assetKey: "black-suede" },
  { name: "WHITE SUEDE", label: "WHITE SUEDE", kind: "suede", color: "#e6e5e1", rgb: [230, 229, 225], assetKey: "black-suede" },
  { name: "RED SUEDE", label: "RED SUEDE", kind: "suede", color: "#c51d2b", rgb: [197, 29, 43], assetKey: "black-suede" },
  { name: "YELLOW SUEDE", label: "YELLOW SUEDE", kind: "suede", color: "#edc618", rgb: [237, 198, 24], assetKey: "black-suede" },
] as const;

export type SpecialFinishName = typeof SPECIAL_FINISHES[number]["name"];
export const finishFor = (name: string) => SPECIAL_FINISHES.find(finish => finish.name === name);

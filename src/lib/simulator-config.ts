/** JIDOKAAN custom studio */

export type ColorOpt = {
  name: string;
  color: string;
  isBright: boolean;
  finish?: "solid" | "gold" | "silver";
};

export type PartId =
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "g"
  | "h"
  | "i"
  | "j"
  | "k"
  | "l";

export type PartDef = {
  id: PartId;
  file: string;
  label: string;
  hint: { ko: string; en: string; ja: string };
  /** A mesh + K outsole: white/black only */
  type: "basic" | "full";
};

export const BASIC_COLORS: ColorOpt[] = [
  { name: "WHITE", color: "#f3f3f5", isBright: true },
  { name: "BLACK", color: "#141414", isBright: false },
];

export const FULL_COLORS: ColorOpt[] = [
  { name: "RED", color: "#c20d12", isBright: false },
  { name: "ORANGE", color: "#e85d04", isBright: false },
  { name: "YELLOW", color: "#f0cc00", isBright: true },
  { name: "GREEN", color: "#0e7a32", isBright: false },
  { name: "BLUE", color: "#1546c4", isBright: false },
  { name: "NAVY", color: "#0a1858", isBright: false },
  { name: "PURPLE", color: "#6b21a8", isBright: false },
  { name: "WHITE", color: "#f3f3f5", isBright: true },
  { name: "BLACK", color: "#141414", isBright: false },
  { name: "GOLD", color: "#c9a227", isBright: true, finish: "gold" },
  { name: "SILVER", color: "#c5c8ce", isBright: true, finish: "silver" },
  { name: "MINT", color: "#3aa89a", isBright: false },
  { name: "PINK", color: "#e07aa8", isBright: false },
  { name: "SKY BLUE", color: "#7ec8e3", isBright: true },
  { name: "GRAY", color: "#7a7d84", isBright: false },
];

export const SIM_PARTS: PartDef[] = [
  {
    id: "a",
    file: "a.png",
    label: "A",
    hint: { ko: "메쉬 (끈 포함)", en: "Mesh + laces", ja: "メッシュ" },
    type: "basic",
  },
  {
    id: "b",
    file: "b.png",
    label: "B",
    hint: { ko: "사이드 패널", en: "Side panel", ja: "サイドパネル" },
    type: "full",
  },
  {
    id: "c",
    file: "c.png",
    label: "C",
    hint: { ko: "힐 카운터", en: "Heel counter", ja: "ヒール" },
    type: "full",
  },
  {
    id: "d",
    file: "d.png",
    label: "D",
    hint: { ko: "토 박스", en: "Toe box", ja: "トゥボックス" },
    type: "full",
  },
  {
    id: "e",
    file: "e.png",
    label: "E",
    hint: { ko: "스트라이프", en: "Stripe", ja: "ストライプ" },
    type: "full",
  },
  {
    id: "f",
    file: "f.png",
    label: "F",
    hint: { ko: "칼라 / 발목", en: "Collar", ja: "カラー" },
    type: "full",
  },
  {
    id: "g",
    file: "g.png",
    label: "G",
    hint: { ko: "텅", en: "Tongue", ja: "タン" },
    type: "full",
  },
  {
    id: "h",
    file: "h.png",
    label: "H",
    hint: { ko: "힐 탭", en: "Heel tab", ja: "ヒールタブ" },
    type: "full",
  },
  {
    id: "i",
    file: "i.png",
    label: "I",
    hint: { ko: "포인트 패널", en: "Accent panel", ja: "アクセント" },
    type: "full",
  },
  {
    id: "j",
    file: "j.png",
    label: "J",
    hint: { ko: "디테일 라인", en: "Detail line", ja: "ディテール" },
    type: "full",
  },
  {
    id: "k",
    file: "k.png",
    label: "K",
    hint: { ko: "아웃솔", en: "Outsole", ja: "アウトソール" },
    type: "basic",
  },
  {
    id: "l",
    file: "l.png",
    label: "L",
    hint: { ko: "라인", en: "Line", ja: "ライン" },
    type: "full",
  },
];

export type PartColors = Record<PartId, string>;
export type PartColorNames = Record<PartId, string>;

export function paletteFor(part: PartDef): ColorOpt[] {
  return part.type === "basic" ? BASIC_COLORS : FULL_COLORS;
}

export function colorByName(name: string): ColorOpt | undefined {
  return (
    FULL_COLORS.find((c) => c.name === name) ||
    BASIC_COLORS.find((c) => c.name === name)
  );
}

export const READY_PARTS: PartId[] = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
export const PICKABLE_PARTS: PartId[] = READY_PARTS.filter((id) => id !== "l");

/**
 * L is hidden from the picker.
 * D = WHITE or BLACK → L copies I
 * D = any other color → L copies A
 */
export function linkedLColor(
  dName: string,
  _dColor: string,
  iName: string,
  iColor: string,
  aName: string,
  aColor: string,
): { name: string; color: string } {
  const d = (dName || "WHITE").toUpperCase();
  if (d === "WHITE" || d === "BLACK") {
    return { name: iName, color: iColor };
  }
  return { name: aName, color: aColor };
}

/** Default view matches the base photo */
export const PHOTO_NATIVE: Partial<Record<PartId, string>> = {
  a: "WHITE",
  b: "WHITE",
  c: "WHITE",
  d: "WHITE",
  e: "WHITE",
  f: "WHITE",
  g: "WHITE",
  h: "WHITE",
  i: "WHITE",
  j: "WHITE",
  k: "WHITE",
  l: "WHITE",
};

/** Real photos supplied per part + color. No generated tints. */
export const REAL_LAYERS: Partial<
  Record<PartId, Partial<Record<string, string>>>
> = {
  a: {
    BLACK: "/simulator/photo/tints/a-black.png?v=c1",
  },
  b: {
    RED: "/simulator/photo/tints/b-red.png?v=c1",
    ORANGE: "/simulator/photo/tints/b-orange.png?v=c1",
    YELLOW: "/simulator/photo/tints/b-yellow.png?v=c1",
    GREEN: "/simulator/photo/tints/b-green.png?v=c1",
    BLUE: "/simulator/photo/tints/b-blue.png?v=c1",
    NAVY: "/simulator/photo/tints/b-navy.png?v=c1",
    PURPLE: "/simulator/photo/tints/b-purple.png?v=c1",
    BLACK: "/simulator/photo/tints/b-black.png?v=c1",
    GOLD: "/simulator/photo/tints/b-gold.png?v=b2",
    SILVER: "/simulator/photo/tints/b-silver.png?v=b2",
    MINT: "/simulator/photo/tints/b-mint.png?v=c1",
    PINK: "/simulator/photo/tints/b-pink.png?v=p1",
    "SKY BLUE": "/simulator/photo/tints/b-sky-blue.png?v=c1",
  },
  c: {
    RED: "/simulator/photo/tints/c-red.png?v=c2",
    ORANGE: "/simulator/photo/tints/c-orange.png?v=c2",
    YELLOW: "/simulator/photo/tints/c-yellow.png?v=c2",
    GREEN: "/simulator/photo/tints/c-green.png?v=c2",
    BLUE: "/simulator/photo/tints/c-blue.png?v=c2",
    NAVY: "/simulator/photo/tints/c-navy.png?v=c2",
    PURPLE: "/simulator/photo/tints/c-purple.png?v=c2",
    BLACK: "/simulator/photo/tints/c-black.png?v=c2",
    GOLD: "/simulator/photo/tints/c-gold.png?v=c3",
    SILVER: "/simulator/photo/tints/c-silver.png?v=c3",
    MINT: "/simulator/photo/tints/c-mint.png?v=c3",
    PINK: "/simulator/photo/tints/c-pink.png?v=p1",
    "SKY BLUE": "/simulator/photo/tints/c-sky-blue.png?v=c2",
  },
  d: {
    RED: "/simulator/photo/tints/d-red.png?v=d1",
    ORANGE: "/simulator/photo/tints/d-orange.png?v=d1",
    YELLOW: "/simulator/photo/tints/d-yellow.png?v=d1",
    GREEN: "/simulator/photo/tints/d-green.png?v=d2",
    BLUE: "/simulator/photo/tints/d-blue.png?v=d1",
    NAVY: "/simulator/photo/tints/d-navy.png?v=d2",
    PURPLE: "/simulator/photo/tints/d-purple.png?v=d2",
    BLACK: "/simulator/photo/tints/d-black.png?v=d2",
    GOLD: "/simulator/photo/tints/d-gold.png?v=d3",
    SILVER: "/simulator/photo/tints/d-silver.png?v=d2",
    MINT: "/simulator/photo/tints/d-mint.png?v=d1",
    PINK: "/simulator/photo/tints/d-pink.png?v=p1",
    "SKY BLUE": "/simulator/photo/tints/d-sky-blue.png?v=d2",
  },
  e: {
    RED: "/simulator/photo/tints/e-red.png?v=e3",
    ORANGE: "/simulator/photo/tints/e-orange.png?v=e1",
    YELLOW: "/simulator/photo/tints/e-yellow.png?v=e1",
    GREEN: "/simulator/photo/tints/e-green.png?v=e3",
    BLUE: "/simulator/photo/tints/e-blue.png?v=e2",
    NAVY: "/simulator/photo/tints/e-navy.png?v=e2",
    PURPLE: "/simulator/photo/tints/e-purple.png?v=e1",
    BLACK: "/simulator/photo/tints/e-black.png?v=e2",
    GOLD: "/simulator/photo/tints/e-gold.png?v=e4",
    SILVER: "/simulator/photo/tints/e-silver.png?v=e3",
    MINT: "/simulator/photo/tints/e-mint.png?v=e4",
    PINK: "/simulator/photo/tints/e-pink.png?v=p1",
    "SKY BLUE": "/simulator/photo/tints/e-sky-blue.png?v=e3",
  },
  f: {
    RED: "/simulator/photo/tints/f-red.png?v=f1",
    ORANGE: "/simulator/photo/tints/f-orange.png?v=f1",
    YELLOW: "/simulator/photo/tints/f-yellow.png?v=f1",
    GREEN: "/simulator/photo/tints/f-green.png?v=f1",
    BLUE: "/simulator/photo/tints/f-blue.png?v=f1",
    NAVY: "/simulator/photo/tints/f-navy.png?v=f1",
    PURPLE: "/simulator/photo/tints/f-purple.png?v=f1",
    BLACK: "/simulator/photo/tints/f-black.png?v=f1",
    GOLD: "/simulator/photo/tints/f-gold.png?v=f2",
    SILVER: "/simulator/photo/tints/f-silver.png?v=f2",
    MINT: "/simulator/photo/tints/f-mint.png?v=f1",
    PINK: "/simulator/photo/tints/f-pink.png?v=p1",
    "SKY BLUE": "/simulator/photo/tints/f-sky-blue.png?v=f1",
  },
  g: {
    RED: "/simulator/photo/tints/g-red.png?v=g1",
    ORANGE: "/simulator/photo/tints/g-orange.png?v=g1",
    YELLOW: "/simulator/photo/tints/g-yellow.png?v=g1",
    GREEN: "/simulator/photo/tints/g-green.png?v=g1",
    BLUE: "/simulator/photo/tints/g-blue.png?v=g1",
    NAVY: "/simulator/photo/tints/g-navy.png?v=g1",
    PURPLE: "/simulator/photo/tints/g-purple.png?v=g1",
    BLACK: "/simulator/photo/tints/g-black.png?v=g1",
    GOLD: "/simulator/photo/tints/g-gold.png?v=g2",
    SILVER: "/simulator/photo/tints/g-silver.png?v=g2",
    MINT: "/simulator/photo/tints/g-mint.png?v=g1",
    PINK: "/simulator/photo/tints/g-pink.png?v=p1",
    "SKY BLUE": "/simulator/photo/tints/g-sky-blue.png?v=g1",
  },
  h: {
    RED: "/simulator/photo/tints/h-red.png?v=h1",
    ORANGE: "/simulator/photo/tints/h-orange.png?v=h1",
    YELLOW: "/simulator/photo/tints/h-yellow.png?v=h1",
    GREEN: "/simulator/photo/tints/h-green.png?v=h1",
    BLUE: "/simulator/photo/tints/h-blue.png?v=h1",
    NAVY: "/simulator/photo/tints/h-navy.png?v=h1",
    PURPLE: "/simulator/photo/tints/h-purple.png?v=h1",
    BLACK: "/simulator/photo/tints/h-black.png?v=h1",
    GOLD: "/simulator/photo/tints/h-gold.png?v=h3",
    SILVER: "/simulator/photo/tints/h-silver.png?v=h2",
    MINT: "/simulator/photo/tints/h-mint.png?v=h2",
    PINK: "/simulator/photo/tints/h-pink.png?v=p1",
    "SKY BLUE": "/simulator/photo/tints/h-sky-blue.png?v=h2",
  },
  i: {
    RED: "/simulator/photo/tints/i-red.png?v=i1",
    ORANGE: "/simulator/photo/tints/i-orange.png?v=i1",
    YELLOW: "/simulator/photo/tints/i-yellow.png?v=i1",
    GREEN: "/simulator/photo/tints/i-green.png?v=i1",
    BLUE: "/simulator/photo/tints/i-blue.png?v=i1",
    NAVY: "/simulator/photo/tints/i-navy.png?v=i1",
    PURPLE: "/simulator/photo/tints/i-purple.png?v=i1",
    BLACK: "/simulator/photo/tints/i-black.png?v=i1",
    GOLD: "/simulator/photo/tints/i-gold.png?v=i2",
    SILVER: "/simulator/photo/tints/i-silver.png?v=i1",
    MINT: "/simulator/photo/tints/i-mint.png?v=i2",
    PINK: "/simulator/photo/tints/i-pink.png?v=p1",
    "SKY BLUE": "/simulator/photo/tints/i-sky-blue.png?v=i1",
  },
  j: {
    RED: "/simulator/photo/tints/j-red.png?v=j1",
    ORANGE: "/simulator/photo/tints/j-orange.png?v=j1",
    YELLOW: "/simulator/photo/tints/j-yellow.png?v=j1",
    GREEN: "/simulator/photo/tints/j-green.png?v=j1",
    BLUE: "/simulator/photo/tints/j-blue.png?v=j1",
    NAVY: "/simulator/photo/tints/j-navy.png?v=j1",
    PURPLE: "/simulator/photo/tints/j-purple.png?v=j1",
    BLACK: "/simulator/photo/tints/j-black.png?v=j1",
    GOLD: "/simulator/photo/tints/j-gold.png?v=j2",
    SILVER: "/simulator/photo/tints/j-silver.png?v=j1",
    MINT: "/simulator/photo/tints/j-mint.png?v=j2",
    PINK: "/simulator/photo/tints/j-pink.png?v=p1",
    "SKY BLUE": "/simulator/photo/tints/j-sky-blue.png?v=j1",
  },
  k: {
    BLACK: "/simulator/photo/tints/k-black.png?v=k5",
  },
  l: {
    RED: "/simulator/photo/tints/l-red.png?v=l2",
    ORANGE: "/simulator/photo/tints/l-orange.png?v=l2",
    YELLOW: "/simulator/photo/tints/l-yellow.png?v=l2",
    GREEN: "/simulator/photo/tints/l-green.png?v=l2",
    BLUE: "/simulator/photo/tints/l-blue.png?v=l2",
    NAVY: "/simulator/photo/tints/l-navy.png?v=l2",
    PURPLE: "/simulator/photo/tints/l-purple.png?v=l2",
    BLACK: "/simulator/photo/tints/l-black.png?v=l1",
    GOLD: "/simulator/photo/tints/l-gold.png?v=l2",
    SILVER: "/simulator/photo/tints/l-silver.png?v=l2",
    MINT: "/simulator/photo/tints/l-mint.png?v=l2",
    PINK: "/simulator/photo/tints/l-pink.png?v=l2",
    "SKY BLUE": "/simulator/photo/tints/l-sky-blue.png?v=l2",
  },
};

export function defaultPartColors(): PartColors {
  const out = {} as PartColors;
  for (const part of SIM_PARTS) {
    const native = PHOTO_NATIVE[part.id];
    const opt =
      (native && colorByName(native)) ||
      paletteFor(part)[0];
    out[part.id] = opt.color;
  }
  return out;
}

export function defaultPartNames(): PartColorNames {
  const out = {} as PartColorNames;
  for (const part of SIM_PARTS) {
    out[part.id] = PHOTO_NATIVE[part.id] ?? "WHITE";
  }
  return out;
}

export const SIM_ASSET = (file: string) => `/simulator/${file}`;
export const PHOTO_ASSET = (file: string) => `/simulator/photo/${file}?v=c1`;
export const PHOTO_BASE = "/simulator/photo/base.jpg?v=c3";

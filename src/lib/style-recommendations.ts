import {
  BASIC_COLORS, FULL_COLORS, PHOTO_NATIVE, colorByName, defaultPartNames,
  linkedLColor, partsForModel, photoLayerFor,
  type BootModel, type ColorOpt, type PartColorNames, type PartId,
} from "./simulator-config";
import { LACE_COLORS, MESH_COLORS, type LaceColor, type MeshColor } from "./mesh-laces";

export type RecommendationIntensity = "quiet" | "accent" | "bold";
export type RecommendationStyleId = "clean" | "dark-gold" | "cool" | "warm" | "playful";
type Localized = { ko: string; en: string; ja: string };
export type StylePreset = {
  id: RecommendationStyleId;
  title: Localized;
  description: Localized;
  palette: readonly string[];
};

/** Palettes describe real selectable colors, never private material identifiers. */
export const STYLE_PRESETS: readonly StylePreset[] = [
  { id: "clean", title: { ko: "깔끔한 클래식", en: "Clean classic", ja: "クリーンクラシック" },
    description: { ko: "화이트와 실버의 정돈된 조합", en: "Crisp white with silver details", ja: "ホワイトとシルバーのすっきりした配色" }, palette: ["WHITE", "SILVER", "BLACK"] },
  { id: "dark-gold", title: { ko: "블랙 & 골드", en: "Black & gold", ja: "ブラック＆ゴールド" },
    description: { ko: "블랙에 골드로 선명한 포인트", en: "A dark foundation with gold accents", ja: "ブラックにゴールドのアクセント" }, palette: ["BLACK", "GOLD", "WHITE"] },
  { id: "cool", title: { ko: "시원한 블루", en: "Cool blue", ja: "クールブルー" },
    description: { ko: "화이트에 블루와 아쿠아", en: "White with blue and aqua", ja: "ホワイトにブルーとアクア" }, palette: ["WHITE", "BLUE", "AQUA"] },
  { id: "warm", title: { ko: "강렬한 레드", en: "Bold red", ja: "鮮やかなレッド" },
    description: { ko: "블랙과 레드에 따뜻한 포인트", en: "Black and red with warm details", ja: "ブラックとレッドに暖色のアクセント" }, palette: ["BLACK", "RED", "ORANGE"] },
  { id: "playful", title: { ko: "경쾌한 컬러", en: "Playful color", ja: "軽やかなカラー" },
    description: { ko: "화이트에 핑크와 민트", en: "Fresh white, pink and mint", ja: "ホワイトにピンクとミント" }, palette: ["WHITE", "PINK", "MINT"] },
];

const LEATHER_PARTS: readonly PartId[] = ["b", "c", "d", "e", "f", "g", "h", "i", "j"];
const MAJOR_PARTS = ["b", "c", "d"] as const;
const BASIC_NAMES = BASIC_COLORS.map(color => color.name);
const hasPhoto = (part: PartId, name: string, model: BootModel) =>
  PHOTO_NATIVE[part] === name || Boolean(photoLayerFor(part, name, { model }));

/** Intersection with existing photographs keeps generated designs orderable.
 * GRAY is intentionally absent: it is a Special-only generated leather layer.
 */
export const RECOMMENDATION_COLORS: readonly ColorOpt[] = FULL_COLORS.filter(color =>
  (["high", "mid"] as const).every(model => LEATHER_PARTS
    .filter(part => model !== "mid" || part !== "g")
    .every(part => hasPhoto(part, color.name, model))));
const COLOR_NAMES = RECOMMENDATION_COLORS.map(color => color.name);
const KNOWN_COLORS = new Set([...FULL_COLORS.map(color => color.name), ...MESH_COLORS, ...LACE_COLORS]);

export type StylePreferences = {
  styleId: RecommendationStyleId;
  likedColors: readonly string[];
  avoidedColors: readonly string[];
  intensity: RecommendationIntensity;
  mbti?: string;
};
export type RecommendationContext = { model: BootModel; special: boolean };
export type RecommendationNoteCode = "UNAVAILABLE_LIKED_COLOR" | "AVOIDED_LIKED_COLOR";
export type RecommendationNote = { code: RecommendationNoteCode; colors: string[] };
export type RecommendationConstraintCode = "NO_ALLOWED_LEATHER_COLOR" | "NO_ALLOWED_BASE_COLOR";
export class RecommendationConstraintError extends Error {
  readonly code: RecommendationConstraintCode;
  constructor(code: RecommendationConstraintCode) {
    super(code);
    this.name = "RecommendationConstraintError";
    this.code = code;
  }
}
export type StyleRecommendation = {
  names: PartColorNames;
  /** Active visible parts only; G is absent for mid-cut, and legacy L is hidden. */
  activeParts: PartId[];
  /** Special mesh and laces use independent stock palettes and backing layers. */
  meshColor: MeshColor;
  laceColor: LaceColor;
  styleId: RecommendationStyleId;
  intensity: RecommendationIntensity;
  variant: number;
  explanation: {
    baseColor: string;
    accentColors: string[];
    appliedLikes: string[];
    notes: RecommendationNote[];
  };
};

function normalizedColors(values: readonly string[] | undefined) {
  return [...new Set((Array.isArray(values) ? values : [])
    .filter((value): value is string => typeof value === "string")
    .map(value => value.trim().toUpperCase()).filter(value => KNOWN_COLORS.has(value)))];
}

function hash(value: string) {
  let seed = 2166136261;
  for (const char of value) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  return seed >>> 0;
}

/** Pure, deterministic, local recommendation; no model API or per-use charges.
 * MBTI can only reorder equally weighted layouts. It never alters the palette,
 * intensity, stock restrictions, or the user's explicit color preferences.
 */
export function recommendStyle(
  preferences: StylePreferences,
  context: RecommendationContext,
  variant = 0,
): StyleRecommendation {
  const preset = STYLE_PRESETS.find(item => item.id === preferences.styleId) ?? STYLE_PRESETS[0];
  const model = context.model === "mid" ? "mid" : "high";
  const special = context.special === true;
  const intensity = (["quiet", "accent", "bold"] as const).includes(preferences.intensity) ? preferences.intensity : "accent";
  const avoided = new Set(normalizedColors(preferences.avoidedColors));
  const requestedLikes = normalizedColors(preferences.likedColors).slice(0, 2);
  const notes: RecommendationNote[] = [];
  const unavailableLikes = requestedLikes.filter(color => !COLOR_NAMES.includes(color));
  const conflictedLikes = requestedLikes.filter(color => avoided.has(color));
  if (unavailableLikes.length) notes.push({ code: "UNAVAILABLE_LIKED_COLOR", colors: unavailableLikes });
  if (conflictedLikes.length) notes.push({ code: "AVOIDED_LIKED_COLOR", colors: conflictedLikes });
  const likes = requestedLikes.filter(color => COLOR_NAMES.includes(color) && !avoided.has(color));
  const allowed = COLOR_NAMES.filter(color => !avoided.has(color));
  if (!allowed.length) throw new RecommendationConstraintError("NO_ALLOWED_LEATHER_COLOR");
  const availableBasic = BASIC_NAMES.filter(color => !avoided.has(color));
  if (!availableBasic.length) throw new RecommendationConstraintError("NO_ALLOWED_BASE_COLOR");

  const base = [preset.palette[0], "WHITE", "BLACK", "NAVY", ...allowed].find(color => allowed.includes(color))!;
  const accents = [...new Set([...likes, ...preset.palette.slice(1), ...allowed])]
    .filter(color => allowed.includes(color) && color !== base).slice(0, 2);
  const first = accents[0] ?? base;
  // Quiet designs use only one extra hue unless two explicit likes require both.
  const second = intensity === "quiet"
    ? (likes.find(color => color !== base && color !== first) ?? base)
    : (accents[1] ?? base);
  const basic = [base, preset.palette[0], "WHITE", "BLACK"].find(color => availableBasic.includes(color)) ?? "WHITE";
  const preferredStock = intensity === "bold" ? [...likes, first, basic] : [basic];
  const meshPalette: readonly string[] = special ? MESH_COLORS : BASIC_NAMES;
  const lacePalette: readonly string[] = special ? LACE_COLORS : BASIC_NAMES;
  const pickStock = (palette: readonly string[]) =>
    [...preferredStock, ...palette].find(color => palette.includes(color) && !avoided.has(color)) ?? basic;
  // Colored Special mesh uses a WHITE backing, also used by the linked detail
  // line. Prefer the valid black backing when white was explicitly excluded.
  const meshColor = (special && avoided.has("WHITE") ? "BLACK" : pickStock(meshPalette)) as MeshColor;
  const laceColor = (special ? pickStock(lacePalette) : meshColor) as LaceColor;

  // Three rotations have the same hue weighting: MBTI only breaks their tie.
  const mbti = typeof preferences.mbti === "string" ? preferences.mbti.trim().toUpperCase() : "";
  const validMbti = /^[IE][NS][FT][JP]$/.test(mbti) ? mbti : "";
  const seed = hash(JSON.stringify([preset.id, model, special, intensity, [...likes].sort(), [...avoided].sort(), validMbti]));
  const safeVariant = Number.isFinite(variant) ? Math.max(0, Math.floor(variant)) % 3 : 0;
  const rotation = (seed % 3 + safeVariant) % 3;
  const names = defaultPartNames();
  names.model = model;
  const activeParts = partsForModel({ model }).filter(part => part.id !== "l").map(part => part.id);
  const leather = LEATHER_PARTS.filter(part => activeParts.includes(part));
  for (const part of leather) names[part] = base;
  names[MAJOR_PARTS[rotation]] = first;
  names[MAJOR_PARTS[(rotation + 1) % 3]] = second;
  if (intensity !== "quiet") {
    names.i = first;
    names.j = first;
    names.f = second;
    if (intensity === "bold") {
      names.e = first;
      names.h = second;
      if (model === "high") names.g = first;
    }
  }
  // Both favorites must be visible on actual broad leather panels, including
  // neutral favorites; fine piping, laces or a hidden layer never count alone.
  const majorValues = () => MAJOR_PARTS.map(part => names[part]);
  for (const like of likes) {
    if (majorValues().includes(like)) continue;
    const target = MAJOR_PARTS.find(part => !likes.includes(names[part]))!;
    names[target] = like;
  }
  names.a = special ? (meshColor === "BLACK" ? "BLACK" : "WHITE") : meshColor;
  names.k = basic;
  names.l = linkedLColor(names.d, colorByName(names.d)!.color, names.i, colorByName(names.i)!.color, names.a, colorByName(names.a)!.color).name;
  return {
    names, activeParts, meshColor, laceColor, styleId: preset.id, intensity, variant: safeVariant,
    explanation: {
      baseColor: base,
      accentColors: [...new Set(leather.map(part => names[part]))].filter(color => color !== base),
      appliedLikes: likes.filter(color => majorValues().includes(color)),
      notes,
    },
  };
}

/** Render this through the existing layer renderer for the five photo choices. */
export function stylePresetExample(styleId: RecommendationStyleId, model: BootModel = "high") {
  return recommendStyle({ styleId, likedColors: [], avoidedColors: [], intensity: "accent" }, { model, special: false });
}

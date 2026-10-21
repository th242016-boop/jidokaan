import { defaultPartNames, linkedLColor, type BootModel, type PartColorNames, type PartId } from "./simulator-config";
import { MESH_COLORS, LACE_COLORS, type MeshColor, type LaceColor } from "./mesh-laces";
import { isSpecialSolid, specialSolidPartsFor, type SpecialSolid, type SpecialSolidLayers } from "./special-solids";
import { isSpecialPattern, patternPartsFor, type SpecialPatternName, type SpecialPatternAssets } from "./special-patterns";
import { BEAD_COLORS, type BeadSelection } from "./bead-material";

export const FLOWER_A = "FLOWER A";
export const flowerPartsFor = (model: BootModel): PartId[] =>
  model === "mid" ? ["b", "c", "d", "i", "j"] : ["b", "c", "d", "e", "f", "g", "h", "i", "j"];

export type SpecialAssets = { swatch: string; layers: Partial<Record<PartId, string>>; patterns?: SpecialPatternAssets };
export type SpecialDraft = { names: PartColorNames; flowers: Partial<Record<PartId, boolean>>; solids?: Partial<Record<PartId, SpecialSolid>>; patterns?: Partial<Record<PartId, SpecialPatternName>>; mesh?: MeshColor; laces?: LaceColor; beads?: BeadSelection };

export function createWhiteSpecialDraft(model: BootModel): SpecialDraft {
  return {
    names: { ...defaultPartNames(), ...(model === "mid" ? { model: "mid" as const } : {}) },
    flowers: {}, solids: {}, patterns: {}, mesh: "WHITE", laces: "WHITE", beads: "NONE",
  };
}

export const meshSelection = (draft?: SpecialDraft): MeshColor => draft?.mesh ?? (draft?.names.a === "BLACK" ? "BLACK" : "WHITE");
export const laceSelection = (draft?: SpecialDraft): LaceColor => draft?.laces ?? (draft?.names.a === "BLACK" ? "BLACK" : "WHITE");
export const beadSelection = (draft?: SpecialDraft): BeadSelection => draft?.names.model === "mid" ? "NONE" : draft?.beads ?? "NONE";

// Visible L is the optional upper-window bead material. Store it independently
// from names.l, the legacy hidden line linked to A/I, and from shoelaces.
export function selectBeads(draft: SpecialDraft, beads: BeadSelection): SpecialDraft {
  if (draft.names.model === "mid" || (beads !== "NONE" && !BEAD_COLORS.includes(beads))) return draft;
  return { ...draft, beads };
}

export function selectMesh(draft: SpecialDraft, mesh: MeshColor): SpecialDraft {
  if (!MESH_COLORS.includes(mesh)) return draft;
  return { ...selectSpecial(draft, "a", mesh === "BLACK" ? "BLACK" : "WHITE"), mesh, laces: laceSelection(draft) };
}

export function selectLaces(draft: SpecialDraft, laces: LaceColor): SpecialDraft {
  if (!LACE_COLORS.includes(laces)) return draft;
  return { ...draft, laces, mesh: meshSelection(draft) };
}

// Special choices stay outside the persisted cart/order draft. L keeps its solid-color linkage;
// there is no supplied patterned L layer, nor any mid-cut E/F/H FLOWER A layer.
export function selectSpecial(draft: SpecialDraft, part: PartId, name: string): SpecialDraft {
  const model = draft.names.model ?? "high";
  if (isSpecialSolid(name) && !specialSolidPartsFor(model).includes(part)) return draft;
  if (isSpecialPattern(name) && !patternPartsFor(model, name).includes(part)) return draft;
  if (name === FLOWER_A && !flowerPartsFor(model).includes(part)) return draft;
  const solids = { ...draft.solids };
  const patterns = { ...draft.patterns };
  delete solids[part];
  delete patterns[part];
  if (name === FLOWER_A) return { ...draft, solids, patterns, flowers: { ...draft.flowers, [part]: true } };
  if (isSpecialSolid(name)) solids[part] = name;
  if (isSpecialPattern(name)) patterns[part] = name;
  // Use a valid ordinary backing layer for captureDesign, never a new cart color.
  // GRAY D is a colored D, so its existing hidden L linkage still follows A.
  const names = { ...draft.names, [part]: isSpecialSolid(name) ? "RED" : isSpecialPattern(name) ? "WHITE" : name };
  names.l = linkedLColor(names.d, "", names.i, "", names.a, "").name;
  return { ...draft, names, solids, patterns, flowers: { ...draft.flowers, [part]: false } };
}

export function specialSolidOverrides(draft: SpecialDraft | undefined, layers: SpecialSolidLayers) {
  const result: SpecialSolidLayers = {};
  if (!draft) return result;
  for (const part of Object.keys(draft.solids ?? {}) as PartId[]) {
    if (draft.solids?.[part] && layers[part]) result[part] = layers[part];
  }
  if ((draft.names.d === "WHITE" || draft.names.d === "BLACK") && draft.solids?.i && layers.l)
    result.l = layers.l;
  return result;
}

export function specialOverrides(draft: SpecialDraft | undefined, assets: SpecialAssets | null) {
  const result: Partial<Record<PartId, string>> = {};
  if (draft && assets) for (const part of Object.keys(assets.layers) as PartId[]) {
    if (draft.flowers[part]) result[part] = assets.layers[part];
  }
  return result;
}

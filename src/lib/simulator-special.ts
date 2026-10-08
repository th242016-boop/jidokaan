import { linkedLColor, type BootModel, type PartColorNames, type PartId } from "./simulator-config";
import { MESH_COLORS, LACE_COLORS, type MeshColor, type LaceColor } from "./mesh-laces";
import { isSpecialSolid, specialSolidPartsFor, type SpecialSolid, type SpecialSolidLayers } from "./special-solids";

export const FLOWER_A = "FLOWER A";
export const flowerPartsFor = (model: BootModel): PartId[] =>
  model === "mid" ? ["b", "c", "d", "i", "j"] : ["b", "c", "d", "e", "f", "g", "h", "i", "j"];

export type SpecialAssets = { swatch: string; layers: Partial<Record<PartId, string>> };
export type SpecialDraft = { names: PartColorNames; flowers: Partial<Record<PartId, boolean>>; solids?: Partial<Record<PartId, SpecialSolid>>; mesh?: MeshColor; laces?: LaceColor };

export const meshSelection = (draft?: SpecialDraft): MeshColor => draft?.mesh ?? (draft?.names.a === "BLACK" ? "BLACK" : "WHITE");
export const laceSelection = (draft?: SpecialDraft): LaceColor => draft?.laces ?? (draft?.names.a === "BLACK" ? "BLACK" : "WHITE");

export function selectMesh(draft: SpecialDraft, mesh: MeshColor): SpecialDraft {
  if (!MESH_COLORS.includes(mesh)) return draft;
  return { ...selectSpecial(draft, "a", mesh === "BLACK" ? "BLACK" : "WHITE"), mesh, laces: laceSelection(draft) };
}

export function selectLaces(draft: SpecialDraft, laces: LaceColor): SpecialDraft {
  if (!LACE_COLORS.includes(laces)) return draft;
  return { ...draft, laces, mesh: meshSelection(draft) };
}

// Special choices stay outside the persisted cart/order draft. L keeps its solid-color linkage;
// there is no supplied floral L layer, nor any mid-cut E/F/H floral layer.
export function selectSpecial(draft: SpecialDraft, part: PartId, name: string): SpecialDraft {
  if (isSpecialSolid(name) && !specialSolidPartsFor(draft.names.model ?? "high").includes(part)) return draft;
  const solids = { ...draft.solids };
  delete solids[part];
  if (name === FLOWER_A) return { ...draft, solids, flowers: { ...draft.flowers, [part]: true } };
  if (isSpecialSolid(name)) solids[part] = name;
  // Use a valid ordinary backing layer for captureDesign, never a new cart color.
  // GRAY D is a colored D, so its existing hidden L linkage still follows A.
  const names = { ...draft.names, [part]: isSpecialSolid(name) ? "RED" : name };
  names.l = linkedLColor(names.d, "", names.i, "", names.a, "").name;
  return { ...draft, names, solids, flowers: { ...draft.flowers, [part]: false } };
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

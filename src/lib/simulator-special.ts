import { linkedLColor, type BootModel, type PartColorNames, type PartId } from "./simulator-config";
import { MESH_COLORS, LACE_COLORS, type MeshColor, type LaceColor } from "./mesh-laces";

export const FLOWER_A = "FLOWER A";
export const flowerPartsFor = (model: BootModel): PartId[] =>
  model === "mid" ? ["b", "c", "d", "i", "j"] : ["b", "c", "d", "e", "f", "g", "h", "i", "j"];

export type SpecialAssets = { swatch: string; layers: Partial<Record<PartId, string>> };
export type SpecialDraft = { names: PartColorNames; flowers: Partial<Record<PartId, boolean>>; mesh?: MeshColor; laces?: LaceColor };

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
  if (name === FLOWER_A) return { ...draft, flowers: { ...draft.flowers, [part]: true } };
  const names = { ...draft.names, [part]: name };
  names.l = linkedLColor(names.d, "", names.i, "", names.a, "").name;
  return { ...draft, names, flowers: { ...draft.flowers, [part]: false } };
}

export function specialOverrides(draft: SpecialDraft | undefined, assets: SpecialAssets | null) {
  const result: Partial<Record<PartId, string>> = {};
  if (draft && assets) for (const part of Object.keys(assets.layers) as PartId[]) {
    if (draft.flowers[part]) result[part] = assets.layers[part];
  }
  return result;
}

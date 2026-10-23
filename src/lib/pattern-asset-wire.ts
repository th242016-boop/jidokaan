import type { SpecialPatternAssets, SpecialPatternName } from "./special-patterns";

type PatternSource = NonNullable<SpecialPatternAssets[SpecialPatternName]>;
export type CompactPatternAssets = {
  patternSources: PatternSource[];
  patternRefs: Partial<Record<SpecialPatternName, number>>;
};
export type PatternAssetWire = Partial<CompactPatternAssets> & { patterns?: SpecialPatternAssets };

/** Encode only the caller's already-authorized catalog. Shared neutral textures
 * are transmitted once even when many colors refer to the same source. */
export function compactPatternAssets(patterns: SpecialPatternAssets): CompactPatternAssets {
  const patternSources: PatternSource[] = [];
  const patternRefs: CompactPatternAssets["patternRefs"] = {};
  const byTexture = new Map<string, Map<string, number>>();
  for (const [name, asset] of Object.entries(patterns)) {
    if (!asset) continue;
    let bySwatch = byTexture.get(asset.texture);
    if (!bySwatch) { bySwatch = new Map(); byTexture.set(asset.texture, bySwatch); }
    const swatchKey = JSON.stringify([asset.swatch, asset.sourceCrop ?? null]);
    let index = bySwatch.get(swatchKey);
    if (index === undefined) {
      index = patternSources.length;
      patternSources.push(asset);
      bySwatch.set(swatchKey, index);
    }
    patternRefs[name as SpecialPatternName] = index;
  }
  return { patternSources, patternRefs };
}

/** Accept the legacy response as well, so old servers and local fixtures work.
 * Expanded aliases retain shared object identity for renderer/swatches caches. */
export function expandPatternAssets(wire: PatternAssetWire): SpecialPatternAssets {
  if (!Array.isArray(wire.patternSources) || !wire.patternRefs || typeof wire.patternRefs !== "object") return wire.patterns ?? {};
  const patterns: SpecialPatternAssets = {};
  for (const [name, index] of Object.entries(wire.patternRefs)) {
    if (!Number.isInteger(index) || index < 0 || index >= wire.patternSources.length) continue;
    const source = wire.patternSources[index];
    if (!source || typeof source.texture !== "string" || typeof source.swatch !== "string") continue;
    patterns[name as SpecialPatternName] = source;
  }
  return patterns;
}

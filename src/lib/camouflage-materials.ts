// New experimental materials stay administrator-only until explicitly released
// by the catalog policy. Textures are supplied by the protected assets endpoint.
export const CAMOUFLAGE_MATERIALS = [
  { name: "GRAY CAMO", label: "GRAY CAMO", assetKey: "gray-camo", tileSize: 250 },
  { name: "WOODLAND CAMO", label: "WOODLAND CAMO", assetKey: "woodland-camo", tileSize: 250 },
] as const;

export type CamouflageMaterialName = typeof CAMOUFLAGE_MATERIALS[number]["name"];
export const camouflageMaterialFor = (name: string) =>
  CAMOUFLAGE_MATERIALS.find(material => material.name === name);

// Fine matte grain needs broad photographic light rather than enamel glints.
export const CAMOUFLAGE_LIGHT_PROFILE = {
  blur: 26, floor: 0.30, peak: 1.16, sheen: 0.008,
} as const;

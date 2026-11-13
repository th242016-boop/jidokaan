import { useEffect, useMemo, useState } from "react";
import type { BootModel } from "./simulator-config";
import { loadMeshLacePixels, meshLaceDataUrl, type LaceColor, type MeshColor, type MeshLacePixels } from "./mesh-laces";
import { createBeadMask, renderBeads, type BeadSelection } from "./bead-material";
import { blueLeopardMeshDataUrl, loadBlueLeopardMeshSurface, type BlueLeopardMeshPattern } from "./blue-leopard-mesh";

export function useMeshLaces(active: boolean, model: BootModel, mesh: MeshColor, laces: LaceColor, beads: BeadSelection = "NONE", pattern?: BlueLeopardMeshPattern) {
  const [loaded, setLoaded] = useState<{ model: BootModel; pixels: MeshLacePixels } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setLoaded(null); setFailed(false);
    if (active) void loadMeshLacePixels(model).then(pixels => {
      if (!cancelled) setLoaded({ model, pixels });
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [active, model]);
  const ready = active && loaded?.model === model;
  const [material, setMaterial] = useState<{ source: MeshLacePixels; texture: string; crop: string; pixels: ImageData } | null>(null);
  const [materialFailed, setMaterialFailed] = useState(false);
  const texture = pattern?.asset.texture;
  const crop = JSON.stringify(pattern?.asset.sourceCrop ?? null);
  useEffect(() => {
    let cancelled = false;
    setMaterial(null); setMaterialFailed(false);
    if (ready && loaded && pattern) void loadBlueLeopardMeshSurface(loaded.pixels, model, pattern.asset).then(pixels => {
      if (!cancelled) setMaterial({ source: loaded.pixels, texture: pattern.asset.texture, crop, pixels });
    }).catch(() => { if (!cancelled) setMaterialFailed(true); });
    return () => { cancelled = true; };
  }, [ready, loaded, model, pattern?.name, texture, crop]);
  const patternReady = !pattern || Boolean(ready && loaded && material?.source === loaded.pixels && material.texture === texture && material.crop === crop);
  const patternFailed = Boolean(pattern && materialFailed);
  const patternLoading = Boolean(active && ready && pattern && !patternReady && !patternFailed);
  const renderReady = ready && patternReady;
  const beadMask = useMemo(() => ready && loaded ? createBeadMask(loaded.pixels, model) : undefined, [ready, loaded, model]);
  const layer = useMemo(() => {
    if (!renderReady || !loaded) return undefined;
    const decorate = (result: ImageData) => {
      if (beadMask && beads !== "NONE") renderBeads(result, loaded.pixels, beadMask, beads);
    };
    return pattern && material
      ? blueLeopardMeshDataUrl(loaded.pixels, laces, material.pixels, decorate)
      : meshLaceDataUrl(loaded.pixels, mesh, laces, decorate);
  }, [renderReady, loaded, mesh, laces, beadMask, beads, pattern?.name, material]);
  return { layer, ready, failed, loading: active && !ready && !failed, patternReady, patternFailed, patternLoading, renderReady };
}

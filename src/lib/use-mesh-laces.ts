import { useEffect, useMemo, useState } from "react";
import type { BootModel } from "./simulator-config";
import { loadMeshLacePixels, meshLaceDataUrl, type LaceColor, type MeshColor, type MeshLacePixels } from "./mesh-laces";
import { createBeadMask, renderBeads, type BeadSelection } from "./bead-material";

export function useMeshLaces(active: boolean, model: BootModel, mesh: MeshColor, laces: LaceColor, beads: BeadSelection = "NONE") {
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
  const beadMask = useMemo(() => ready && loaded ? createBeadMask(loaded.pixels, model) : undefined, [ready, loaded, model]);
  const layer = useMemo(() => ready && loaded ? meshLaceDataUrl(loaded.pixels, mesh, laces, result => {
    if (beadMask && beads !== "NONE") renderBeads(result, loaded.pixels, beadMask, beads);
  }) : undefined, [ready, loaded, mesh, laces, beadMask, beads]);
  return { layer, ready, failed, loading: active && !ready && !failed };
}

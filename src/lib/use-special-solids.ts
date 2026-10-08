import { useEffect, useState } from "react";
import type { BootModel } from "./simulator-config";
import { loadSpecialSolidLayers, type SpecialSolidLayers } from "./special-solids";

export function useSpecialSolids(active: boolean, model: BootModel) {
  const [loaded, setLoaded] = useState<{ model: BootModel; layers: SpecialSolidLayers } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoaded(null); setFailed(false);
    if (active) void loadSpecialSolidLayers(model, controller.signal).then(layers => {
      if (!controller.signal.aborted) setLoaded({ model, layers });
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [active, model]);
  const ready = active && loaded?.model === model;
  return { ready, failed, loading: active && !ready && !failed, layers: ready ? loaded.layers : {} };
}

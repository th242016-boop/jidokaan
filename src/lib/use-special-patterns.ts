import { useEffect, useState } from "react";
import type { BootModel, PartId } from "./simulator-config";
import { loadPatternLayer, type PatternLayers, type PatternSelections, type SpecialPatternAssets } from "./special-patterns";

type Loaded = { model: BootModel; assets: SpecialPatternAssets; selections: PatternSelections; layers: PatternLayers };
export function useSpecialPatterns(active: boolean, model: BootModel, selections: PatternSelections, assets?: SpecialPatternAssets) {
  const signature = JSON.stringify(Object.entries(selections).sort(([a], [b]) => a.localeCompare(b)));
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<{ model: BootModel; assets?: SpecialPatternAssets; signature: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    setError(null);
    if (!active || !assets) { setLoaded(null); return; }
    const selected = Object.fromEntries(JSON.parse(signature)) as PatternSelections;
    void (async () => {
      const layers: PatternLayers = {};
      // Sequential rendering bounds transient Canvas memory on mobile devices.
      for (const [part, name] of Object.entries(selected)) {
        if (cancelled) return;
        layers[part as PartId] = await loadPatternLayer(model, part as PartId, name, assets);
      }
      if (!cancelled) setLoaded({ model, assets, selections: selected, layers });
    })().catch(() => { if (!cancelled) setError({ model, assets, signature }); });
    return () => { cancelled = true; };
  }, [active, model, signature, assets]);
  const layers: PatternLayers = {};
  if (active && loaded?.model === model && loaded.assets === assets) {
    for (const [part, name] of Object.entries(selections)) {
      if (loaded.selections[part as PartId] === name) layers[part as PartId] = loaded.layers[part as PartId];
    }
  }
  const ready = active && Object.keys(selections).every(part => Boolean(layers[part as PartId]));
  const failed = active && error?.model === model && error.assets === assets && error.signature === signature;
  return { layers, ready, failed, loading: active && !ready && !failed };
}

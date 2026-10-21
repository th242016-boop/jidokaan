import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ADMIN_SESSION_EVENT, readAdminToken } from "./admin-session";
import { type BootModel, type PartColorNames, type PartId } from "./simulator-config";
import { createWhiteSpecialDraft, selectSpecial, specialOverrides, specialSolidOverrides, meshSelection, laceSelection, beadSelection, selectMesh, selectLaces, selectBeads, type SpecialAssets, type SpecialDraft } from "./simulator-special";
import type { MeshColor, LaceColor } from "./mesh-laces";
import type { BeadSelection } from "./bead-material";
import { useMeshLaces } from "./use-mesh-laces";
import { useSpecialSolids } from "./use-special-solids";
import { isSpecialSolid } from "./special-solids";
import { isSpecialPattern } from "./special-patterns";
import { useSpecialPatterns } from "./use-special-patterns";
import { isPublicSpecialPattern, type SimulatorAudience } from "./simulator-catalog";
import { FLOWER_A } from "./simulator-special";
import { expandPatternAssets, type PatternAssetWire } from "./pattern-asset-wire";

export function useSpecialSimulator(model: BootModel, baseNames: PartColorNames) {
  const [available, setAvailable] = useState(true);
  const [audience, setAudience] = useState<SimulatorAudience>("public");
  const audienceRef = useRef<SimulatorAudience>("public");
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [assets, setAssets] = useState<(SpecialAssets & { model: BootModel }) | null>(null);
  const [drafts, setDrafts] = useState<Partial<Record<BootModel, SpecialDraft>>>({});
  const generation = useRef(0);
  const namesRef = useRef(baseNames);
  namesRef.current = baseNames;

  const clear = useCallback(() => {
    generation.current++;
    setAvailable(true); setEnabled(false); setAssets(null); setDrafts({}); setBusy(false);
    audienceRef.current = "public"; setAudience("public");
  }, []);

  const request = useCallback(async (action: "ping" | "assets", signal?: AbortSignal, requestedAudience: SimulatorAudience = audienceRef.current) => {
    const token = readAdminToken();
    if (requestedAudience === "admin" && !token) throw new Error("AUTH");
    const res = await fetch("/api/simulator-special", {
      method: "POST", cache: "no-store", signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(requestedAudience === "admin" ? { token } : {}), audience: requestedAudience, action, model, ...(action === "assets" ? { compact: true } : {}) }),
    });
    if (!res.ok) throw new Error(res.status === 401 ? "AUTH" : "SPECIAL_UNAVAILABLE");
    const data = await res.json();
    return action === "assets" ? { ...data, patterns: expandPatternAssets(data as PatternAssetWire) } : data;
  }, [model]);

  const validate = useCallback(async () => {
    const current = generation.current;
    try {
      let next: SimulatorAudience = "public";
      if (readAdminToken()) {
        try { await request("ping", undefined, "admin"); next = "admin"; }
        catch (error) { if (!(error instanceof Error) || error.message !== "AUTH") throw error; }
      }
      if (next === "public") await request("ping", undefined, "public");
      if (current !== generation.current) return false;
      const changed = next !== audienceRef.current;
      if (changed) {
        // Discard private drafts and decoded assets on an audience transition.
        // The new effect loads only that audience's server-approved catalog.
        generation.current++;
        setAssets(null); setDrafts({}); setBusy(false);
        audienceRef.current = next; setAudience(next);
      }
      setAvailable(true); return !changed;
    } catch { if (current === generation.current) clear(); return false; }
  }, [request, clear]);

  useEffect(() => {
    void validate();
    const focus = () => { void validate(); };
    const visible = () => { if (!document.hidden) void validate(); };
    const timer = window.setInterval(() => { if (!document.hidden) void validate(); }, 30000);
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(ADMIN_SESSION_EVENT) : null;
    const sessionChanged = () => { clear(); void validate(); };
    if (channel) channel.onmessage = sessionChanged;
    window.addEventListener(ADMIN_SESSION_EVENT, sessionChanged);
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", visible);
    return () => {
      generation.current++;
      clearInterval(timer); channel?.close();
      window.removeEventListener(ADMIN_SESSION_EVENT, sessionChanged);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [validate, clear]);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const current = generation.current;
    setBusy(true); setAssets(null);
    request("assets", controller.signal).then((data: SpecialAssets) => {
      if (controller.signal.aborted || current !== generation.current) return;
      setDrafts(prev => ({ ...prev, [model]: prev[model] ?? { names: { ...namesRef.current }, flowers: {} } }));
      setAssets({ ...data, model });
    }).catch((error: Error) => {
      if (controller.signal.aborted || current !== generation.current) return;
      clear();
      toast.error(error.message === "AUTH" ? "관리자 로그인이 필요합니다." : "스페셜 소재를 불러오지 못했습니다. 다시 눌러주세요.");
    }).finally(() => { if (!controller.signal.aborted && current === generation.current) setBusy(false); });
    return () => controller.abort();
  }, [enabled, model, audience, request, clear]);

  const currentAssets = enabled && assets?.model === model ? assets : null;
  const draft = enabled ? drafts[model] : undefined;
  const mesh = meshSelection(draft), laces = laceSelection(draft);
  const beads = beadSelection(draft);
  const split = useMeshLaces(Boolean(enabled && currentAssets && draft), model, mesh, laces, beads);
  const solids = useSpecialSolids(Boolean(enabled && currentAssets && draft), model);
  const patterns = useSpecialPatterns(Boolean(enabled && currentAssets && draft), model, draft?.patterns ?? {}, currentAssets?.patterns);
  const needsSolids = Object.keys(draft?.solids ?? {}).length > 0;
  const needsPatterns = Object.keys(draft?.patterns ?? {}).length > 0;
  return {
    available, enabled, isAdmin: audience === "admin", assetsReady: Boolean(currentAssets), busy: busy || split.loading || solids.loading || patterns.loading, validate,
    mesh, laces, beads, meshReady: split.ready, meshFailed: split.failed,
    solidsReady: solids.ready, solidsFailed: solids.failed,
    patternsReady: patterns.ready, patternsFailed: patterns.failed,
    previewReady: split.ready && (!needsSolids || solids.ready) && (!needsPatterns || patterns.ready),
    toggle: () => { setEnabled(value => !value); },
    // Replace the draft even during loading. The asset response keeps an existing
    // draft, so a delayed response cannot restore the choices just cleared.
    reset: () => { setDrafts(prev => ({ ...prev, [model]: createWhiteSpecialDraft(model) })); },
    names: draft?.names ?? baseNames,
    swatch: currentAssets?.swatch,
    flowers: draft?.flowers ?? {},
    solids: draft?.solids ?? {},
    patterns: draft?.patterns ?? {},
    patternAssets: currentAssets?.patterns ?? {},
    layers: currentAssets?.layers ?? {},
    overrides: { ...specialOverrides(draft, currentAssets), ...specialSolidOverrides(draft, solids.layers), ...patterns.layers, ...(split.layer ? { a: split.layer } : {}) },
    selectMesh: (color: MeshColor) => {
      if (!currentAssets || !split.ready) return;
      setDrafts(prev => ({ ...prev, [model]: selectMesh(prev[model]!, color) }));
    },
    selectLaces: (color: LaceColor) => {
      if (!currentAssets || !split.ready) return;
      setDrafts(prev => ({ ...prev, [model]: selectLaces(prev[model]!, color) }));
    },
    selectBeads: (color: BeadSelection) => {
      if (!currentAssets || !split.ready || model !== "high") return;
      setDrafts(prev => ({ ...prev, [model]: selectBeads(prev[model]!, color) }));
    },
    select: (part: PartId, name: string) => {
      if (audience !== "admin" && (name === FLOWER_A || (isSpecialPattern(name) && !isPublicSpecialPattern(name)))) return;
      if (!currentAssets || busy || (isSpecialSolid(name) && !solids.ready) || (isSpecialPattern(name) && !currentAssets.patterns?.[name])) return;
      setDrafts(prev => ({ ...prev, [model]: selectSpecial(prev[model]!, part, name) }));
    },
  };
}

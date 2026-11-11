import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ADMIN_SESSION_EVENT, readAdminToken } from "./admin-session";
import { modelOf, type BootModel, type PartColorNames, type PartId } from "./simulator-config";
import { createWhiteSpecialDraft, selectSpecial, specialOverrides, specialSolidOverrides, meshSelection, laceSelection, beadSelection, selectMesh, selectLaces, selectBeads, type SpecialAssets, type SpecialDraft } from "./simulator-special";
import { MESH_COLORS, LACE_COLORS, type MeshColor, type LaceColor } from "./mesh-laces";
import type { BeadSelection } from "./bead-material";
import { useMeshLaces } from "./use-mesh-laces";
import { useSpecialSolids } from "./use-special-solids";
import { isSpecialSolid } from "./special-solids";
import { isSpecialPattern } from "./special-patterns";
import { useSpecialPatterns } from "./use-special-patterns";
import { isPublicSpecialPattern, type SimulatorAudience } from "./simulator-catalog";
import { FLOWER_A } from "./simulator-special";
import { expandPatternAssets, type PatternAssetWire } from "./pattern-asset-wire";
import { completeDesign } from "./design-order";

declare const specialDraftSnapshotBrand: unique symbol;
/** In-memory undo handle. Its private draft is never persisted or exposed to callers. */
export type SpecialDraftSnapshot = Readonly<{ [specialDraftSnapshotBrand]: true }>;
type SavedSpecialDraft = {
  generation: number;
  epoch: number;
  model: BootModel;
  audience: SimulatorAudience;
  draft: SpecialDraft;
};

function copySpecialDraft(draft: SpecialDraft): SpecialDraft {
  return {
    ...draft,
    names: { ...draft.names },
    flowers: { ...draft.flowers },
    ...(draft.solids ? { solids: { ...draft.solids } } : {}),
    ...(draft.patterns ? { patterns: { ...draft.patterns } } : {}),
  };
}

export function useSpecialSimulator(model: BootModel, baseNames: PartColorNames, shareToken?: string) {
  const [accessChecked, setAccessChecked] = useState(false);
  const [available, setAvailable] = useState(false);
  const [audience, setAudience] = useState<SimulatorAudience>("public");
  const audienceRef = useRef<SimulatorAudience>("public");
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [assets, setAssets] = useState<(SpecialAssets & { model: BootModel }) | null>(null);
  const [drafts, setDrafts] = useState<Partial<Record<BootModel, SpecialDraft>>>({});
  const generation = useRef(0);
  const namesRef = useRef(baseNames);
  namesRef.current = baseNames;
  const snapshots = useRef(new WeakMap<SpecialDraftSnapshot, SavedSpecialDraft>());
  const recommendationEpoch = useRef(0);
  const recommendationContext = useRef({ model, enabled, audience, shareToken });
  const previousContext = recommendationContext.current;
  if (previousContext.model !== model || previousContext.enabled !== enabled
    || previousContext.audience !== audience || previousContext.shareToken !== shareToken) {
    recommendationEpoch.current++;
    recommendationContext.current = { model, enabled, audience, shareToken };
  }

  const clear = useCallback(() => {
    generation.current++;
    snapshots.current = new WeakMap();
    setAvailable(false); setEnabled(false); setAssets(null); setDrafts({}); setBusy(false);
    audienceRef.current = "public"; setAudience("public");
  }, []);

  const request = useCallback(async (action: "ping" | "assets", signal?: AbortSignal) => {
    const token = shareToken === undefined ? readAdminToken() : "";
    if (!token && !shareToken) throw new Error("AUTH");
    const res = await fetch("/api/simulator-special", {
      method: "POST", cache: "no-store", signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(shareToken === undefined ? { token, audience: "admin" } : { shareToken }), action, model, ...(action === "assets" ? { compact: true } : {}) }),
    });
    if (!res.ok) throw new Error(res.status === 401 ? "AUTH" : "SPECIAL_UNAVAILABLE");
    const data = await res.json();
    return action === "assets" ? { ...data, patterns: expandPatternAssets(data as PatternAssetWire) } : data;
  }, [model, shareToken]);

  const validate = useCallback(async () => {
    const current = generation.current;
    try {
      const result = await request("ping");
      const next: SimulatorAudience = shareToken === undefined ? "admin" : "shared";
      if (result.audience !== next) throw new Error("AUTH");
      if (current !== generation.current) return false;
      const changed = next !== audienceRef.current;
      if (changed) {
        // Discard private drafts and decoded assets on an audience transition.
        // The new effect loads only that audience's server-approved catalog.
        generation.current++;
        setAssets(null); setDrafts({}); setBusy(false);
        audienceRef.current = next; setAudience(next);
        if (next === "shared") setEnabled(true);
      }
      setAccessChecked(true); setAvailable(true); return !changed;
    } catch { if (current === generation.current) { clear(); setAccessChecked(true); } return false; }
  }, [request, clear, shareToken]);

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
      toast.error(error.message === "AUTH" ? (shareToken === undefined ? "관리자 로그인이 필요합니다." : "공유 링크를 확인해주세요.") : "스페셜 소재를 불러오지 못했습니다. 다시 눌러주세요.");
    }).finally(() => { if (!controller.signal.aborted && current === generation.current) setBusy(false); });
    return () => controller.abort();
  }, [enabled, model, audience, request, clear, shareToken]);

  const currentAssets = enabled && assets?.model === model ? assets : null;
  const draft = enabled ? drafts[model] : undefined;
  const mesh = meshSelection(draft), laces = laceSelection(draft);
  const beads = beadSelection(draft);
  const split = useMeshLaces(Boolean(enabled && currentAssets && draft), model, mesh, laces, beads);
  const solids = useSpecialSolids(Boolean(enabled && currentAssets && draft), model);
  const patterns = useSpecialPatterns(Boolean(enabled && currentAssets && draft), model, draft?.patterns ?? {}, currentAssets?.patterns);
  const needsSolids = Object.keys(draft?.solids ?? {}).length > 0;
  const needsPatterns = Object.keys(draft?.patterns ?? {}).length > 0;
  const actionGeneration = generation.current;
  const actionEpoch = recommendationEpoch.current;
  const canReplaceDraft = () => generation.current === actionGeneration
    && recommendationEpoch.current === actionEpoch
    && audienceRef.current === audience
    && available && enabled && (audience === "admin" || audience === "shared")
    && Boolean(currentAssets && draft && split.ready);
  const replaceDraft = (next: SpecialDraft) => {
    if (!canReplaceDraft()) return false;
    setDrafts(prev => canReplaceDraft() ? { ...prev, [model]: copySpecialDraft(next) } : prev);
    return true;
  };
  return {
    available, enabled, accessChecked, isAdmin: audience === "admin", canUsePrivateCatalog: audience === "admin" || audience === "shared", assetsReady: Boolean(currentAssets), busy: busy || split.loading || solids.loading || patterns.loading, validate,
    mesh, laces, beads, meshReady: split.ready, meshFailed: split.failed,
    solidsReady: solids.ready, solidsFailed: solids.failed,
    patternsReady: patterns.ready, patternsFailed: patterns.failed,
    previewReady: split.ready && (!needsSolids || solids.ready) && (!needsPatterns || patterns.ready),
    toggle: () => {
      if (available && (audience === "admin" || audience === "shared")) {
        // Invalidate pending async recommendation callbacks immediately, before
        // React commits the mode change.
        recommendationEpoch.current++;
        setEnabled(value => !value);
      }
    },
    snapshotDraft: (): SpecialDraftSnapshot | null => {
      if (!canReplaceDraft() || !draft) return null;
      const handle = Object.freeze({}) as SpecialDraftSnapshot;
      snapshots.current.set(handle, {
        generation: actionGeneration, epoch: actionEpoch, model, audience,
        draft: copySpecialDraft(draft),
      });
      return handle;
    },
    applyRecommendation: (input: PartColorNames, meshColor: MeshColor, laceColor: LaceColor): boolean => {
      const names = completeDesign(input);
      if (!canReplaceDraft() || !names || modelOf(names) !== model
        || !MESH_COLORS.includes(meshColor) || !LACE_COLORS.includes(laceColor)) return false;
      // Mesh, laces and visible L/beads are distinct from names.l (the hidden
      // linked layer). Existing helpers preserve that backing-layer contract.
      const next = selectLaces(selectMesh({ ...createWhiteSpecialDraft(model), names }, meshColor), laceColor);
      if (!completeDesign(next.names)) return false;
      return replaceDraft(next);
    },
    restoreDraft: (snapshot: SpecialDraftSnapshot): boolean => {
      const saved = snapshots.current.get(snapshot);
      if (!saved || saved.generation !== actionGeneration || saved.epoch !== actionEpoch
        || saved.model !== model || saved.audience !== audience) return false;
      return replaceDraft(saved.draft);
    },
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
      if (audience === "public" && (name === FLOWER_A || (isSpecialPattern(name) && !isPublicSpecialPattern(name)))) return;
      if (!currentAssets || busy || (isSpecialSolid(name) && !solids.ready) || (isSpecialPattern(name) && !currentAssets.patterns?.[name])) return;
      setDrafts(prev => ({ ...prev, [model]: selectSpecial(prev[model]!, part, name) }));
    },
  };
}

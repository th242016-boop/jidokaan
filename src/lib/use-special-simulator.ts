import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ADMIN_SESSION_EVENT, readAdminToken } from "./admin-session";
import { type BootModel, type PartColorNames, type PartId } from "./simulator-config";
import { selectSpecial, specialOverrides, meshSelection, laceSelection, selectMesh, selectLaces, type SpecialAssets, type SpecialDraft } from "./simulator-special";
import type { MeshColor, LaceColor } from "./mesh-laces";
import { useMeshLaces } from "./use-mesh-laces";

export function useSpecialSimulator(model: BootModel, baseNames: PartColorNames) {
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [assets, setAssets] = useState<(SpecialAssets & { model: BootModel }) | null>(null);
  const [drafts, setDrafts] = useState<Partial<Record<BootModel, SpecialDraft>>>({});
  const generation = useRef(0);
  const namesRef = useRef(baseNames);
  namesRef.current = baseNames;

  const clear = useCallback(() => {
    generation.current++;
    setAvailable(false); setEnabled(false); setAssets(null); setDrafts({}); setBusy(false);
  }, []);

  const request = useCallback(async (action: "ping" | "assets", signal?: AbortSignal) => {
    const token = readAdminToken();
    if (!token) throw new Error("AUTH");
    const res = await fetch("/api/simulator-special", {
      method: "POST", cache: "no-store", signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action, model }),
    });
    if (!res.ok) throw new Error(res.status === 401 ? "AUTH" : "SPECIAL_UNAVAILABLE");
    return res.json();
  }, [model]);

  const validate = useCallback(async () => {
    const current = generation.current;
    try {
      await request("ping");
      if (current !== generation.current) return false;
      setAvailable(true); return true;
    } catch { if (current === generation.current) clear(); return false; }
  }, [request, clear]);

  useEffect(() => {
    void validate();
    const focus = () => { void validate(); };
    const visible = () => { if (!document.hidden) void validate(); };
    const timer = window.setInterval(() => { if (!document.hidden) void validate(); }, 30000);
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(ADMIN_SESSION_EVENT) : null;
    if (channel) channel.onmessage = clear;
    window.addEventListener(ADMIN_SESSION_EVENT, clear);
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", visible);
    return () => {
      generation.current++;
      clearInterval(timer); channel?.close();
      window.removeEventListener(ADMIN_SESSION_EVENT, clear);
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
  }, [enabled, model, request, clear]);

  const currentAssets = enabled && assets?.model === model ? assets : null;
  const draft = enabled ? drafts[model] : undefined;
  const mesh = meshSelection(draft), laces = laceSelection(draft);
  const split = useMeshLaces(Boolean(enabled && currentAssets && draft), model, mesh, laces);
  return {
    available, enabled, busy: busy || split.loading, validate,
    mesh, laces, meshReady: split.ready, meshFailed: split.failed,
    toggle: () => { setEnabled(value => !value); },
    names: draft?.names ?? baseNames,
    swatch: currentAssets?.swatch,
    flowers: draft?.flowers ?? {},
    layers: currentAssets?.layers ?? {},
    overrides: { ...specialOverrides(draft, currentAssets), ...(split.layer ? { a: split.layer } : {}) },
    selectMesh: (color: MeshColor) => {
      if (!currentAssets || !split.ready) return;
      setDrafts(prev => ({ ...prev, [model]: selectMesh(prev[model]!, color) }));
    },
    selectLaces: (color: LaceColor) => {
      if (!currentAssets || !split.ready) return;
      setDrafts(prev => ({ ...prev, [model]: selectLaces(prev[model]!, color) }));
    },
    select: (part: PartId, name: string) => {
      if (!currentAssets || busy) return;
      setDrafts(prev => ({ ...prev, [model]: selectSpecial(prev[model]!, part, name) }));
    },
  };
}

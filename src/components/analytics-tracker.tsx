import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

const KEY = "jidokaan-utm";

function readUtm() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function captureFromUrl() {
  if (typeof window === "undefined") return readUtm();
  const p = new URLSearchParams(window.location.search);
  const next = { ...readUtm() };
  const map: Record<string, string> = {
    source: p.get("utm_source") || "",
    medium: p.get("utm_medium") || "",
    campaign: p.get("utm_campaign") || "",
    keyword:
      p.get("utm_term") ||
      p.get("n_keyword") ||
      p.get("n_query") ||
      p.get("query") ||
      p.get("q") ||
      p.get("keyword") ||
      "",
  };
  if (map.source || map.medium || map.campaign || map.keyword) {
    if (!next.landing) next.landing = window.location.pathname + window.location.search;
    Object.assign(next, Object.fromEntries(Object.entries(map).filter(([, v]) => v)));
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } else if (!next.landing) {
    next.landing = window.location.pathname;
    sessionStorage.setItem(KEY, JSON.stringify(next));
  }
  return next;
}

export function AnalyticsTracker() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const last = useRef("");

  useEffect(() => {
    if (path.startsWith("/admin") || path.startsWith("/api")) return;
    if (last.current === path) return;
    last.current = path;
    const utm = captureFromUrl();
    const ref = typeof document !== "undefined" ? document.referrer : "";
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "page",
        path,
        referrer: ref,
        source: utm.source || hostOf(ref),
        medium: utm.medium || (ref ? "referral" : "direct"),
        campaign: utm.campaign || "",
        keyword: utm.keyword || "",
        landing: utm.landing || path,
      }),
    }).catch(() => null);
  }, [path]);

  return null;
}

function hostOf(url: string) {
  try {
    return url ? new URL(url).hostname.replace(/^www\./, "") : "direct";
  } catch {
    return "direct";
  }
}

export function trackStoreEvent(type: "cart" | "order", extra?: Record<string, string>) {
  try {
    const utm = readUtm();
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        path: window.location.pathname,
        referrer: document.referrer,
        source: utm.source || "",
        medium: utm.medium || "",
        campaign: utm.campaign || "",
        keyword: utm.keyword || "",
        landing: utm.landing || "",
        ...extra,
      }),
    });
  } catch {
    /* ignore */
  }
}

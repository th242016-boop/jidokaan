import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { ACQUISITION_COOKIE, ACQUISITION_STORAGE, acquisitionFromCookie, observeAcquisition, parseAcquisition, type Acquisition } from "@/lib/acquisition";

let inMemory: Acquisition | null = null;
let lastPageHit = { path: "", at: 0 };

export function captureAcquisition(): Acquisition | null {
  if (typeof window === "undefined") return null;
  let existing = parseAcquisition(inMemory);
  try { existing = parseAcquisition(JSON.parse(sessionStorage.getItem(ACQUISITION_STORAGE) || "null")) || existing; }
  catch { /* Browsers may disable storage; analytics must not break shopping. */ }
  const arrival = observeAcquisition(window.location.href, document.referrer);
  // Preserve the source across www -> canonical OAuth redirects; a new external
  // arrival in another tab still takes precedence over the shared cookie.
  const value = existing || (arrival.source === "direct" ? acquisitionFromCookie(document.cookie) : null) || arrival;
  inMemory = value;
  try { sessionStorage.setItem(ACQUISITION_STORAGE, JSON.stringify(value)); } catch { /* optional */ }
  try {
    // Same-site one-day attribution; no identifier, full URL, auth code or personal fields.
    const domain = ["jidokaan.com", "www.jidokaan.com"].includes(location.hostname) ? "; Domain=jidokaan.com" : "";
    document.cookie = `${ACQUISITION_COOKIE}=${encodeURIComponent(JSON.stringify(value))}; Path=/; Max-Age=86400; SameSite=Lax${domain}${location.protocol === "https:" ? "; Secure" : ""}`;
  } catch { /* optional */ }
  return value;
}

function sendHit(type: "page" | "cart" | "order") {
  const acquisition = captureAcquisition();
  if (!acquisition) return;
  if (type === "page") {
    if (lastPageHit.path === window.location.pathname && Date.now() - lastPageHit.at < 500) return;
    lastPageHit = { path: window.location.pathname, at: Date.now() };
  }
  void fetch("/api/analytics", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, path: window.location.pathname,
      ...acquisition, referrer: acquisition.referrerHost ? `https://${acquisition.referrerHost}` : "" }),
  }).catch(() => null);
}

export function AnalyticsTracker() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const last = useRef("");
  useEffect(() => {
    if (path.startsWith("/admin") || path.startsWith("/api") || last.current === path) return;
    last.current = path;
    sendHit("page");
  }, [path]);
  return null;
}

export function trackStoreEvent(type: "cart" | "order", _extra?: Record<string, string>) {
  try { sendHit(type); } catch { /* analytics must not block checkout */ }
}

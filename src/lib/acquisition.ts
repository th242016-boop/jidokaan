/** Browser-observed acquisition, never inferred from a customer's identity. */
export const ACQUISITION_COOKIE = "jidokaan_acquisition_v1";
export const ACQUISITION_STORAGE = "jidokaan-acquisition-v1";
export type Acquisition = {
  source: string; medium: string; campaign: string; keyword: string;
  landing: string; referrerHost: string; observedAt: string;
};

const text = (value: unknown, limit = 80) => typeof value === "string"
  ? value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, limit) : "";

export function acquisitionPath(value: unknown) {
  const path = text(value, 500).split(/[?#]/)[0];
  return path.startsWith("/") && !path.startsWith("//") ? path.slice(0, 200) : "/";
}

export function isInternalReferrer(host: string, currentHost = "jidokaan.com") {
  const h = host.toLowerCase().replace(/^www\./, "");
  return !h || [currentHost.toLowerCase().replace(/^www\./, ""), "jidokaan.com",
    "jidokaan-production.up.railway.app", "accounts.google.com", "kauth.kakao.com",
    "accounts.kakao.com", "nid.naver.com"].includes(h);
}

function searchProvider(host: string): "naver" | "google" | "bing" | "daum" | null {
  if (/^(m\.)?search\.naver\.com$/.test(host)) return "naver";
  if (/^(www\.)?google\.(com|co\.kr|co\.jp|co\.uk|com\.au|ca|de|fr|pl|es|it|co\.in)$/.test(host)) return "google";
  if (/^(www\.)?bing\.com$/.test(host)) return "bing";
  if (/^(m\.)?search\.daum\.net$/.test(host)) return "daum";
  return null;
}

export function observeAcquisition(href: string, referrer: string, now = new Date()): Acquisition {
  const url = new URL(href);
  let ref: URL | null = null;
  try { ref = referrer ? new URL(referrer) : null; } catch { /* unavailable */ }
  const host = ref?.hostname.toLowerCase().replace(/^www\./, "") || "";
  const external = !isInternalReferrer(host, url.hostname);
  const provider = external ? searchProvider(host) : null;
  const p = url.searchParams;
  const utmSource = text(p.get("utm_source")).toLowerCase();
  // Generic landing ?q= and ?email= are NOT search acquisition evidence.
  const keyword = p.get("utm_term") || p.get("n_keyword") || p.get("n_query") ||
    (provider && ref ? ref.searchParams.get(provider === "naver" || provider === "daum" ? "query" : "q") : "") || "";
  return {
    source: utmSource || (external ? host : "direct"),
    medium: text(p.get("utm_medium")) || (utmSource ? "campaign" : provider ? "organic" : external ? "referral" : "direct"),
    campaign: text(p.get("utm_campaign")), keyword: text(keyword, 120),
    landing: acquisitionPath(url.pathname), referrerHost: external ? host : "", observedAt: now.toISOString(),
  };
}

export function parseAcquisition(value: unknown, now = new Date()): Acquisition | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const at = typeof v.observedAt === "string" ? Date.parse(v.observedAt) : NaN;
  if (!Number.isFinite(at) || at > now.getTime() + 60_000 || now.getTime() - at > 24 * 60 * 60 * 1000) return null;
  const source = text(v.source).toLowerCase();
  if (!source) return null;
  return { source, medium: text(v.medium), campaign: text(v.campaign), keyword: text(v.keyword, 120),
    landing: acquisitionPath(v.landing), referrerHost: text(v.referrerHost, 150).replace(/[^a-zA-Z0-9.:-]/g, ""),
    observedAt: new Date(at).toISOString() };
}

export function acquisitionFromCookie(cookieHeader: string | null): Acquisition | null {
  const raw = (cookieHeader || "").split(";").map((v) => v.trim()).find((v) => v.startsWith(`${ACQUISITION_COOKIE}=`));
  if (!raw || raw.length > 3500) return null;
  try { return parseAcquisition(JSON.parse(decodeURIComponent(raw.slice(ACQUISITION_COOKIE.length + 1)))); }
  catch { return null; }
}

/** Coarse signup device, not a fingerprint; missing UA stays unknown. */
export function signupDevice(userAgent: string | null): "pc" | "mobile" | "tablet" | "unknown" {
  if (!userAgent) return "unknown";
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(userAgent)) return "tablet";
  if (/Mobile|iPhone|iPod|Windows Phone/i.test(userAgent)) return "mobile";
  return "pc";
}

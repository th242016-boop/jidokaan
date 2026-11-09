export type AnalyticsRank = { key: string; label: string; count: number };
export type AnalyticsPage = {
  path: string;
  title: string;
  image: string;
  kind: "product" | "store" | "account" | "support" | "other";
  count: number;
};
export type AnalyticsSummary = {
  period: { from: string; to: string; timezone: "Asia/Seoul" };
  totals: { pageViews: number; cartEvents: number; orderEvents: number };
  sources: AnalyticsRank[];
  keywords: AnalyticsRank[];
  campaigns: AnalyticsRank[];
  pages: AnalyticsPage[];
  search: { pageViews: number; withKeyword: number; withoutKeyword: number };
  excludedSourceViews: number;
};

/** Calendar dates use Korean midnight regardless of the administrator's browser timezone. */
export function analyticsDateRange(days = 30, now = new Date()) {
  const today = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const from = new Date(Date.parse(`${today}T00:00:00Z`) - (days - 1) * 86400000)
    .toISOString().slice(0, 10);
  return { from, to: today };
}

export function analyticsPeriod(from?: string | null, to?: string | null) {
  const defaults = analyticsDateRange();
  const start = from || defaults.from, end = to || defaults.to;
  const valid = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date)
    && Number.isFinite(Date.parse(`${date}T00:00:00Z`))
    && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
  if (!valid(start) || !valid(end)) throw new Error("PERIOD_INVALID");
  const span = (Date.parse(end) - Date.parse(start)) / 86400000;
  if (span < 0 || span > 365) throw new Error("PERIOD_INVALID");
  return {
    from: start,
    to: end,
    start: `${start}T00:00:00+09:00`,
    end: new Date(Date.parse(`${end}T00:00:00+09:00`) + 86400000).toISOString(),
  };
}

export function analyticsSourceLabel(source: string) {
  const key = source.toLowerCase();
  if (key === "direct") return "직접 방문 / 출처 미전달";
  if (key === "unknown") return "출처 기록 없음";
  if (/^(m\.)?search\.naver\.com$/.test(key) || key === "naver") return "네이버 검색";
  if (/^(www\.)?google\.[a-z.]+$/.test(key) || key === "google") return "구글";
  if (["ig", "instagram", "instagram.com", "l.instagram.com"].includes(key)) return "인스타그램";
  if (["fb", "facebook", "facebook.com", "m.facebook.com", "l.facebook.com"].includes(key)) return "페이스북";
  if (["youtube", "youtube.com", "m.youtube.com", "youtu.be"].includes(key)) return "유튜브";
  if (["bing", "bing.com"].includes(key)) return "빙 검색";
  if (key === "search.daum.net" || key === "daum") return "다음 검색";
  return source;
}

export function analyticsSafePath(input: unknown, fallback = "/") {
  if (typeof input !== "string" || !input.startsWith("/") || input.startsWith("//")) return fallback;
  const path = input.split(/[?#]/, 1)[0].replace(/[\u0000-\u001f\u007f\\]/g, "").slice(0, 200);
  return path && !path.startsWith("//") ? path : fallback;
}

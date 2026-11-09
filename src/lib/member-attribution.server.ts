import type { SignupDevice } from "./customer-types";

export type SignupAttributionInput = {
  device?: unknown;
  source?: unknown;
  medium?: unknown;
  campaign?: unknown;
  keyword?: unknown;
  landing?: unknown;
  referrerHost?: unknown;
};

function text(value: unknown, limit: number) {
  return typeof value === "string"
    ? value
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .trim()
        .slice(0, limit)
    : "";
}

function landingPath(value: unknown) {
  const raw = text(value, 500);
  if (!raw.startsWith("/") || raw.startsWith("//")) return "";
  // Never persist OAuth codes, private inquiry keys, emails or other URL query
  // values. Only the public pathname describes a signup landing page.
  const path = raw.split(/[?#]/, 1)[0];
  if (/^\/(api|admin)(\/|$)/i.test(path)) return "";
  return path.slice(0, 200);
}

function host(value: unknown) {
  const raw = text(value, 300);
  if (!raw) return "";
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.hostname
      .toLowerCase()
      .replace(/^www\./, "")
      .slice(0, 150);
  } catch {
    return "";
  }
}

export function normalizeSignupAttribution(input: SignupAttributionInput) {
  const device: SignupDevice = ["pc", "mobile", "tablet"].includes(String(input.device))
    ? (input.device as SignupDevice)
    : "unknown";
  return {
    device,
    source: text(input.source, 120),
    medium: text(input.medium, 80),
    campaign: text(input.campaign, 120),
    keyword: text(input.keyword, 120),
    landing: landingPath(input.landing),
    referrerHost: host(input.referrerHost),
  };
}

/**
 * Call only from the server's new-user creation hook. This deliberately has no
 * public POST endpoint and never replaces a previously captured signup source.
 * The five-minute creation guard prevents old customers being mislabeled on a
 * future login even if a caller accidentally uses the hook in that path.
 */
export async function recordSignupAttribution(userId: string, input: SignupAttributionInput) {
  if (!userId || userId.length > 300) return false;
  const value = normalizeSignupAttribution(input);
  const { getSql } = await import("./db");
  const sql = await getSql();
  const rows = await sql.query<{ user_id: string }>(
    `insert into member_signup_attribution
       (user_id, device, source, medium, campaign, keyword, landing, referrer_host)
     select u.id, $2, $3, $4, $5, $6, $7, $8
       from "user" u
       where u.id = $1 and u."createdAt" >= now() - interval '5 minutes'
     on conflict (user_id) do nothing
     returning user_id`,
    [
      userId,
      value.device,
      value.source,
      value.medium,
      value.campaign,
      value.keyword,
      value.landing,
      value.referrerHost,
    ],
  );
  return rows.length > 0;
}

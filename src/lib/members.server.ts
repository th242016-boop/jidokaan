import { assertSession } from "./admin-auth.server";
import type { MemberFilters, MemberListResponse, SignupDevice } from "./customer-types";
export type { StoreMember } from "./customer-types";

const PROVIDERS = new Set(["google", "naver", "kakao", "email", "unknown"]);
const DEVICES = new Set(["pc", "mobile", "tablet", "unknown"]);
const PAGE_SIZES = new Set([10, 20, 25, 50, 100]);

function labelProvider(id: string) {
  if (id === "google") return "구글";
  if (id === "kakao") return "카카오";
  if (id === "naver") return "네이버";
  if (id === "email" || id === "credential") return "이메일";
  return id;
}

function iso(value: unknown) {
  return value instanceof Date ? value.toISOString() : String(value ?? "");
}

function validDate(value: string | undefined) {
  if (!value) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("INVALID_FILTER");
  const time = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(time.getTime()) || time.toISOString().slice(0, 10) !== value)
    throw new Error("INVALID_FILTER");
  return value;
}

/** Database pagination and filtering, without exposing synthetic login emails. */
export async function listMembers(
  token: string,
  filters: MemberFilters = {},
): Promise<MemberListResponse> {
  await assertSession(token);
  const { getSql } = await import("./db");
  const sql = await getSql();
  const requestedPage = Number(filters.page ?? 1);
  const requestedSize = Number(filters.pageSize ?? 20);
  if (!Number.isSafeInteger(requestedPage) || requestedPage < 1 || !PAGE_SIZES.has(requestedSize))
    throw new Error("INVALID_FILTER");
  const from = validDate(filters.from);
  const to = validDate(filters.to);
  if (from && to && from > to) throw new Error("INVALID_FILTER");
  const provider = filters.provider || "";
  const device = filters.device || "";
  const searchField = filters.searchField || "all";
  if (
    (provider && !PROVIDERS.has(provider)) ||
    (device && !DEVICES.has(device)) ||
    !["all", "name", "email", "phone"].includes(searchField)
  )
    throw new Error("INVALID_FILTER");
  const source = String(filters.source || "").trim();
  if (source.length > 120) throw new Error("INVALID_FILTER");
  const q = String(filters.q || "").trim();
  if (q.length > 200) throw new Error("INVALID_FILTER");

  const params: unknown[] = [];
  const where: string[] = [];
  const parameter = (value: unknown) => {
    params.push(value);
    return `$${params.length}`;
  };
  const realEmail = "case when lower(u.email) like '%@login.jidokaan.com' then '' else u.email end";
  if (q) {
    const term = parameter(`%${q.replace(/[\\%_]/g, "\\$&")}%`);
    const phoneDigits = q.replace(/\D/g, "");
    const normalizedPhoneTerm =
      (searchField === "all" || searchField === "phone") &&
      /^[+\d\s().-]+$/.test(q) &&
      phoneDigits.length >= 3
        ? parameter(`%${phoneDigits}%`)
        : "";
    const expressions = {
      name: `u.name ilike ${term}`,
      email: `${realEmail} ilike ${term}`,
      phone: normalizedPhoneTerm
        ? `(coalesce(p.phone, '') ilike ${term} or regexp_replace(coalesce(p.phone, ''), '[^0-9]', '', 'g') like ${normalizedPhoneTerm})`
        : `coalesce(p.phone, '') ilike ${term}`,
    };
    where.push(
      searchField === "all"
        ? `(${Object.values(expressions).join(" or ")})`
        : expressions[searchField as keyof typeof expressions],
    );
  }
  if (provider === "unknown") {
    where.push('not exists (select 1 from "account" a where a."userId" = u.id)');
  } else if (provider) {
    where.push(
      provider === "email"
        ? `exists (select 1 from "account" a where a."userId" = u.id and a."providerId" in ('credential', 'email'))`
        : `exists (select 1 from "account" a where a."userId" = u.id and a."providerId" = ${parameter(provider)})`,
    );
  }
  if (device) where.push(`coalesce(at.device, 'unknown') = ${parameter(device)}`);
  if (source === "__unknown__") where.push("coalesce(at.source, '') = ''");
  else if (source) where.push(`at.source = ${parameter(source)}`);
  // Dates displayed in the admin are Korean calendar dates, inclusive of both ends.
  if (from) where.push(`u."createdAt" >= ${parameter(`${from}T00:00:00+09:00`)}::timestamptz`);
  if (to)
    where.push(
      `u."createdAt" < ${parameter(`${to}T00:00:00+09:00`)}::timestamptz + interval '1 day'`,
    );
  const fromSql = `from "user" u
    left join member_profiles p on p.user_id = u.id
    left join member_signup_attribution at on at.user_id = u.id`;
  const whereSql = where.length ? `where ${where.join(" and ")}` : "";

  const [countRows, allRows, sourceRows] = await Promise.all([
    sql.query<{ count: number }>(
      `select count(*)::integer as count ${fromSql} ${whereSql}`,
      params,
    ),
    sql.query<{ count: number }>('select count(*)::integer as count from "user"'),
    sql.query<{ source: string }>(
      `select distinct source from member_signup_attribution where source <> '' order by source`,
    ),
  ]);
  const total = Number(countRows[0]?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / requestedSize));
  const page = Math.min(requestedPage, totalPages);
  const rows = await sql.query<{
    id: string;
    name: string;
    email: string;
    phone: string;
    verified: boolean;
    created: string | Date;
    providers: string | null;
    attribution_id: string | null;
    device: SignupDevice;
    source: string;
    medium: string;
    campaign: string;
    keyword: string;
    landing: string;
    referrer_host: string;
    captured_at: string | Date;
  }>(
    `select u.id, u.name, ${realEmail} as email, u."emailVerified" as verified,
      u."createdAt" as created, coalesce(p.phone, '') as phone,
      (select string_agg(distinct a."providerId", ',' order by a."providerId")
         from "account" a where a."userId" = u.id) as providers,
      at.user_id as attribution_id, at.device, at.source, at.medium, at.campaign,
      at.keyword, at.landing, at.referrer_host, at.captured_at
    ${fromSql} ${whereSql}
    order by u."createdAt" desc, u.id desc
    limit $${params.length + 1} offset $${params.length + 2}`,
    [...params, requestedSize, (page - 1) * requestedSize],
  );

  return {
    members: rows.map((r) => {
      const providerIds = [
        ...new Set(
          String(r.providers || "")
            .split(",")
            .filter(Boolean)
            .map((id) => (id === "credential" ? "email" : id)),
        ),
      ];
      return {
        id: r.id,
        name: r.name || "",
        email: r.email || "",
        emailUnavailable: !r.email,
        phone: r.phone || "",
        verified: Boolean(r.email && r.verified),
        createdAt: iso(r.created),
        providers: providerIds.map(labelProvider),
        providerIds,
        attribution: r.attribution_id
          ? {
              device: r.device,
              source: r.source,
              medium: r.medium,
              campaign: r.campaign,
              keyword: r.keyword,
              landing: r.landing,
              referrerHost: r.referrer_host,
              capturedAt: iso(r.captured_at),
            }
          : null,
      };
    }),
    total,
    allTotal: Number(allRows[0]?.count ?? 0),
    page,
    pageSize: requestedSize,
    totalPages,
    filterOptions: { sources: sourceRows.map((r) => r.source) },
  };
}

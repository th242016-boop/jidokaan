import { assertSession } from "./admin-auth.server";

export type StoreMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  verified: boolean;
  createdAt: string;
  providers: string[];
};

function labelProvider(id: string) {
  if (id === "google") return "구글";
  if (id === "kakao") return "카카오";
  if (id === "naver") return "네이버";
  if (id === "credential" || id === "email") return "이메일";
  return id;
}

export async function listMembers(token: string): Promise<StoreMember[]> {
  await assertSession(token);
  const { getSql } = await import("./db");
  const sql = await getSql();
  try {
    await sql.query(`
      create table if not exists member_profiles (
        user_id text primary key,
        phone text not null default '',
        updated_at timestamptz not null default now()
      )
    `);
    const rows = await sql.query<{
      id: string;
      name: string;
      email: string;
      phone: string | null;
      verified: boolean;
      created: string | Date;
      providers: string | null;
    }>(
      `select u.id, u.name, u.email, u."emailVerified" as verified,
              u."createdAt" as created,
              coalesce(max(p.phone), '') as phone,
              coalesce(string_agg(distinct a."providerId", ','), '') as providers
       from "user" u
       left join "account" a on a."userId" = u.id
       left join member_profiles p on p.user_id = u.id
       group by u.id, u.name, u.email, u."emailVerified", u."createdAt"
       order by u."createdAt" desc`,
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name || "",
      email: r.email || "",
      phone: r.phone || "",
      verified: Boolean(r.verified),
      createdAt:
        r.created instanceof Date ? r.created.toISOString() : String(r.created ?? ""),
      providers: String(r.providers || "")
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
        .map(labelProvider),
    }));
  } catch {
    return [];
  }
}

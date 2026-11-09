-- Additive only: historical identities, profiles and orders remain unchanged.
-- Capture acquisition/device at NEW signup only. Old members keep an explicit
-- missing attribution state rather than inheriting a later login's source.
create table if not exists member_signup_attribution (
  user_id text primary key references "user" (id) on delete cascade,
  device text not null default 'unknown'
    check (device in ('pc', 'mobile', 'tablet', 'unknown')),
  source text not null default '',
  medium text not null default '',
  campaign text not null default '',
  keyword text not null default '',
  landing text not null default '',
  referrer_host text not null default '',
  captured_at timestamptz not null default now()
);

create index if not exists member_signup_attribution_source_idx
  on member_signup_attribution (source);
create index if not exists member_signup_attribution_device_idx
  on member_signup_attribution (device);
create index if not exists member_user_created_id_idx
  on "user" ("createdAt" desc, id desc);
create index if not exists member_account_provider_user_idx
  on "account" ("providerId", "userId");

-- Existing analytics used lazy runtime table creation. Establish it before the
-- date index so an empty local database and an existing production DB both work.
create table if not exists store_analytics (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists store_analytics_created_at_idx on store_analytics (created_at);

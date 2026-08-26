create table if not exists member_profiles (
  user_id text primary key,
  phone text not null default '',
  updated_at timestamptz not null default now()
);

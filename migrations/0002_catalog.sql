create table if not exists catalog_products (
  id text primary key,
  data jsonb not null,
  sort integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists site_settings (
  key text primary key,
  value text not null
);

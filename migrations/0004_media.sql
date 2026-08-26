create table if not exists media_files (
  id text primary key,
  mime text not null default 'application/octet-stream',
  bytes bytea not null,
  created_at timestamptz not null default now()
);

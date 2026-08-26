create table if not exists media_files (
  id text primary key,
  mime text not null default 'application/octet-stream',
  bytes bytea,
  b64 text,
  created_at timestamptz not null default now()
);
alter table media_files add column if not exists b64 text;

create table if not exists admin_sessions (
  token_hash text primary key,
  expires_at timestamptz not null
);

alter table admin_sessions add column if not exists credential_tag text;
-- Old tokens were sent in URLs. Require a fresh sign-in after this release.
delete from admin_sessions where credential_tag is null;

create table if not exists admin_totp_uses (
  credential_tag text not null,
  time_step bigint not null,
  primary key (credential_tag, time_step)
);

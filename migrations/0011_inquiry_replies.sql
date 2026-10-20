-- Additive only: retain every existing inquiry and the order notification setup.
create table if not exists store_inbox (
  id text primary key, data jsonb not null, status text not null default 'new',
  created_at timestamptz not null default now()
);
create table if not exists inbox_access (
  inbox_id text primary key references store_inbox(id) on delete cascade,
  access_key text not null unique
);
create table if not exists inbox_messages (
  id text primary key,
  inbox_id text not null references store_inbox(id) on delete cascade,
  author text not null check (author in ('customer', 'admin')),
  body text not null,
  site_visible boolean not null default true,
  email_state text not null default 'none' check (email_state in ('none', 'pending', 'accepted', 'failed')),
  email_payload jsonb,
  email_attempts integer not null default 0,
  email_next_at timestamptz not null default now(),
  email_first_at timestamptz,
  email_lease text,
  email_locked_until timestamptz,
  email_provider_id text,
  email_error text,
  created_at timestamptz not null default now()
);
create index if not exists inbox_messages_thread on inbox_messages(inbox_id, created_at);
create index if not exists inbox_messages_pending on inbox_messages(email_next_at) where email_state = 'pending';
create table if not exists inbox_rate_limits (
  bucket text primary key, hits integer not null, expires_at timestamptz not null
);
create table if not exists telegram_inbox_outbox (
  event_id text primary key,
  inbox_id text not null references store_inbox(id) on delete cascade,
  bot_id text not null, chat_id text not null, message_text text not null,
  state text not null default 'pending', attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(), locked_until timestamptz,
  lease_token text, sent_at timestamptz, telegram_message_id text, last_error text,
  created_at timestamptz not null default now()
);
create index if not exists telegram_inbox_pending on telegram_inbox_outbox(next_attempt_at) where state = 'pending';

-- Bot credentials stay in Railway environment variables, never in this table.
create table if not exists telegram_order_settings (
  id integer primary key check (id = 1),
  bot_id text,
  chat_id text,
  chat_label text,
  enabled boolean not null default false,
  enabled_since timestamptz,
  pairing_hash text,
  pairing_expires_at timestamptz,
  last_test_at timestamptz
);
insert into telegram_order_settings (id) values (1) on conflict do nothing;

create table if not exists telegram_order_outbox (
  order_id text primary key,
  bot_id text not null,
  chat_id text not null,
  message_text text not null,
  state text not null default 'pending',
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  locked_until timestamptz,
  lease_token text,
  sent_at timestamptz,
  telegram_message_id text,
  last_error text,
  created_at timestamptz not null default now()
);
create index if not exists telegram_order_outbox_pending
  on telegram_order_outbox (next_attempt_at) where state = 'pending';

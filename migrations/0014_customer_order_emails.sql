-- Opt-in transactional confirmations. No customer email is enqueued by migration.
-- Credentials and activation cutoff remain in server environment variables.
create table if not exists customer_order_email_outbox (
  order_id text primary key,
  locale text not null,
  payload jsonb not null,
  state text not null default 'pending'
    check (state in ('pending', 'accepted', 'failed', 'suppressed')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  first_attempt_at timestamptz,
  locked_until timestamptz,
  lease_token text,
  provider_id text,
  accepted_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);
create index if not exists customer_order_email_outbox_pending
  on customer_order_email_outbox (next_attempt_at) where state = 'pending';

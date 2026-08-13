-- Dedup store for Messenger webhook events (§7.2: "Deduplicate on message.mid — store
-- processed mids and skip repeats"). Meta retries on slow responses, so the same event can
-- arrive more than once. Service-role only — this is internal webhook bookkeeping, never
-- read or written by staff or anon.
create table messenger_processed_events (
  mid text primary key,
  processed_at timestamptz not null default now()
);

alter table messenger_processed_events enable row level security;
-- No policies: RLS enabled with zero policies denies all access except service_role
-- (which bypasses RLS entirely), matching every other webhook-only table in this schema.

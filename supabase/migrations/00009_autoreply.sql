create table autoreply_intents (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  keywords text[] not null default '{}',
  patterns text[] not null default '{}',
  response_template text not null,
  requires_human boolean not null default false,
  priority int not null default 0,
  is_active boolean not null default true,
  hit_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on autoreply_intents
  for each row execute function set_updated_at();

create table autoreply_logs (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid references inquiries (id) on delete cascade,
  inbound_text text not null,
  matched_intent_key text,
  confidence numeric,
  response_sent text,
  was_escalated boolean not null default false,
  channel inquiry_source not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index autoreply_logs_inquiry_id_idx on autoreply_logs (inquiry_id);

create trigger set_updated_at before update on autoreply_logs
  for each row execute function set_updated_at();

-- RLS. Intents (and their canned-response templates) are staff-managed config; logs are
-- staff-readable for the inquiry thread view and the settings test box (§9.10).
alter table autoreply_intents enable row level security;
create policy "staff manage autoreply_intents" on autoreply_intents
  for all to authenticated using (is_staff()) with check (is_staff());

alter table autoreply_logs enable row level security;
create policy "staff read autoreply_logs" on autoreply_logs
  for select to authenticated using (is_staff());
create policy "staff write autoreply_logs" on autoreply_logs
  for insert to authenticated with check (is_staff());

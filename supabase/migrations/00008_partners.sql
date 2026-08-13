create table partners (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  equity_percent numeric(5, 2) not null,
  is_active boolean not null default true,
  joined_at date not null default ph_today(),
  user_id uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partners_equity_percent_range check (equity_percent >= 0 and equity_percent <= 100)
);

create trigger set_updated_at before update on partners
  for each row execute function set_updated_at();

-- expenses.paid_by_partner_id couldn't reference partners until now — that table is
-- created here, after the inventory/capital migration that defines expenses.
alter table expenses add constraint expenses_paid_by_partner_id_fkey foreign key (paid_by_partner_id) references partners (id);

-- Deferred so a transaction that updates several partners' equity in sequence only has to
-- sum to 100% by commit, not after every individual row write.
create or replace function check_partner_equity_sum()
returns trigger
language plpgsql
as $$
declare
  v_total numeric;
begin
  select coalesce(sum(equity_percent), 0) into v_total from partners where is_active = true;

  if v_total <> 100.00 then
    raise exception 'Active partner equity must sum to 100%% (currently %)', v_total;
  end if;

  return null;
end;
$$;

create constraint trigger partners_equity_sum_check
  after insert or update or delete on partners
  deferrable initially deferred
  for each row execute function check_partner_equity_sum();

create table capital_contributions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners (id),
  amount bigint not null,
  contributed_at date not null default ph_today(),
  method text,
  reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint capital_contributions_amount_positive check (amount > 0)
);

create index capital_contributions_partner_id_idx on capital_contributions (partner_id);

create trigger set_updated_at before update on capital_contributions
  for each row execute function set_updated_at();

create table profit_distributions (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  revenue bigint not null,
  cogs bigint not null,
  gross_profit bigint not null,
  operating_expenses bigint not null,
  net_profit bigint not null,
  distributed_amount bigint not null,
  retained_amount bigint not null,
  status distribution_status not null default 'draft',
  finalized_at timestamptz,
  finalized_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profit_distributions_period_order check (period_end >= period_start),
  constraint profit_distributions_distributed_amount_nonnegative check (distributed_amount >= 0)
);

create trigger set_updated_at before update on profit_distributions
  for each row execute function set_updated_at();

-- Finalized distributions are immutable — corrections require a new reversing entry (§9.9).
create or replace function prevent_finalized_distribution_edit()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'finalized' then
    raise exception 'Finalized distributions are immutable; create a reversing entry instead.';
  end if;
  return new;
end;
$$;

create trigger profit_distributions_immutable_once_finalized
  before update on profit_distributions
  for each row execute function prevent_finalized_distribution_edit();

create table distribution_lines (
  id uuid primary key default gen_random_uuid(),
  distribution_id uuid not null references profit_distributions (id) on delete cascade,
  partner_id uuid not null references partners (id),
  equity_percent_snapshot numeric(5, 2) not null,
  amount bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint distribution_lines_amount_nonnegative check (amount >= 0)
);

create index distribution_lines_distribution_id_idx on distribution_lines (distribution_id);
create index distribution_lines_partner_id_idx on distribution_lines (partner_id);

create trigger set_updated_at before update on distribution_lines
  for each row execute function set_updated_at();

-- A payout not linked to a distribution is a drawing against the partner's balance (§5.5).
create table partner_payouts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners (id),
  distribution_id uuid references profit_distributions (id),
  amount bigint not null,
  paid_at date not null default ph_today(),
  method text,
  reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_payouts_amount_positive check (amount > 0)
);

create index partner_payouts_partner_id_idx on partner_payouts (partner_id);

create trigger set_updated_at before update on partner_payouts
  for each row execute function set_updated_at();

-- RLS. §9.9 labels the whole /admin/partners section "Owner-only," while §9's role matrix
-- describes admin as having "everything except finalizing distributions and editing
-- equity" — these two statements are in tension for partner data specifically. Resolved
-- here as: admin+ can read (needed for admin's broader financial-reporting access), but
-- only owner can write anything (equity, contributions, distributions, payouts). Flagged
-- for the owner to confirm in README.
alter table partners enable row level security;
create policy "admin+ read partners" on partners
  for select to authenticated using (is_admin_or_owner());
create policy "owner manage partners" on partners
  for insert to authenticated with check (is_owner());
create policy "owner update partners" on partners
  for update to authenticated using (is_owner()) with check (is_owner());
create policy "owner delete partners" on partners
  for delete to authenticated using (is_owner());

alter table capital_contributions enable row level security;
create policy "admin+ read capital_contributions" on capital_contributions
  for select to authenticated using (is_admin_or_owner());
create policy "owner manage capital_contributions" on capital_contributions
  for insert to authenticated with check (is_owner());
create policy "owner update capital_contributions" on capital_contributions
  for update to authenticated using (is_owner()) with check (is_owner());
create policy "owner delete capital_contributions" on capital_contributions
  for delete to authenticated using (is_owner());

alter table profit_distributions enable row level security;
create policy "admin+ read profit_distributions" on profit_distributions
  for select to authenticated using (is_admin_or_owner());
create policy "owner manage profit_distributions" on profit_distributions
  for insert to authenticated with check (is_owner());
create policy "owner update profit_distributions" on profit_distributions
  for update to authenticated using (is_owner()) with check (is_owner());

alter table distribution_lines enable row level security;
create policy "admin+ read distribution_lines" on distribution_lines
  for select to authenticated using (is_admin_or_owner());
create policy "owner manage distribution_lines" on distribution_lines
  for insert to authenticated with check (is_owner());

alter table partner_payouts enable row level security;
create policy "admin+ read partner_payouts" on partner_payouts
  for select to authenticated using (is_admin_or_owner());
create policy "owner manage partner_payouts" on partner_payouts
  for insert to authenticated with check (is_owner());
create policy "owner update partner_payouts" on partner_payouts
  for update to authenticated using (is_owner()) with check (is_owner());

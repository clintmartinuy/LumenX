create table staff_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade unique,
  full_name text not null,
  role staff_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on staff_profiles
  for each row execute function set_updated_at();

-- Central role lookup used by every RLS policy below. SECURITY DEFINER so it can read
-- staff_profiles regardless of the caller's own row-level access to that table.
create or replace function current_staff_role()
returns staff_role
language sql
security definer
stable
set search_path = public
as $$
  select role from staff_profiles where user_id = auth.uid() and is_active = true limit 1;
$$;

create or replace function is_staff()
returns boolean
language sql
stable
as $$
  select current_staff_role() is not null;
$$;

create or replace function is_admin_or_owner()
returns boolean
language sql
stable
as $$
  select current_staff_role() in ('owner', 'admin');
$$;

create or replace function is_owner()
returns boolean
language sql
stable
as $$
  select current_staff_role() = 'owner';
$$;

alter table staff_profiles enable row level security;

create policy "staff read staff_profiles" on staff_profiles
  for select to authenticated using (is_staff());

create policy "owner manage staff_profiles" on staff_profiles
  for all to authenticated using (is_owner()) with check (is_owner());

-- Single-row settings table.
create table settings (
  id boolean primary key default true,
  business_name text not null default 'LumenX PH',
  phone text,
  email text,
  address text,
  business_hours jsonb not null default '{}'::jsonb,
  tax_rate numeric not null default 0,
  default_warranty_months int not null default 6,
  facebook_page_url text default 'https://www.facebook.com/LumenxPH',
  autoreply_enabled boolean not null default true,
  autoreply_after_hours_only boolean not null default false,
  low_stock_alert_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint settings_singleton check (id)
);

create trigger set_updated_at before update on settings
  for each row execute function set_updated_at();

insert into settings (id) values (true);

alter table settings enable row level security;

create policy "anyone reads settings" on settings
  for select to anon, authenticated using (true);

create policy "admin+ updates settings" on settings
  for update to authenticated using (is_admin_or_owner()) with check (is_admin_or_owner());

-- Audit log: written by application code on every mutation to sales, stock_movements,
-- partners, profit_distributions, and partner_payouts.
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id),
  action text not null,
  table_name text not null,
  record_id uuid,
  changes jsonb,
  created_at timestamptz not null default now()
);

alter table audit_log enable row level security;

create policy "admin+ read audit_log" on audit_log
  for select to authenticated using (is_admin_or_owner());

create policy "staff write audit_log" on audit_log
  for insert to authenticated with check (is_staff());

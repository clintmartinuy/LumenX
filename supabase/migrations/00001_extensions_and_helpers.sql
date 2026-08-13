-- Extensions
create extension if not exists pgcrypto;

-- Generic updated_at trigger, applied to every table below.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Auto-reference number generator (PO-YYYYMM-####, INQ-YYYYMMDD-####, BK-YYYYMMDD-####, S-YYYYMMDD-####).
-- One counter row per (scope, period); concurrent inserts serialize on the row lock from
-- the ON CONFLICT DO UPDATE, so numbers never collide or skip under concurrent writes.
create table reference_counters (
  scope text not null,
  period text not null,
  counter int not null default 0,
  primary key (scope, period)
);

create or replace function next_reference(p_scope text, p_prefix text, p_period text, p_width int default 4)
returns text
language plpgsql
as $$
declare
  v_counter int;
begin
  insert into reference_counters (scope, period, counter)
  values (p_scope, p_period, 1)
  on conflict (scope, period) do update set counter = reference_counters.counter + 1
  returning counter into v_counter;

  return p_prefix || '-' || p_period || '-' || lpad(v_counter::text, p_width, '0');
end;
$$;

-- Today's date in the business timezone, used by reference-number periods and
-- anywhere business-day logic (booking availability, "today" dashboard figures) needs it.
create or replace function ph_today()
returns date
language sql
stable
as $$
  select (now() at time zone 'Asia/Manila')::date;
$$;

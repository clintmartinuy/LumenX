-- reference_counters was created without RLS in 00001, leaving it publicly readable/
-- writable via the anon key (Supabase's public-table security scan flags this). It's only
-- ever touched through next_reference(), so lock the table down entirely and make that
-- function SECURITY DEFINER (with a pinned search_path, per Postgres's own guidance for
-- definer functions) so callers of any role can still generate reference numbers.
alter table reference_counters enable row level security;

create or replace function next_reference(p_scope text, p_prefix text, p_period text, p_width int default 4)
returns text
language plpgsql
security definer
set search_path = public
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

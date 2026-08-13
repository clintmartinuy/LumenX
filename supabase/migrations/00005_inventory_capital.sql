create table suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on suppliers
  for each row execute function set_updated_at();

create table purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_number text not null unique default next_reference('po', 'PO', to_char(ph_today(), 'YYYYMM')),
  supplier_id uuid not null references suppliers (id),
  order_date date not null default ph_today(),
  received_date date,
  status po_status not null default 'draft',
  shipping_cost bigint not null default 0,
  other_costs bigint not null default 0,
  notes text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchase_orders_shipping_cost_nonnegative check (shipping_cost >= 0),
  constraint purchase_orders_other_costs_nonnegative check (other_costs >= 0)
);

create trigger set_updated_at before update on purchase_orders
  for each row execute function set_updated_at();

create table purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references purchase_orders (id) on delete cascade,
  product_id uuid not null references products (id),
  quantity_ordered int not null,
  quantity_received int not null default 0,
  unit_cost bigint not null,
  line_total bigint generated always as (quantity_ordered * unit_cost) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchase_order_items_quantity_ordered_positive check (quantity_ordered > 0),
  constraint purchase_order_items_quantity_received_nonnegative check (quantity_received >= 0),
  constraint purchase_order_items_unit_cost_nonnegative check (unit_cost >= 0)
);

create index purchase_order_items_po_id_idx on purchase_order_items (purchase_order_id);
create index purchase_order_items_product_id_idx on purchase_order_items (product_id);

create trigger set_updated_at before update on purchase_order_items
  for each row execute function set_updated_at();

-- Single source of truth for quantity on hand. Never update a product's stock directly —
-- always insert a movement; product_stock (below) derives on-hand qty and cost from this table.
create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id),
  movement_type stock_movement_type not null,
  quantity int not null,
  unit_cost bigint,
  reference_type stock_reference_type,
  reference_id uuid,
  notes text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stock_movements_quantity_positive check (quantity > 0),
  constraint stock_movements_unit_cost_nonnegative check (unit_cost is null or unit_cost >= 0)
);

create index stock_movements_product_id_idx on stock_movements (product_id, created_at);
create index stock_movements_reference_idx on stock_movements (reference_type, reference_id);

create trigger set_updated_at before update on stock_movements
  for each row execute function set_updated_at();

-- Derived view (not a maintained table): quantity on hand and moving-weighted-average cost
-- per product, computed by replaying stock_movements in chronological order. Outgoing
-- movements (sale_out, damage_out, adjustment_out, demo_out) consume at the average cost
-- prevailing immediately before that movement; incoming movements blend in at their own
-- unit_cost. Chosen over a trigger-maintained table for correctness-by-construction — it
-- can never drift from stock_movements. Revisit as a maintained table only if this proves
-- measurably slow (recursive CTE cost grows with movement count per product).
create view product_stock with (security_invoker = true) as
with recursive movements_ordered as (
  select
    sm.product_id,
    sm.id,
    sm.movement_type,
    sm.quantity,
    sm.unit_cost,
    row_number() over (partition by sm.product_id order by sm.created_at, sm.id) as rn
  from stock_movements sm
),
recursive_avg as (
  select
    m.product_id,
    m.rn,
    case when m.movement_type in ('purchase_in', 'return_in', 'adjustment_in')
      then m.quantity
      else -m.quantity
    end::numeric as running_qty,
    case when m.movement_type in ('purchase_in', 'return_in', 'adjustment_in')
      then m.quantity * coalesce(m.unit_cost, 0)
      else 0
    end::numeric as running_value
  from movements_ordered m
  where m.rn = 1

  union all

  select
    m.product_id,
    m.rn,
    case
      when m.movement_type in ('purchase_in', 'return_in', 'adjustment_in')
        then r.running_qty + m.quantity
      else r.running_qty - m.quantity
    end,
    case
      when m.movement_type in ('purchase_in', 'return_in', 'adjustment_in')
        then r.running_value + (m.quantity * coalesce(m.unit_cost, 0))
      when r.running_qty > 0
        then r.running_value - (m.quantity * (r.running_value / r.running_qty))
      else r.running_value
    end
  from movements_ordered m
  join recursive_avg r on r.product_id = m.product_id and r.rn = m.rn - 1
)
select
  p.id as product_id,
  coalesce(latest.running_qty, 0)::int as quantity_on_hand,
  case when coalesce(latest.running_qty, 0) > 0
    then round(latest.running_value / latest.running_qty)
    else 0
  end::bigint as average_unit_cost,
  coalesce(round(latest.running_value), 0)::bigint as stock_value
from products p
left join lateral (
  select running_qty, running_value
  from recursive_avg
  where product_id = p.id
  order by rn desc
  limit 1
) latest on true;

-- Public-safe derivative of product_stock: a status badge only, never the raw quantity
-- (spec §6.2 — "never show the raw quantity publicly"). Safe to grant to anon.
create view product_stock_status with (security_invoker = true) as
select
  ps.product_id,
  case
    when ps.quantity_on_hand <= 0 then 'out_of_stock'
    when ps.quantity_on_hand <= p.reorder_point then 'low_stock'
    else 'in_stock'
  end as status
from product_stock ps
join products p on p.id = ps.product_id;

create table expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null default ph_today(),
  category expense_category not null,
  description text not null,
  amount bigint not null,
  paid_by_partner_id uuid,
  receipt_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expenses_amount_nonnegative check (amount >= 0)
);

create trigger set_updated_at before update on expenses
  for each row execute function set_updated_at();

-- RLS. Suppliers, purchase orders, and expenses carry cost data that feeds COGS and
-- partner profit — restricted to admin+, matching the "staff: no cost prices, no margins"
-- rule in §9. Stock movements and product_stock are readable by any staff role since
-- staff performs inventory adjustments day-to-day; hiding the unit_cost/average_unit_cost
-- *columns* specifically from plain `staff` (vs admin+) is enforced in the admin UI query
-- layer in later phases, not by RLS — Postgres RLS is row-level, and staff/admin share the
-- same `authenticated` Postgres role, so column-level DB enforcement isn't practical here.
-- Flagged in README as an assumption to confirm with the owner.
alter table suppliers enable row level security;
create policy "admin+ manage suppliers" on suppliers
  for all to authenticated using (is_admin_or_owner()) with check (is_admin_or_owner());

alter table purchase_orders enable row level security;
create policy "admin+ manage purchase_orders" on purchase_orders
  for all to authenticated using (is_admin_or_owner()) with check (is_admin_or_owner());

alter table purchase_order_items enable row level security;
create policy "admin+ manage purchase_order_items" on purchase_order_items
  for all to authenticated using (is_admin_or_owner()) with check (is_admin_or_owner());

alter table stock_movements enable row level security;
create policy "staff read stock_movements" on stock_movements
  for select to authenticated using (is_staff());
create policy "staff write stock_movements" on stock_movements
  for insert to authenticated with check (is_staff());

alter table expenses enable row level security;
create policy "admin+ manage expenses" on expenses
  for all to authenticated using (is_admin_or_owner()) with check (is_admin_or_owner());

-- product_stock carries cost figures — staff-and-up only. product_stock_status is the
-- public-safe badge-only projection.
grant select on product_stock to authenticated;
grant select on product_stock_status to anon, authenticated;

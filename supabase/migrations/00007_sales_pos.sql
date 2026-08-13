create table sales (
  id uuid primary key default gen_random_uuid(),
  sale_number text not null unique default next_reference('sale', 'S', to_char(ph_today(), 'YYYYMMDD')),
  customer_id uuid references customers (id),
  sale_date timestamptz not null default now(),
  pricing_tier pricing_tier not null default 'retail',
  subtotal bigint not null,
  discount_amount bigint not null default 0,
  discount_reason text,
  tax_amount bigint not null default 0,
  total bigint not null,
  -- Snapshot of cost at sale time — never recomputed from current product cost, so editing
  -- a product's price/cost later cannot change a past sale's recorded margin (§5.4 note).
  cogs_total bigint not null default 0,
  gross_profit bigint generated always as (total - tax_amount - cogs_total) stored,
  payment_method payment_method not null,
  payment_reference text,
  amount_paid bigint not null default 0,
  balance_due bigint generated always as (total - amount_paid) stored,
  payment_status payment_status not null default 'unpaid',
  booking_id uuid references bookings (id),
  sold_by uuid references auth.users (id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_discount_amount_nonnegative check (discount_amount >= 0),
  constraint sales_tax_amount_nonnegative check (tax_amount >= 0),
  constraint sales_amount_paid_nonnegative check (amount_paid >= 0)
);

alter table bookings add constraint bookings_sale_id_fkey foreign key (sale_id) references sales (id);

create index sales_customer_id_idx on sales (customer_id);
create index sales_sale_date_idx on sales (sale_date);
create index sales_booking_id_idx on sales (booking_id);

create trigger set_updated_at before update on sales
  for each row execute function set_updated_at();

create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales (id) on delete cascade,
  item_type sale_item_type not null,
  product_id uuid references products (id),
  service_id uuid references services (id),
  -- description/unit_price/unit_cost are snapshots taken at sale time — see sales.cogs_total note.
  description text not null,
  quantity int not null,
  unit_price bigint not null,
  unit_cost bigint not null default 0,
  line_discount bigint not null default 0,
  line_total bigint not null,
  warranty_expires_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sale_items_quantity_positive check (quantity > 0),
  constraint sale_items_unit_price_nonnegative check (unit_price >= 0),
  constraint sale_items_unit_cost_nonnegative check (unit_cost >= 0),
  constraint sale_items_line_discount_nonnegative check (line_discount >= 0)
);

create index sale_items_sale_id_idx on sale_items (sale_id);
create index sale_items_product_id_idx on sale_items (product_id);

create trigger set_updated_at before update on sale_items
  for each row execute function set_updated_at();

create table payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales (id) on delete cascade,
  amount bigint not null,
  method payment_method not null,
  reference text,
  paid_at timestamptz not null default now(),
  received_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_amount_positive check (amount > 0)
);

create index payments_sale_id_idx on payments (sale_id);

create trigger set_updated_at before update on payments
  for each row execute function set_updated_at();

-- RLS. Any active staff role runs POS day-to-day, so sales/sale_items/payments are
-- staff-writable. cogs_total/gross_profit/unit_cost are cost data ("no margins" for plain
-- staff per §9) — as with inventory (§00005), hiding those specific columns from `staff`
-- while keeping the row visible is enforced in the admin UI/query layer in later phases,
-- not by RLS. Wholesale-tier sales additionally require admin+ at the application layer
-- (§9.4: "wholesale requires admin+") since that's a business-logic check, not row access.
alter table sales enable row level security;
create policy "staff manage sales" on sales
  for all to authenticated using (is_staff()) with check (is_staff());

alter table sale_items enable row level security;
create policy "staff manage sale_items" on sale_items
  for all to authenticated using (is_staff()) with check (is_staff());

alter table payments enable row level security;
create policy "staff manage payments" on payments
  for all to authenticated using (is_staff()) with check (is_staff());

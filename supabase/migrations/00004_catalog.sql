create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on categories
  for each row execute function set_updated_at();

create table products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  slug text not null unique,
  category_id uuid references categories (id),
  short_description text,
  description text,
  specs jsonb not null default '{}'::jsonb,
  retail_price bigint not null,
  wholesale_price bigint,
  install_fee bigint not null default 0,
  warranty_months int not null default 6,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  reorder_point int not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_retail_price_nonnegative check (retail_price >= 0),
  constraint products_wholesale_price_nonnegative check (wholesale_price is null or wholesale_price >= 0),
  constraint products_install_fee_nonnegative check (install_fee >= 0)
);

create index products_category_id_idx on products (category_id);

create trigger set_updated_at before update on products
  for each row execute function set_updated_at();

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_images_product_id_idx on product_images (product_id);

create trigger set_updated_at before update on product_images
  for each row execute function set_updated_at();

-- A product with zero fitment rows is treated as universal (no filtering applied).
create table vehicle_fitments (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  make text not null,
  model text not null,
  year_from int,
  year_to int,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vehicle_fitments_product_id_idx on vehicle_fitments (product_id);
create index vehicle_fitments_make_model_idx on vehicle_fitments (make, model);

create trigger set_updated_at before update on vehicle_fitments
  for each row execute function set_updated_at();

create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  base_price bigint not null,
  duration_minutes int not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_base_price_nonnegative check (base_price >= 0)
);

create trigger set_updated_at before update on services
  for each row execute function set_updated_at();

-- RLS. Catalog tables are publicly browsable; only active rows are visible to anon.
-- Staff (any active role) see everything and can write. `products.wholesale_price` is
-- additionally locked out of the anon column grant below — B2B pricing must never appear
-- in a public response even if an RLS policy is ever misconfigured.
alter table categories enable row level security;
create policy "anon reads active categories" on categories
  for select to anon using (is_active = true);
create policy "staff read categories" on categories
  for select to authenticated using (is_staff());
create policy "staff write categories" on categories
  for insert to authenticated with check (is_staff());
create policy "staff update categories" on categories
  for update to authenticated using (is_staff()) with check (is_staff());
create policy "admin+ delete categories" on categories
  for delete to authenticated using (is_admin_or_owner());

alter table products enable row level security;
create policy "anon reads active products" on products
  for select to anon using (is_active = true);
create policy "staff read products" on products
  for select to authenticated using (is_staff());
create policy "staff write products" on products
  for insert to authenticated with check (is_staff());
create policy "staff update products" on products
  for update to authenticated using (is_staff()) with check (is_staff());
create policy "admin+ delete products" on products
  for delete to authenticated using (is_admin_or_owner());

revoke all on products from anon;
grant select (
  id, sku, name, slug, category_id, short_description, description, specs,
  retail_price, install_fee, warranty_months, is_active, is_featured,
  reorder_point, created_at, updated_at
) on products to anon;

alter table product_images enable row level security;
create policy "anon reads product_images" on product_images
  for select to anon using (true);
create policy "staff manage product_images" on product_images
  for all to authenticated using (is_staff()) with check (is_staff());

alter table vehicle_fitments enable row level security;
create policy "anon reads vehicle_fitments" on vehicle_fitments
  for select to anon using (true);
create policy "staff manage vehicle_fitments" on vehicle_fitments
  for all to authenticated using (is_staff()) with check (is_staff());

alter table services enable row level security;
create policy "anon reads active services" on services
  for select to anon using (is_active = true);
create policy "staff read services" on services
  for select to authenticated using (is_staff());
create policy "staff manage services" on services
  for insert to authenticated with check (is_staff());
create policy "staff update services" on services
  for update to authenticated using (is_staff()) with check (is_staff());
create policy "admin+ delete services" on services
  for delete to authenticated using (is_admin_or_owner());

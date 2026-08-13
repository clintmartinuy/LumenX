create table customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  customer_type customer_type not null default 'b2c',
  business_name text,
  address text,
  facebook_psid text unique,
  notes text,
  first_contact_source contact_source not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_phone_idx on customers (phone);
create index customers_facebook_psid_idx on customers (facebook_psid);

create trigger set_updated_at before update on customers
  for each row execute function set_updated_at();

create table customer_vehicles (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete cascade,
  make text not null,
  model text not null,
  year int,
  plate_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customer_vehicles_customer_id_idx on customer_vehicles (customer_id);

create trigger set_updated_at before update on customer_vehicles
  for each row execute function set_updated_at();

create table inquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default next_reference('inq', 'INQ', to_char(ph_today(), 'YYYYMMDD')),
  customer_id uuid references customers (id),
  source inquiry_source not null,
  channel_thread_id text,
  subject text,
  message text not null,
  intent text,
  status inquiry_status not null default 'new',
  assigned_to uuid references auth.users (id),
  product_interest uuid[],
  first_response_at timestamptz,
  closed_at timestamptz,
  -- bot_paused_until: set for 24h after a staff reply, per §8.3 escalation guardrails.
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index inquiries_customer_id_idx on inquiries (customer_id);
create index inquiries_status_idx on inquiries (status);
create index inquiries_channel_thread_id_idx on inquiries (channel_thread_id);

create trigger set_updated_at before update on inquiries
  for each row execute function set_updated_at();

create table inquiry_messages (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references inquiries (id) on delete cascade,
  direction message_direction not null,
  sender_type message_sender_type not null,
  body text not null,
  sent_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index inquiry_messages_inquiry_id_idx on inquiry_messages (inquiry_id, sent_at);

create trigger set_updated_at before update on inquiry_messages
  for each row execute function set_updated_at();

create table booking_slots (
  id uuid primary key default gen_random_uuid(),
  day_of_week int not null,
  start_time time not null,
  end_time time not null,
  max_concurrent int not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_slots_day_of_week_range check (day_of_week between 0 and 6),
  constraint booking_slots_time_order check (end_time > start_time),
  constraint booking_slots_max_concurrent_positive check (max_concurrent > 0)
);

create trigger set_updated_at before update on booking_slots
  for each row execute function set_updated_at();

create table blackout_dates (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on blackout_dates
  for each row execute function set_updated_at();

create table bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default next_reference('bk', 'BK', to_char(ph_today(), 'YYYYMMDD')),
  customer_id uuid not null references customers (id),
  vehicle_id uuid references customer_vehicles (id),
  scheduled_at timestamptz not null,
  duration_minutes int not null,
  status booking_status not null default 'pending',
  service_ids uuid[] not null default '{}',
  product_ids uuid[] not null default '{}',
  customer_supplied_parts boolean not null default false,
  estimated_total bigint not null default 0,
  notes text,
  source booking_source not null,
  inquiry_id uuid references inquiries (id),
  sale_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_duration_positive check (duration_minutes > 0),
  constraint bookings_estimated_total_nonnegative check (estimated_total >= 0)
);

create index bookings_customer_id_idx on bookings (customer_id);
create index bookings_scheduled_at_idx on bookings (scheduled_at);
create index bookings_status_idx on bookings (status);

create trigger set_updated_at before update on bookings
  for each row execute function set_updated_at();

-- RLS. Customers, vehicles, inquiries, and bookings are all staff-operational data — no
-- financial figures live here, so any active staff role gets full access. Public booking
-- lookup (/book/[ref]) and the booking wizard are served through Server Actions using the
-- service-role client, not direct anon table access, because both require cross-customer
-- lookups (reference + phone match) that RLS can't express safely for an anonymous role.
alter table customers enable row level security;
create policy "staff manage customers" on customers
  for all to authenticated using (is_staff()) with check (is_staff());

alter table customer_vehicles enable row level security;
create policy "staff manage customer_vehicles" on customer_vehicles
  for all to authenticated using (is_staff()) with check (is_staff());

alter table inquiries enable row level security;
create policy "staff manage inquiries" on inquiries
  for all to authenticated using (is_staff()) with check (is_staff());

alter table inquiry_messages enable row level security;
create policy "staff manage inquiry_messages" on inquiry_messages
  for all to authenticated using (is_staff()) with check (is_staff());

alter table booking_slots enable row level security;
create policy "anon reads active booking_slots" on booking_slots
  for select to anon using (is_active = true);
create policy "staff manage booking_slots" on booking_slots
  for all to authenticated using (is_staff()) with check (is_staff());

alter table blackout_dates enable row level security;
create policy "anon reads blackout_dates" on blackout_dates
  for select to anon using (true);
create policy "staff manage blackout_dates" on blackout_dates
  for all to authenticated using (is_staff()) with check (is_staff());

alter table bookings enable row level security;
create policy "staff manage bookings" on bookings
  for all to authenticated using (is_staff()) with check (is_staff());

-- Demo data for local development and stakeholder review. Not meant for production.
-- Explicit UUIDs are used for rows that other seed rows reference by id, so the whole
-- file stays readable without a round-trip through generated ids. Reference numbers
-- (po_number, sale_number, inquiries.reference, bookings.reference) are left to their
-- column defaults so this also exercises next_reference() for real.

update settings set
  phone = '+63 917 000 1234',
  email = 'hello@lumenxph.com',
  address = '123 EDSA, Quezon City, Metro Manila',
  business_hours = '{"mon":"9:00-18:00","tue":"9:00-18:00","wed":"9:00-18:00","thu":"9:00-18:00","fri":"9:00-18:00","sat":"9:00-15:00","sun":"closed"}'::jsonb,
  tax_rate = 0;

-- ============================================================================
-- Categories
-- ============================================================================
insert into categories (id, name, slug, description, sort_order) values
('00000000-0000-0000-0000-000000000001', 'Projector Fog Lights', 'projector-fog-lights', 'Bi-LED and mono projector fog light kits for cars and motorcycles.', 1),
('00000000-0000-0000-0000-000000000002', 'Headlight Retrofits', 'headlight-retrofits', 'Bi-LED projector retrofit kits and housings for OEM headlights.', 2),
('00000000-0000-0000-0000-000000000003', 'Light Bars', 'light-bars', 'Curved and straight LED light bars and driving light pods.', 3),
('00000000-0000-0000-0000-000000000004', 'Wiring & Accessories', 'wiring-accessories', 'Relay harnesses, switches, CANbus decoders, and connectors.', 4);

-- ============================================================================
-- Products (20)
-- ============================================================================
insert into products (id, sku, name, slug, category_id, short_description, description, specs, retail_price, wholesale_price, install_fee, warranty_months, reorder_point, is_featured) values
('00000000-0000-0000-0000-000000001001', 'LX-PF-3IN-BI', '3-Inch Bi-LED Projector Fog Light Kit', '3-inch-bi-led-projector-fog-light-kit', '00000000-0000-0000-0000-000000000001', 'High-output bi-LED projector fog kit with crisp cutoff.', 'A 3-inch bi-LED projector fog light kit built for high-beam performance without blinding oncoming traffic. Plug-and-play harness included.', '{"wattage":"55W","lumens":"6000lm","color_temp":"6000K","lens_size":"3 inch","beam_type":"Bi-LED projector","voltage":"9-32V DC","ip_rating":"IP68","housing":"Die-cast aluminum","lifespan_hours":30000}', 450000, 360000, 80000, 12, 4, true),
('00000000-0000-0000-0000-000000001002', 'LX-PF-25-MONO', '2.5-Inch Mono LED Projector Fog Kit', '2-5-inch-mono-led-projector-fog-kit', '00000000-0000-0000-0000-000000000001', 'Compact mono-LED projector fog kit, budget-friendly.', 'A compact 2.5-inch mono LED projector fog light kit, ideal for owners upgrading from halogen without the bi-LED price tag.', '{"wattage":"35W","lumens":"4000lm","color_temp":"5000K","lens_size":"2.5 inch","beam_type":"Mono LED projector","voltage":"9-32V DC","ip_rating":"IP67"}', 280000, 220000, 70000, 12, 5, false),
('00000000-0000-0000-0000-000000001003', 'LX-PF-3IN-YEL', '3-Inch Bi-LED Projector Fog (Dual Color)', '3-inch-bi-led-projector-fog-dual-color', '00000000-0000-0000-0000-000000000001', 'Switchable white/yellow beam for rain and fog conditions.', 'Switch between 6000K white and 3000K yellow beams depending on weather — yellow cuts through fog and rain better than white.', '{"wattage":"55W","lumens":"5500lm","color_temp":"3000K/6000K","lens_size":"3 inch","beam_type":"Bi-LED projector","ip_rating":"IP68"}', 520000, 410000, 80000, 12, 3, false),
('00000000-0000-0000-0000-000000001004', 'LX-PF-MINI-2IN', '2-Inch Mini Projector Fog Light', '2-inch-mini-projector-fog-light', '00000000-0000-0000-0000-000000000001', 'Small-housing fog light for tight bumper cutouts.', 'Designed for vehicles with small factory fog light cutouts — full projector optics in a 2-inch housing.', '{"wattage":"25W","lumens":"3000lm","color_temp":"6000K","lens_size":"2 inch","ip_rating":"IP66"}', 220000, 170000, 60000, 6, 6, false),
('00000000-0000-0000-0000-000000001005', 'LX-PF-LASER-3IN', '3-Inch Laser Projector Fog Light', '3-inch-laser-projector-fog-light', '00000000-0000-0000-0000-000000000001', 'Laser-hybrid projector fog light, our brightest fog kit.', 'Laser-hybrid diodes push this 3-inch projector past standard bi-LED output for the brightest fog light kit in the lineup.', '{"wattage":"60W","lumens":"7200lm","color_temp":"6000K","lens_size":"3 inch","beam_type":"Laser projector","ip_rating":"IP68","lifespan_hours":40000}', 680000, 540000, 90000, 12, 3, true),
('00000000-0000-0000-0000-000000001006', 'LX-HR-BI-H4', 'Bi-LED Headlight Retrofit Kit H4', 'bi-led-headlight-retrofit-kit-h4', '00000000-0000-0000-0000-000000000002', 'Full bi-LED retrofit for H4 headlight housings.', 'A complete bi-LED projector retrofit for H4-based headlight housings — proper high/low beam cutoff, no more washed-out halogen.', '{"wattage":"40W","lumens":"8000lm","color_temp":"6000K","beam_type":"Bi-LED projector","voltage":"9-32V DC","ip_rating":"IP67","lifespan_hours":30000}', 750000, 600000, 150000, 12, 3, true),
('00000000-0000-0000-0000-000000001007', 'LX-HR-BI-H7', 'Bi-LED Headlight Retrofit Kit H7', 'bi-led-headlight-retrofit-kit-h7', '00000000-0000-0000-0000-000000000002', 'Full bi-LED retrofit for H7 headlight housings.', 'A complete bi-LED projector retrofit for H7-based headlight housings — proper high/low beam cutoff, no more washed-out halogen.', '{"wattage":"40W","lumens":"8000lm","color_temp":"6000K","beam_type":"Bi-LED projector","voltage":"9-32V DC","ip_rating":"IP67","lifespan_hours":30000}', 750000, 600000, 150000, 12, 3, false),
('00000000-0000-0000-0000-000000001008', 'LX-HR-LENS-3IN', '3-Inch Projector Lens Retrofit Housing', '3-inch-projector-lens-retrofit-housing', '00000000-0000-0000-0000-000000000002', 'Bare projector lens housing for custom retrofit builds.', 'A bare 3-inch projector lens housing for shops building custom retrofits from scratch.', '{"lens_size":"3 inch","housing":"Die-cast aluminum"}', 320000, 250000, 120000, 6, 4, false),
('00000000-0000-0000-0000-000000001009', 'LX-HR-SHROUD', 'Angel Eye Shroud Upgrade Kit', 'angel-eye-shroud-upgrade-kit', '00000000-0000-0000-0000-000000000002', 'Drop-in angel eye shroud upgrade for existing retrofits.', 'A drop-in shroud upgrade that adds an angel-eye halo ring to an existing projector retrofit.', '{}', 240000, 190000, 90000, 6, 5, false),
('00000000-0000-0000-0000-000000001010', 'LX-HR-LASER-5IN', '5-Inch Laser Projector Headlight Module', '5-inch-laser-projector-headlight-module', '00000000-0000-0000-0000-000000000002', 'Our top-tier headlight module — laser-hybrid, 5-inch lens.', 'The flagship headlight module: a 5-inch laser-hybrid projector for owners who want the brightest, cleanest beam pattern available.', '{"wattage":"50W","lumens":"9500lm","color_temp":"6000K","lens_size":"5 inch","beam_type":"Laser projector","ip_rating":"IP68"}', 980000, 780000, 180000, 12, 2, true),
('00000000-0000-0000-0000-000000001011', 'LX-LB-20IN-CURVED', '20-Inch Curved LED Light Bar 200W', '20-inch-curved-led-light-bar-200w', '00000000-0000-0000-0000-000000000003', 'Curved 20-inch light bar for roof or bumper mounting.', 'A curved 20-inch, 200W light bar that follows your vehicle roofline for a cleaner install.', '{"wattage":"200W","lumens":"20000lm","color_temp":"6000K","voltage":"9-32V DC","ip_rating":"IP68","housing":"Die-cast aluminum"}', 560000, 440000, 100000, 12, 3, false),
('00000000-0000-0000-0000-000000001012', 'LX-LB-32IN-STRAIGHT', '32-Inch Straight LED Light Bar 300W', '32-inch-straight-led-light-bar-300w', '00000000-0000-0000-0000-000000000003', 'Straight 32-inch bar for maximum forward throw.', 'A straight 32-inch, 300W light bar built for maximum forward beam throw — popular for pickups and off-road builds.', '{"wattage":"300W","lumens":"30000lm","color_temp":"6000K","ip_rating":"IP68"}', 790000, 630000, 120000, 12, 2, false),
('00000000-0000-0000-0000-000000001013', 'LX-LB-4IN-CUBE', '4-Inch LED Cube Pods (Pair)', '4-inch-led-cube-pods-pair', '00000000-0000-0000-0000-000000000003', 'Compact cube pods, sold in pairs, for bumper or A-pillar mounting.', 'A pair of compact 4-inch cube pods — mount them on the bumper, A-pillar, or roll bar.', '{"wattage":"60W (pair)","lumens":"6000lm","ip_rating":"IP68"}', 180000, 140000, 50000, 6, 8, false),
('00000000-0000-0000-0000-000000001014', 'LX-LB-42IN-CURVED', '42-Inch Curved LED Light Bar 400W', '42-inch-curved-led-light-bar-400w', '00000000-0000-0000-0000-000000000003', 'Our largest light bar — 42 inches, 400W.', 'The largest bar in the lineup: 42 inches of curved, 400W LED output for full-size trucks and off-road rigs.', '{"wattage":"400W","lumens":"40000lm","color_temp":"6000K","ip_rating":"IP68"}', 1050000, 840000, 150000, 12, 2, true),
('00000000-0000-0000-0000-000000001015', 'LX-LB-8IN-POD', '8-Inch LED Driving Light Pods (Pair)', '8-inch-led-driving-light-pods-pair', '00000000-0000-0000-0000-000000000003', 'Round 8-inch driving light pods, sold in pairs.', 'A pair of round 8-inch driving light pods for long-range forward lighting.', '{"wattage":"120W (pair)","lumens":"12000lm","ip_rating":"IP68"}', 340000, 270000, 70000, 12, 4, false),
('00000000-0000-0000-0000-000000001016', 'LX-WR-RELAY-H', 'Relay Harness Kit — Heavy Duty', 'relay-harness-kit-heavy-duty', '00000000-0000-0000-0000-000000000004', 'Heavy-duty relay harness for high-draw light setups.', 'A heavy-duty relay harness rated for high-draw setups like light bars — protects factory wiring and switches.', '{}', 95000, 70000, 40000, 6, 10, false),
('00000000-0000-0000-0000-000000001017', 'LX-WR-SWITCH', 'Illuminated Rocker Switch Kit', 'illuminated-rocker-switch-kit', '00000000-0000-0000-0000-000000000004', 'Backlit rocker switch with wiring pigtail.', 'A backlit rocker switch kit with wiring pigtail — clean way to control auxiliary lighting from the dash.', '{}', 45000, 32000, 20000, 6, 15, false),
('00000000-0000-0000-0000-000000001018', 'LX-WR-CANBUS', 'CANbus Decoder Module (Pair)', 'canbus-decoder-module-pair', '00000000-0000-0000-0000-000000000004', 'Prevents dashboard error codes on CANbus-equipped vehicles.', 'A pair of CANbus decoder modules that prevent "bulb out" dashboard errors on modern CANbus-equipped vehicles.', '{}', 110000, 85000, 30000, 6, 10, false),
('00000000-0000-0000-0000-000000001019', 'LX-WR-CONN-WP', 'Waterproof Connector Set', 'waterproof-connector-set', '00000000-0000-0000-0000-000000000004', 'Sealed connector set for outdoor/underhood wiring runs.', 'A set of sealed, waterproof connectors for underhood or exterior wiring runs.', '{}', 35000, null, 0, 3, 20, false),
('00000000-0000-0000-0000-000000001020', 'LX-WR-FUSE-KIT', 'In-Line Fuse Holder Kit', 'in-line-fuse-holder-kit', '00000000-0000-0000-0000-000000000004', 'In-line fuse holder with spare fuses.', 'An in-line fuse holder kit with a handful of spare fuses — cheap insurance for any accessory circuit.', '{}', 28000, null, 0, 3, 20, false);

insert into product_images (product_id, storage_path, alt_text, sort_order, is_primary)
select id, 'products/' || slug || '/1.jpg', name, 0, true from products;

-- Fitments — only for a subset; products with zero rows are treated as universal.
insert into vehicle_fitments (product_id, make, model, year_from, year_to) values
('00000000-0000-0000-0000-000000001006', 'Toyota', 'Vios', 2019, 2024),
('00000000-0000-0000-0000-000000001006', 'Honda', 'City', 2020, 2024),
('00000000-0000-0000-0000-000000001007', 'Honda', 'Civic', 2016, 2021),
('00000000-0000-0000-0000-000000001007', 'Toyota', 'Innova', 2016, 2023),
('00000000-0000-0000-0000-000000001010', 'Ford', 'Ranger', 2018, 2024),
('00000000-0000-0000-0000-000000001010', 'Toyota', 'Hilux', 2016, 2024),
('00000000-0000-0000-0000-000000001010', 'Isuzu', 'D-Max', 2020, 2024),
('00000000-0000-0000-0000-000000001001', 'Mitsubishi', 'Montero Sport', 2016, 2024),
('00000000-0000-0000-0000-000000001001', 'Toyota', 'Fortuner', 2016, 2024),
('00000000-0000-0000-0000-000000001011', 'Ford', 'Ranger', 2018, 2024),
('00000000-0000-0000-0000-000000001014', 'Toyota', 'Hilux', 2016, 2024),
('00000000-0000-0000-0000-000000001014', 'Isuzu', 'D-Max', 2020, 2024);

-- ============================================================================
-- Services (6, per spec §5.1 exact list)
-- ============================================================================
insert into services (id, name, slug, description, base_price, duration_minutes) values
('00000000-0000-0000-0000-000000002001', 'Projector Fog Light Installation', 'projector-fog-light-installation', 'Installation and wiring for a projector fog light kit.', 80000, 60),
('00000000-0000-0000-0000-000000002002', 'Headlight Retrofit', 'headlight-retrofit', 'Full headlight disassembly, retrofit, resealing, and reinstallation.', 150000, 120),
('00000000-0000-0000-0000-000000002003', 'Light Bar Mounting', 'light-bar-mounting', 'Bracket fabrication and mounting for a roof or bumper light bar.', 100000, 90),
('00000000-0000-0000-0000-000000002004', 'Wiring & Relay Harness', 'wiring-relay-harness', 'Relay harness install for auxiliary lighting circuits.', 50000, 45),
('00000000-0000-0000-0000-000000002005', 'Beam Alignment', 'beam-alignment', 'Beam pattern alignment after a lighting install.', 30000, 30),
('00000000-0000-0000-0000-000000002006', 'Diagnostic Check', 'diagnostic-check', 'Diagnostic check for existing lighting or wiring issues.', 25000, 30);

-- ============================================================================
-- Suppliers (3) and Purchase Orders (2, received)
-- ============================================================================
insert into suppliers (id, name, contact_person, phone, email, address) values
('00000000-0000-0000-0000-000000003001', 'AutoLux Philippines Trading', 'Ramon Dizon', '+63 917 123 4567', 'sales@autoluxph.com', '123 EDSA, Quezon City'),
('00000000-0000-0000-0000-000000003002', 'BrightGear Import Corp', 'Liza Tan', '+63 918 987 6543', 'liza@brightgearimport.com', '45 Osmena Blvd, Cebu City'),
('00000000-0000-0000-0000-000000003003', 'Metro Auto Lighting Supply', 'Mark Villanueva', '+63 920 111 2233', 'mark@metroautolighting.ph', '88 Quezon Ave, Quezon City');

insert into purchase_orders (id, supplier_id, order_date, received_date, status, shipping_cost, other_costs) values
('00000000-0000-0000-0000-000000004001', '00000000-0000-0000-0000-000000003001', ph_today() - 30, ph_today() - 25, 'received', 50000, 0),
('00000000-0000-0000-0000-000000004002', '00000000-0000-0000-0000-000000003002', ph_today() - 45, ph_today() - 40, 'received', 80000, 20000);

insert into purchase_order_items (purchase_order_id, product_id, quantity_ordered, quantity_received, unit_cost) values
('00000000-0000-0000-0000-000000004001', '00000000-0000-0000-0000-000000001001', 10, 10, 300000),
('00000000-0000-0000-0000-000000004001', '00000000-0000-0000-0000-000000001002', 15, 15, 190000),
('00000000-0000-0000-0000-000000004002', '00000000-0000-0000-0000-000000001006', 8, 8, 550000),
('00000000-0000-0000-0000-000000004002', '00000000-0000-0000-0000-000000001011', 10, 10, 400000);

insert into stock_movements (product_id, movement_type, quantity, unit_cost, reference_type, reference_id, notes, created_at)
select poi.product_id, 'purchase_in', poi.quantity_received, poi.unit_cost, 'purchase_order', poi.purchase_order_id, 'Received against ' || po.id::text, po.received_date
from purchase_order_items poi
join purchase_orders po on po.id = poi.purchase_order_id;

-- Opening stock for the other 16 products not covered by the two seed POs, backdated
-- before either PO, at an assumed ~72% cost basis.
insert into stock_movements (product_id, movement_type, quantity, unit_cost, reference_type, notes, created_at)
select id, 'adjustment_in', (8 + (abs(hashtext(sku)) % 20)), round(retail_price * 0.72), 'manual', 'Opening stock load', now() - interval '55 days'
from products
where id not in (select product_id from purchase_order_items);

-- ============================================================================
-- Customers (15) and vehicles
-- ============================================================================
insert into customers (id, full_name, phone, email, customer_type, business_name, first_contact_source, facebook_psid) values
('00000000-0000-0000-0000-000000005001', 'Jayson Reyes', '09171112222', 'jayson.reyes@example.com', 'b2c', null, 'messenger', 'psid_jayson_reyes'),
('00000000-0000-0000-0000-000000005002', 'Maricel Santos', '09181234567', 'maricel.santos@example.com', 'b2c', null, 'website_form', null),
('00000000-0000-0000-0000-000000005003', 'Dan Cruz', '09201234567', null, 'b2c', null, 'website_chat', null),
('00000000-0000-0000-0000-000000005004', 'Rico Bermudez', '09991234567', 'rico@autoshinedetailing.ph', 'b2b', 'AutoShine Detailing Center', 'walk_in', null),
('00000000-0000-0000-0000-000000005005', 'Kevin Tan', '09171239876', null, 'b2c', null, 'referral', null),
('00000000-0000-0000-0000-000000005006', 'Grace Villareal', '09182223344', 'grace.v@example.com', 'b2c', null, 'phone', null),
('00000000-0000-0000-0000-000000005007', 'Ronald Jimenez', '09173334455', 'ronald@rjmotorworks.ph', 'b2b', 'RJ Motorworks', 'messenger', 'psid_rj_motorworks'),
('00000000-0000-0000-0000-000000005008', 'Angelo Bautista', '09194445566', null, 'b2c', null, 'website_form', null),
('00000000-0000-0000-0000-000000005009', 'Precious Dela Cruz', '09175556677', null, 'b2c', null, 'website_chat', null),
('00000000-0000-0000-0000-000000005010', 'Ella Marasigan', '09176667788', 'ella@speedgarage.ph', 'b2b', 'Speed Garage PH', 'walk_in', null),
('00000000-0000-0000-0000-000000005011', 'Noel Ramos', '09177778899', null, 'b2c', null, 'messenger', 'psid_noel_ramos'),
('00000000-0000-0000-0000-000000005012', 'Cherry Mendoza', '09178889900', null, 'b2c', null, 'referral', null),
('00000000-0000-0000-0000-000000005013', 'Bianca Ocampo', '09179990011', 'bianca@torquehub.ph', 'b2b', 'TorqueHub Auto Supply', 'website_form', null),
('00000000-0000-0000-0000-000000005014', 'Paolo Ilagan', '09180001122', null, 'b2c', null, 'phone', null),
('00000000-0000-0000-0000-000000005015', 'Ivy Fernandez', '09181112233', null, 'b2c', null, 'walk_in', null);

insert into customer_vehicles (customer_id, make, model, year) values
('00000000-0000-0000-0000-000000005001', 'Toyota', 'Fortuner', 2021),
('00000000-0000-0000-0000-000000005002', 'Honda', 'City', 2020),
('00000000-0000-0000-0000-000000005003', 'Toyota', 'Vios', 2019),
('00000000-0000-0000-0000-000000005005', 'Ford', 'Ranger', 2022),
('00000000-0000-0000-0000-000000005011', 'Isuzu', 'D-Max', 2021),
('00000000-0000-0000-0000-000000005014', 'Mitsubishi', 'Montero Sport', 2020);

-- ============================================================================
-- Partners (4, summing to 100%) and capital
-- ============================================================================
insert into partners (id, full_name, email, phone, equity_percent, joined_at) values
('00000000-0000-0000-0000-000000006001', 'Ramon Uy', 'ramon@lumenxph.com', '09170000001', 40.00, ph_today() - 400),
('00000000-0000-0000-0000-000000006002', 'Bella Uy', 'bella@lumenxph.com', '09170000002', 30.00, ph_today() - 400),
('00000000-0000-0000-0000-000000006003', 'Carlo Santos', 'carlo@lumenxph.com', '09170000003', 20.00, ph_today() - 400),
('00000000-0000-0000-0000-000000006004', 'Diane Reyes', 'diane@lumenxph.com', '09170000004', 10.00, ph_today() - 350);

insert into capital_contributions (partner_id, amount, contributed_at, method, notes) values
('00000000-0000-0000-0000-000000006001', 20000000, ph_today() - 400, 'bank_transfer', 'Initial capital'),
('00000000-0000-0000-0000-000000006002', 15000000, ph_today() - 400, 'bank_transfer', 'Initial capital'),
('00000000-0000-0000-0000-000000006003', 10000000, ph_today() - 400, 'bank_transfer', 'Initial capital'),
('00000000-0000-0000-0000-000000006004', 5000000, ph_today() - 350, 'gcash', 'Initial capital');

-- ============================================================================
-- Bookings (8, varied states)
-- ============================================================================
insert into bookings (id, customer_id, vehicle_id, scheduled_at, duration_minutes, status, service_ids, product_ids, estimated_total, source, notes) values
('00000000-0000-0000-0000-000000007001', '00000000-0000-0000-0000-000000005001', (select id from customer_vehicles where customer_id = '00000000-0000-0000-0000-000000005001'), (ph_today() + 3 + time '10:00')::timestamptz, 60, 'pending', array['00000000-0000-0000-0000-000000002001']::uuid[], array['00000000-0000-0000-0000-000000001001']::uuid[], 530000, 'website', null),
('00000000-0000-0000-0000-000000007002', '00000000-0000-0000-0000-000000005002', (select id from customer_vehicles where customer_id = '00000000-0000-0000-0000-000000005002'), (ph_today() + 5 + time '13:00')::timestamptz, 120, 'confirmed', array['00000000-0000-0000-0000-000000002002']::uuid[], array['00000000-0000-0000-0000-000000001007']::uuid[], 900000, 'messenger', 'Customer asked about Honda City fitment beforehand'),
('00000000-0000-0000-0000-000000007003', '00000000-0000-0000-0000-000000005005', (select id from customer_vehicles where customer_id = '00000000-0000-0000-0000-000000005005'), now(), 90, 'in_progress', array['00000000-0000-0000-0000-000000002003']::uuid[], array['00000000-0000-0000-0000-000000001011']::uuid[], 660000, 'admin', null),
('00000000-0000-0000-0000-000000007004', '00000000-0000-0000-0000-000000005006', null, now() - interval '4 days', 60, 'completed', array['00000000-0000-0000-0000-000000002001']::uuid[], array['00000000-0000-0000-0000-000000001002']::uuid[], 350000, 'website', null),
('00000000-0000-0000-0000-000000007005', '00000000-0000-0000-0000-000000005008', null, now() - interval '10 days', 30, 'completed', array['00000000-0000-0000-0000-000000002005']::uuid[], '{}'::uuid[], 30000, 'admin', null),
('00000000-0000-0000-0000-000000007006', '00000000-0000-0000-0000-000000005009', null, now() - interval '7 days', 45, 'cancelled', array['00000000-0000-0000-0000-000000002004']::uuid[], '{}'::uuid[], 50000, 'website', 'Customer rescheduled elsewhere'),
('00000000-0000-0000-0000-000000007007', '00000000-0000-0000-0000-000000005012', null, now() - interval '2 days', 30, 'no_show', array['00000000-0000-0000-0000-000000002006']::uuid[], '{}'::uuid[], 25000, 'messenger', null),
('00000000-0000-0000-0000-000000007008', '00000000-0000-0000-0000-000000005014', (select id from customer_vehicles where customer_id = '00000000-0000-0000-0000-000000005014'), (ph_today() + 1 + time '09:00')::timestamptz, 60, 'pending', array['00000000-0000-0000-0000-000000002001']::uuid[], array['00000000-0000-0000-0000-000000001005']::uuid[], 770000, 'website', null);

-- ============================================================================
-- Inquiries (12) with transcripts
-- ============================================================================
insert into inquiries (id, customer_id, source, channel_thread_id, message, intent, status, first_response_at, closed_at) values
('00000000-0000-0000-0000-000000008001', '00000000-0000-0000-0000-000000005001', 'messenger', 'psid_jayson_reyes', 'magkano po yung 3 inch bi-led fog?', 'product_price', 'auto_answered', now() - interval '6 days' + interval '2 minutes', null),
('00000000-0000-0000-0000-000000008002', '00000000-0000-0000-0000-000000005002', 'website_form', null, 'Hi, do you install headlight retrofit for Honda City 2019?', 'fitment', 'needs_human', now() - interval '5 days' + interval '1 minute', null),
('00000000-0000-0000-0000-000000008003', '00000000-0000-0000-0000-000000005004', 'walk_in', null, 'Gusto namin mag-inquire about wholesale pricing for light bars.', 'wholesale', 'in_progress', now() - interval '3 days', null),
('00000000-0000-0000-0000-000000008004', null, 'website_chat', 'session_9f3ac1', 'hello po', null, 'new', null, null),
('00000000-0000-0000-0000-000000008005', '00000000-0000-0000-0000-000000005005', 'messenger', null, 'meron pa ba stock ng 20 inch light bar?', 'stock_check', 'auto_answered', now() - interval '9 days' + interval '3 minutes', null),
('00000000-0000-0000-0000-000000008006', '00000000-0000-0000-0000-000000005007', 'messenger', 'psid_rj_motorworks', 'pwede po ba kami mag-bulk order ng relay harness, mga 50 pcs?', 'wholesale', 'converted', now() - interval '20 days', now() - interval '18 days'),
('00000000-0000-0000-0000-000000008007', '00000000-0000-0000-0000-000000005008', 'website_form', null, 'Where is your shop located?', 'location', 'quoted', now() - interval '12 days' + interval '4 minutes', null),
('00000000-0000-0000-0000-000000008008', '00000000-0000-0000-0000-000000005009', 'website_chat', 'session_2ab8e4', 'what time are you open on Sundays?', 'hours', 'auto_answered', now() - interval '2 days' + interval '1 minute', null),
('00000000-0000-0000-0000-000000008009', '00000000-0000-0000-0000-000000005011', 'messenger', 'psid_noel_ramos', 'warranty po ba nitong 5 inch laser headlight module?', 'warranty', 'auto_answered', now() - interval '1 days' + interval '2 minutes', null),
('00000000-0000-0000-0000-000000008010', '00000000-0000-0000-0000-000000005014', 'phone', null, 'Called to ask about GCash payment for booking.', 'payment', 'closed', now() - interval '15 days', now() - interval '15 days'),
('00000000-0000-0000-0000-000000008011', '00000000-0000-0000-0000-000000005015', 'website_form', null, 'asdkjaslkdj buy cheap followers now www.spam-link.example', null, 'spam', null, now() - interval '30 days'),
('00000000-0000-0000-0000-000000008012', '00000000-0000-0000-0000-000000005003', 'website_chat', 'session_77cd10', 'gusto ko sana mag-book pero di ko alam anong service kailangan ko, pwede ba kausapin yung tao?', 'human', 'needs_human', null, null);

insert into inquiry_messages (inquiry_id, direction, sender_type, body, sent_at) values
('00000000-0000-0000-0000-000000008001', 'inbound', 'customer', 'magkano po yung 3 inch bi-led fog?', now() - interval '6 days'),
('00000000-0000-0000-0000-000000008001', 'outbound', 'bot', '3-Inch Bi-LED Projector Fog Light Kit: PHP 4,500.00 (In Stock). See full details: /products/3-inch-bi-led-projector-fog-light-kit. A team member will follow up shortly if you need more help.', now() - interval '6 days' + interval '2 minutes'),

('00000000-0000-0000-0000-000000008002', 'inbound', 'customer', 'Hi, do you install headlight retrofit for Honda City 2019?', now() - interval '5 days'),
('00000000-0000-0000-0000-000000008002', 'outbound', 'bot', 'Let us confirm the exact fitment for your vehicle — please share your car''s make, model, and year and a team member will follow up. A team member will follow up shortly if you need more help.', now() - interval '5 days' + interval '1 minute'),

('00000000-0000-0000-0000-000000008003', 'inbound', 'customer', 'Gusto namin mag-inquire about wholesale pricing for light bars.', now() - interval '3 days'),
('00000000-0000-0000-0000-000000008003', 'outbound', 'staff', 'Hi Rico! Sent you our wholesale price list for the light bar lineup via email — let us know the quantities you need and we''ll work out a quote.', now() - interval '3 days' + interval '25 minutes'),

('00000000-0000-0000-0000-000000008004', 'inbound', 'customer', 'hello po', now()),

('00000000-0000-0000-0000-000000008005', 'inbound', 'customer', 'meron pa ba stock ng 20 inch light bar?', now() - interval '9 days'),
('00000000-0000-0000-0000-000000008005', 'outbound', 'bot', '20-Inch Curved LED Light Bar 200W is currently In Stock. Check the latest here: /products/20-inch-curved-led-light-bar-200w. A team member will follow up shortly if you need more help.', now() - interval '9 days' + interval '3 minutes'),

('00000000-0000-0000-0000-000000008006', 'inbound', 'customer', 'pwede po ba kami mag-bulk order ng relay harness, mga 50 pcs?', now() - interval '21 days'),
('00000000-0000-0000-0000-000000008006', 'outbound', 'staff', 'Yes RJ, we can do 50 units of the heavy-duty relay harness at wholesale. I''ll send an invoice for pickup this week.', now() - interval '20 days'),
('00000000-0000-0000-0000-000000008006', 'inbound', 'customer', 'Sige salamat, babayaran namin sa pickup.', now() - interval '19 days'),

('00000000-0000-0000-0000-000000008007', 'inbound', 'customer', 'Where is your shop located?', now() - interval '12 days'),
('00000000-0000-0000-0000-000000008007', 'outbound', 'bot', 'We''re located at 123 EDSA, Quezon City, Metro Manila. Hours: Mon-Fri 9:00-18:00, Sat 9:00-15:00, Sun closed. A team member will follow up shortly if you need more help.', now() - interval '12 days' + interval '4 minutes'),
('00000000-0000-0000-0000-000000008007', 'outbound', 'staff', 'Also following up on your earlier question — a headlight retrofit for your vehicle would run about PHP 9,000 installed. Let me know if you''d like to book.', now() - interval '11 days'),

('00000000-0000-0000-0000-000000008008', 'inbound', 'customer', 'what time are you open on Sundays?', now() - interval '2 days'),
('00000000-0000-0000-0000-000000008008', 'outbound', 'bot', 'Our hours: Mon-Fri 9:00-18:00, Sat 9:00-15:00, Sun closed. A team member will follow up shortly if you need more help.', now() - interval '2 days' + interval '1 minute'),

('00000000-0000-0000-0000-000000008009', 'inbound', 'customer', 'warranty po ba nitong 5 inch laser headlight module?', now() - interval '1 days'),
('00000000-0000-0000-0000-000000008009', 'outbound', 'bot', 'All our products come with a warranty (6-12 months depending on the item). If something''s wrong, message us with your receipt/sale number and we''ll sort it out. A team member will follow up shortly if you need more help.', now() - interval '1 days' + interval '2 minutes'),

('00000000-0000-0000-0000-000000008010', 'inbound', 'customer', 'Called to ask about GCash payment for booking.', now() - interval '15 days'),
('00000000-0000-0000-0000-000000008010', 'outbound', 'staff', 'Confirmed by phone — GCash accepted on-site at time of installation.', now() - interval '15 days' + interval '5 minutes'),

('00000000-0000-0000-0000-000000008011', 'inbound', 'customer', 'asdkjaslkdj buy cheap followers now www.spam-link.example', now() - interval '30 days'),

('00000000-0000-0000-0000-000000008012', 'inbound', 'customer', 'gusto ko sana mag-book pero di ko alam anong service kailangan ko, pwede ba kausapin yung tao?', now() - interval '20 minutes'),
('00000000-0000-0000-0000-000000008012', 'outbound', 'bot', 'Sure, connecting you to a team member now.', now() - interval '19 minutes');

-- ============================================================================
-- Auto-reply intents (13, per spec §8.2)
-- ============================================================================
insert into autoreply_intents (key, name, keywords, patterns, response_template, requires_human, priority) values
('greeting', 'Greeting', array['hi','hello','hey','good morning','good afternoon','magandang umaga','magandang hapon','kumusta'], '{}', 'Hi! Welcome to {{business_name}}. We sell and install high-wattage automotive lighting — projector fog lights, headlight retrofits, and light bars. How can we help you today?', false, 5),
('price_general', 'General price inquiry', array['how much','price list','magkano','presyo'], '{}', 'Prices vary by product — fog light kits start around PHP 2,200 and headlight retrofits start around PHP 3,200. Full catalog and pricing: {{product_url}}', false, 5),
('product_price', 'Specific product price', '{}', array['LX-[A-Z0-9-]+'], '{{product_name}}: {{product_price}} ({{stock_status}}). See full details: {{product_url}}', false, 8),
('stock_check', 'Stock availability', array['available ba','in stock','meron pa','meron'], '{}', '{{product_name}} is currently {{stock_status}}. Check the latest here: {{product_url}}', false, 6),
('installation', 'Installation / labor', array['do you install','pakabit','labor fee','installation','magkabit'], '{}', 'Yes, we install everything we sell. Installation fees start at PHP 250 for a diagnostic check up to PHP 1,500 for a full headlight retrofit. Book a slot here: {{booking_url}}', false, 5),
('booking', 'Booking / scheduling', array['schedule','appointment','book','kailan pwede'], '{}', 'You can book an installation slot here: {{booking_url}}. Next available slots: {{next_slots}}', false, 5),
('location', 'Shop location', array['where','saan kayo','address','location'], '{}', 'We''re located at {{address}}. Hours: {{hours}}', false, 5),
('hours', 'Business hours', array['open','anong oras','hours','oras'], '{}', 'Our hours: {{hours}}', false, 5),
('warranty', 'Warranty terms', array['warranty','garantiya','sira'], '{}', 'All our products come with a warranty (6-12 months depending on the item). If something''s wrong, message us with your receipt/sale number and we''ll sort it out.', false, 5),
('fitment', 'Vehicle fitment check', array['will it fit','kasya ba','compatible','fitment'], '{}', 'Let us confirm the exact fitment for your vehicle — please share your car''s make, model, and year and a team member will follow up.', true, 7),
('wholesale', 'Wholesale / dealer inquiry', array['dealer','reseller','b2b','bulk','wholesale'], '{}', 'We''d love to work with you! Please share your business name and what you''re looking to order, and a team member will send you our wholesale price list.', true, 7),
('payment', 'Payment methods', array['payment','gcash','installment','bayad'], '{}', 'We accept cash and GCash, payable on-site. We don''t process online payments yet.', false, 5),
('human', 'Talk to a human', array['talk to person','agent','staff','human','talk to a human'], '{}', 'Sure, connecting you to a team member now.', true, 10);

-- ============================================================================
-- Operating expenses, spread across the last 60 days
-- ============================================================================
insert into expenses (expense_date, category, description, amount, paid_by_partner_id) values
(ph_today() - 58, 'rent', 'Shop rent — month 1', 3500000, null),
(ph_today() - 55, 'utilities', 'Electricity and water', 450000, null),
(ph_today() - 50, 'salary', 'Technician wages (biweekly)', 2800000, null),
(ph_today() - 45, 'marketing', 'Facebook ads boost', 300000, '00000000-0000-0000-0000-000000006001'),
(ph_today() - 40, 'tools', 'Crimping tool set', 250000, null),
(ph_today() - 35, 'transport', 'Parts pickup — Cebu supplier run', 180000, null),
(ph_today() - 28, 'salary', 'Technician wages (biweekly)', 2800000, null),
(ph_today() - 20, 'utilities', 'Electricity and water', 480000, null),
(ph_today() - 14, 'salary', 'Technician wages (biweekly)', 2800000, null),
(ph_today() - 10, 'fees', 'Bank transfer fees', 50000, null),
(ph_today() - 5, 'rent', 'Shop rent — month 2', 3500000, null),
(ph_today() - 2, 'other', 'Shop supplies', 120000, null);

-- ============================================================================
-- Sales (25) across the last 60 days, generated so every product/customer mix
-- stays referentially valid and stock never goes negative.
-- ============================================================================
do $$
declare
  v_customer_ids uuid[];
  v_product_ids uuid[];
  v_service_ids uuid[];
  v_methods payment_method[] := array['cash','gcash','bank_transfer','maya']::payment_method[];
  v_sale_id uuid;
  v_customer_id uuid;
  v_customer_type customer_type;
  v_tier pricing_tier;
  v_sale_date timestamptz;
  v_payment_method payment_method;
  v_num_items int;
  v_subtotal bigint;
  v_cogs bigint;
  v_discount bigint;
  v_total bigint;
  v_amount_paid bigint;
  v_pay_status payment_status;
  i int;
  j int;
  v_product_id uuid;
  v_product_name text;
  v_retail_price bigint;
  v_wholesale_price bigint;
  v_warranty_months int;
  v_unit_price bigint;
  v_unit_cost bigint;
  v_qty int;
  v_line_total bigint;
  v_service_id uuid;
  v_service_name text;
  v_service_price bigint;
begin
  select array_agg(id) into v_customer_ids from customers;
  select array_agg(id) into v_product_ids from products;
  select array_agg(id) into v_service_ids from services;

  for i in 1..25 loop
    v_customer_id := v_customer_ids[1 + (i % array_length(v_customer_ids, 1))];
    select customer_type into v_customer_type from customers where id = v_customer_id;
    v_tier := case when v_customer_type = 'b2b' then 'wholesale' else 'retail' end;

    v_sale_date := now() - (((60 - (i * 2)))::text || ' days')::interval;
    v_payment_method := v_methods[1 + (i % array_length(v_methods, 1))];
    v_num_items := 1 + (i % 3);
    v_subtotal := 0;
    v_cogs := 0;
    v_sale_id := gen_random_uuid();

    -- Placeholder row; totals are filled in after line items are known below.
    insert into sales (id, customer_id, sale_date, pricing_tier, subtotal, total, cogs_total, payment_method, amount_paid, payment_status, sold_by)
    values (v_sale_id, v_customer_id, v_sale_date, v_tier, 0, 0, 0, v_payment_method, 0, 'unpaid', null);

    for j in 1..v_num_items loop
      v_product_id := v_product_ids[1 + ((i + j) % array_length(v_product_ids, 1))];
      select name, retail_price, wholesale_price, warranty_months
        into v_product_name, v_retail_price, v_wholesale_price, v_warranty_months
        from products where id = v_product_id;

      v_unit_price := case when v_tier = 'wholesale' and v_wholesale_price is not null then v_wholesale_price else v_retail_price end;
      v_unit_cost := round(v_retail_price * 0.72);
      v_qty := 1 + ((i + j) % 2);
      v_line_total := v_qty * v_unit_price;
      v_subtotal := v_subtotal + v_line_total;
      v_cogs := v_cogs + (v_qty * v_unit_cost);

      insert into sale_items (sale_id, item_type, product_id, description, quantity, unit_price, unit_cost, line_total, warranty_expires_at)
      values (v_sale_id, 'product', v_product_id, v_product_name, v_qty, v_unit_price, v_unit_cost, v_line_total, (v_sale_date::date + ((v_warranty_months)::text || ' months')::interval)::date);

      insert into stock_movements (product_id, movement_type, quantity, unit_cost, reference_type, reference_id, created_at)
      values (v_product_id, 'sale_out', v_qty, v_unit_cost, 'sale', v_sale_id, v_sale_date);
    end loop;

    -- Attach an installation service line to roughly a third of sales, for labor revenue.
    if i % 3 = 0 then
      v_service_id := v_service_ids[1 + (i % array_length(v_service_ids, 1))];
      select name, base_price into v_service_name, v_service_price from services where id = v_service_id;
      v_line_total := v_service_price;
      v_subtotal := v_subtotal + v_line_total;

      insert into sale_items (sale_id, item_type, service_id, description, quantity, unit_price, unit_cost, line_total)
      values (v_sale_id, 'service', v_service_id, v_service_name, 1, v_service_price, 0, v_line_total);
    end if;

    v_discount := case when i % 5 = 0 then round(v_subtotal * 0.05) else 0 end;
    v_total := v_subtotal - v_discount;
    v_amount_paid := case when i % 7 = 0 then round(v_total * 0.5) else v_total end;
    v_pay_status := case when v_amount_paid >= v_total then 'paid' when v_amount_paid > 0 then 'partial' else 'unpaid' end;

    update sales set
      subtotal = v_subtotal,
      discount_amount = v_discount,
      discount_reason = case when v_discount > 0 then 'Loyal customer discount' else null end,
      total = v_total,
      cogs_total = v_cogs,
      amount_paid = v_amount_paid,
      payment_status = v_pay_status
    where id = v_sale_id;

    insert into payments (sale_id, amount, method, paid_at)
    values (v_sale_id, v_amount_paid, v_payment_method, v_sale_date);
  end loop;
end $$;

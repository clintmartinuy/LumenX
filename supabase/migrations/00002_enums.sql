create type staff_role as enum ('owner', 'admin', 'staff', 'viewer');

create type customer_type as enum ('b2c', 'b2b');
create type contact_source as enum ('messenger', 'website_form', 'website_chat', 'walk_in', 'referral', 'phone');

create type po_status as enum ('draft', 'ordered', 'partial', 'received', 'cancelled');
create type stock_movement_type as enum (
  'purchase_in', 'sale_out', 'return_in', 'damage_out', 'adjustment_in', 'adjustment_out', 'demo_out'
);
create type stock_reference_type as enum ('purchase_order', 'sale', 'manual');
create type expense_category as enum ('rent', 'utilities', 'salary', 'marketing', 'tools', 'transport', 'fees', 'other');

create type inquiry_source as enum ('messenger', 'website_form', 'website_chat', 'phone', 'walk_in');
create type inquiry_status as enum (
  'new', 'auto_answered', 'needs_human', 'in_progress', 'quoted', 'converted', 'closed', 'spam'
);
create type message_direction as enum ('inbound', 'outbound');
create type message_sender_type as enum ('customer', 'bot', 'staff');

create type booking_status as enum ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
create type booking_source as enum ('website', 'messenger', 'admin');

create type pricing_tier as enum ('retail', 'wholesale');
create type payment_method as enum ('cash', 'gcash', 'bank_transfer', 'maya', 'mixed');
create type payment_status as enum ('unpaid', 'partial', 'paid');
create type sale_item_type as enum ('product', 'service', 'custom');

create type distribution_status as enum ('draft', 'finalized');

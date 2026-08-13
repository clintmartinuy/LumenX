-- Single-transaction sale creation (§9.4, §13 Phase 4: "killing the process mid-transaction
-- leaves no partial data"). A single Postgres function call is inherently atomic — if any
-- step raises, everything in this call rolls back, including the sale header insert.
-- SECURITY INVOKER (the default): runs as the calling staff user, so the normal RLS
-- policies on sales/sale_items/payments/stock_movements are still the real enforcement —
-- this function is the transaction boundary, not a privilege escalation.
create or replace function create_sale(
  p_customer_id uuid,
  p_pricing_tier pricing_tier,
  p_items jsonb, -- [{item_type, product_id?, service_id?, description?, quantity, unit_price, line_discount?}]
  p_discount_amount bigint default 0,
  p_discount_reason text default null,
  p_tax_amount bigint default 0,
  p_payment_method payment_method default 'cash',
  p_payment_reference text default null,
  p_amount_paid bigint default 0,
  p_booking_id uuid default null,
  p_notes text default null,
  p_override_oversell boolean default false,
  p_override_reason text default null
)
returns table (sale_id uuid, sale_number text)
language plpgsql
as $$
declare
  v_sale_id uuid;
  v_sale_number text;
  v_subtotal bigint := 0;
  v_cogs_total bigint := 0;
  v_total bigint;
  v_payment_status payment_status;
  v_item jsonb;
  v_item_type sale_item_type;
  v_product_id uuid;
  v_service_id uuid;
  v_quantity int;
  v_unit_price bigint;
  v_line_discount bigint;
  v_line_total bigint;
  v_unit_cost bigint;
  v_description text;
  v_warranty_months int;
  v_on_hand bigint;
  v_created_by uuid := auth.uid();
begin
  if not is_staff() then
    raise exception 'Only staff can create sales.';
  end if;

  if p_pricing_tier = 'wholesale' and not is_admin_or_owner() then
    raise exception 'Wholesale pricing requires an admin or owner.';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'A sale needs at least one line item.';
  end if;

  v_sale_id := gen_random_uuid();

  -- First pass: validate stock and accumulate subtotal/cogs, without writing anything yet.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_item_type := (v_item->>'item_type')::sale_item_type;
    v_quantity := (v_item->>'quantity')::int;
    v_unit_price := (v_item->>'unit_price')::bigint;
    v_line_discount := coalesce((v_item->>'line_discount')::bigint, 0);

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Line quantity must be greater than 0.';
    end if;

    v_line_total := (v_quantity * v_unit_price) - v_line_discount;
    v_subtotal := v_subtotal + v_line_total;

    if v_item_type = 'product' then
      v_product_id := (v_item->>'product_id')::uuid;

      select quantity_on_hand into v_on_hand from product_stock where product_id = v_product_id;
      v_on_hand := coalesce(v_on_hand, 0);

      if v_quantity > v_on_hand then
        if not p_override_oversell or not is_admin_or_owner() then
          raise exception 'Insufficient stock for product % (% on hand, % requested).',
            v_product_id, v_on_hand, v_quantity;
        end if;
      end if;

      select average_unit_cost into v_unit_cost from product_stock where product_id = v_product_id;
      v_cogs_total := v_cogs_total + (v_quantity * coalesce(v_unit_cost, 0));
    end if;
  end loop;

  v_total := v_subtotal - p_discount_amount + p_tax_amount;
  v_payment_status := case
    when p_amount_paid >= v_total then 'paid'
    when p_amount_paid > 0 then 'partial'
    else 'unpaid'
  end;

  insert into sales (
    id, customer_id, pricing_tier, subtotal, discount_amount, discount_reason, tax_amount,
    total, cogs_total, payment_method, payment_reference, amount_paid, payment_status,
    booking_id, sold_by, notes
  ) values (
    v_sale_id, p_customer_id, p_pricing_tier, v_subtotal, p_discount_amount, p_discount_reason,
    p_tax_amount, v_total, v_cogs_total, p_payment_method, p_payment_reference, p_amount_paid,
    v_payment_status, p_booking_id, v_created_by, p_notes
  )
  returning sale_number into v_sale_number;

  -- Second pass: write line items and stock movements now that the header exists.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_item_type := (v_item->>'item_type')::sale_item_type;
    v_product_id := nullif(v_item->>'product_id', '')::uuid;
    v_service_id := nullif(v_item->>'service_id', '')::uuid;
    v_quantity := (v_item->>'quantity')::int;
    v_unit_price := (v_item->>'unit_price')::bigint;
    v_line_discount := coalesce((v_item->>'line_discount')::bigint, 0);
    v_line_total := (v_quantity * v_unit_price) - v_line_discount;
    v_unit_cost := 0;
    v_warranty_months := null;

    if v_item_type = 'product' then
      select name, warranty_months, coalesce((select average_unit_cost from product_stock where product_id = products.id), 0)
        into v_description, v_warranty_months, v_unit_cost
      from products where id = v_product_id;
    elsif v_item_type = 'service' then
      select name into v_description from services where id = v_service_id;
    else
      v_description := v_item->>'description';
    end if;

    insert into sale_items (
      sale_id, item_type, product_id, service_id, description, quantity, unit_price,
      unit_cost, line_discount, line_total, warranty_expires_at
    ) values (
      v_sale_id, v_item_type, v_product_id, v_service_id, v_description, v_quantity, v_unit_price,
      v_unit_cost, v_line_discount, v_line_total,
      case when v_warranty_months is not null then (current_date + (v_warranty_months::text || ' months')::interval)::date else null end
    );

    if v_item_type = 'product' then
      insert into stock_movements (product_id, movement_type, quantity, unit_cost, reference_type, reference_id, notes, created_by)
      values (
        v_product_id, 'sale_out', v_quantity, v_unit_cost, 'sale', v_sale_id,
        case when p_override_reason is not null then 'Oversold: ' || p_override_reason else null end,
        v_created_by
      );
    end if;
  end loop;

  if p_amount_paid > 0 then
    insert into payments (sale_id, amount, method, reference, received_by)
    values (v_sale_id, p_amount_paid, p_payment_method, p_payment_reference, v_created_by);
  end if;

  if p_booking_id is not null then
    update bookings set sale_id = v_sale_id, status = 'completed' where id = p_booking_id;
  end if;

  insert into audit_log (user_id, action, table_name, record_id, changes)
  values (v_created_by, 'create_sale', 'sales', v_sale_id, jsonb_build_object(
    'total', v_total, 'payment_method', p_payment_method, 'override_oversell', p_override_oversell
  ));

  return query select v_sale_id, v_sale_number;
end;
$$;

-- Explicit rather than relying on Supabase's default function-privilege grants — this is
-- callable directly via supabase.rpc('create_sale', ...) from any staff session.
grant execute on function create_sale to authenticated;

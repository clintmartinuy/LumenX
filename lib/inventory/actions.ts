"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffProfile, hasMinimumRole } from "@/lib/auth/roles";
import { centavos, pesosToCentavos } from "@/lib/money";
import { allocateLandedCost, nextPurchaseOrderStatus } from "@/lib/inventory";
import {
  productSchema,
  purchaseOrderSchema,
  receivePurchaseOrderSchema,
  stockAdjustmentSchema,
  supplierSchema,
  type ProductInput,
  type PurchaseOrderInput,
  type ReceivePurchaseOrderInput,
  type StockAdjustmentInput,
  type SupplierInput,
} from "@/lib/validation/inventory";

type ActionResult = { error: string } | { success: true; id?: string };

async function requireRole(minimum: "staff" | "admin" | "owner"): Promise<{ error: string } | null> {
  const { profile } = await getCurrentStaffProfile();
  if (!profile || !hasMinimumRole(profile.role, minimum)) {
    return { error: "You don't have permission to do that." };
  }
  return null;
}

export async function upsertProduct(productId: string | null, input: ProductInput): Promise<ActionResult> {
  const denied = await requireRole("staff");
  if (denied) return denied;

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form and try again." };
  const data = parsed.data;

  const supabase = await createClient();
  const specs = Object.fromEntries(data.specs.map((s) => [s.key, s.value]));

  const row = {
    sku: data.sku,
    name: data.name,
    slug: data.slug,
    category_id: data.categoryId || null,
    short_description: data.shortDescription || null,
    description: data.description || null,
    specs,
    retail_price: pesosToCentavos(data.retailPricePesos),
    wholesale_price: data.wholesalePricePesos ? pesosToCentavos(Number(data.wholesalePricePesos)) : null,
    install_fee: pesosToCentavos(data.installFeePesos),
    warranty_months: data.warrantyMonths,
    reorder_point: data.reorderPoint,
    is_active: data.isActive,
    is_featured: data.isFeatured,
  };

  let id = productId;
  if (id) {
    const { error } = await supabase.from("products").update(row).eq("id", id);
    if (error) return { error: "Could not save product: " + error.message };
  } else {
    const { data: created, error } = await supabase.from("products").insert(row).select("id").single();
    if (error) return { error: "Could not save product: " + error.message };
    id = created.id as string;
  }

  await supabase.from("vehicle_fitments").delete().eq("product_id", id);
  if (data.fitments.length > 0) {
    await supabase.from("vehicle_fitments").insert(
      data.fitments.map((f) => ({
        product_id: id,
        make: f.make,
        model: f.model,
        year_from: f.yearFrom || null,
        year_to: f.yearTo || null,
      })),
    );
  }

  revalidatePath("/admin/inventory");
  revalidatePath("/products");
  return { success: true, id };
}

export async function uploadProductImage(productId: string, file: File): Promise<ActionResult> {
  const denied = await requireRole("staff");
  if (denied) return denied;

  const supabase = await createClient();
  const path = `${productId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file);
  if (uploadError) return { error: "Upload failed: " + uploadError.message };

  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    storage_path: path,
    is_primary: (count ?? 0) === 0,
    sort_order: count ?? 0,
  });
  if (error) return { error: "Could not save image: " + error.message };

  revalidatePath(`/admin/inventory/${productId}`);
  return { success: true };
}

export async function adjustStock(input: StockAdjustmentInput): Promise<ActionResult> {
  const denied = await requireRole("staff");
  if (denied) return denied;

  const parsed = stockAdjustmentSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form and try again." };
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("stock_movements").insert({
    product_id: data.productId,
    movement_type: data.movementType,
    quantity: data.quantity,
    reference_type: "manual",
    notes: `${data.reason}${data.notes ? " — " + data.notes : ""}`,
    created_by: user?.id ?? null,
  });
  if (error) return { error: "Could not record adjustment: " + error.message };

  await supabase.from("audit_log").insert({
    user_id: user?.id ?? null,
    action: "stock_adjustment",
    table_name: "stock_movements",
    record_id: data.productId,
    changes: data,
  });

  revalidatePath("/admin/inventory");
  return { success: true };
}

export async function upsertSupplier(supplierId: string | null, input: SupplierInput): Promise<ActionResult> {
  const denied = await requireRole("admin");
  if (denied) return denied;

  const parsed = supplierSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form and try again." };
  const data = parsed.data;

  const supabase = await createClient();
  const row = {
    name: data.name,
    contact_person: data.contactPerson || null,
    phone: data.phone || null,
    email: data.email || null,
    address: data.address || null,
    notes: data.notes || null,
  };

  if (supplierId) {
    const { error } = await supabase.from("suppliers").update(row).eq("id", supplierId);
    if (error) return { error: "Could not save supplier: " + error.message };
  } else {
    const { error } = await supabase.from("suppliers").insert(row);
    if (error) return { error: "Could not save supplier: " + error.message };
  }

  revalidatePath("/admin/purchases");
  return { success: true };
}

export async function createPurchaseOrder(input: PurchaseOrderInput): Promise<ActionResult> {
  const denied = await requireRole("admin");
  if (denied) return denied;

  const parsed = purchaseOrderSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form and try again." };
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: po, error } = await supabase
    .from("purchase_orders")
    .insert({
      supplier_id: data.supplierId,
      order_date: data.orderDate,
      status: "ordered",
      shipping_cost: pesosToCentavos(data.shippingCostPesos),
      other_costs: pesosToCentavos(data.otherCostsPesos),
      notes: data.notes || null,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();
  if (error) return { error: "Could not create PO: " + error.message };

  const { error: itemsError } = await supabase.from("purchase_order_items").insert(
    data.items.map((item) => ({
      purchase_order_id: po.id,
      product_id: item.productId,
      quantity_ordered: item.quantityOrdered,
      unit_cost: pesosToCentavos(item.unitCostPesos),
    })),
  );
  if (itemsError) return { error: "Could not save line items: " + itemsError.message };

  revalidatePath("/admin/purchases");
  return { success: true, id: po.id as string };
}

// Partial receipt supported: `lines` only needs to include items being received *now*.
// Freight/other costs are allocated by value share across the items received in this
// batch (§9.3), landing on stock_movements.unit_cost — the moving-average cost the
// product_stock view computes from is entirely driven by that column.
export async function receivePurchaseOrder(input: ReceivePurchaseOrderInput): Promise<ActionResult> {
  const denied = await requireRole("admin");
  if (denied) return denied;

  const parsed = receivePurchaseOrderSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form and try again." };
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: po, error: poError } = await supabase
    .from("purchase_orders")
    .select("id, shipping_cost, other_costs, status")
    .eq("id", data.purchaseOrderId)
    .maybeSingle();
  if (poError || !po) return { error: "Purchase order not found." };

  const { data: items, error: itemsError } = await supabase
    .from("purchase_order_items")
    .select("id, product_id, quantity_ordered, quantity_received, unit_cost")
    .eq("purchase_order_id", data.purchaseOrderId);
  if (itemsError || !items) return { error: "Could not load line items." };

  const receivingNow = data.lines.filter((l) => l.quantityReceivedNow > 0);
  if (receivingNow.length === 0) return { error: "Enter a quantity for at least one item." };

  // Computed from ALL ordered lines (fixed per-unit cost), not just this batch — see
  // lib/inventory.ts for why that's required to avoid double-allocating freight across
  // multiple partial-receipt batches on the same PO.
  const landed = allocateLandedCost(
    items.map((item) => ({
      productId: item.product_id as string,
      quantityOrdered: item.quantity_ordered as number,
      unitCost: centavos(item.unit_cost as number),
    })),
    centavos((po.shipping_cost as number) + (po.other_costs as number)),
  );

  for (const line of receivingNow) {
    const item = items.find((i) => i.id === line.itemId)!;
    const landedLine = landed.find((l) => l.productId === item.product_id)!;

    const { error: movementError } = await supabase.from("stock_movements").insert({
      product_id: item.product_id,
      movement_type: "purchase_in",
      quantity: line.quantityReceivedNow,
      unit_cost: landedLine.landedUnitCost,
      reference_type: "purchase_order",
      reference_id: data.purchaseOrderId,
      created_by: user?.id ?? null,
    });
    if (movementError) return { error: "Could not record receipt: " + movementError.message };

    const { error: updateError } = await supabase
      .from("purchase_order_items")
      .update({ quantity_received: (item.quantity_received as number) + line.quantityReceivedNow })
      .eq("id", item.id);
    if (updateError) return { error: "Could not update line item: " + updateError.message };
  }

  const { data: refreshedItems } = await supabase
    .from("purchase_order_items")
    .select("quantity_ordered, quantity_received")
    .eq("purchase_order_id", data.purchaseOrderId);

  const status = nextPurchaseOrderStatus(
    (refreshedItems ?? []).map((i) => ({
      quantityOrdered: i.quantity_ordered as number,
      quantityReceived: i.quantity_received as number,
    })),
  );

  await supabase
    .from("purchase_orders")
    .update({ status, received_date: new Date().toISOString().slice(0, 10) })
    .eq("id", data.purchaseOrderId);

  revalidatePath("/admin/purchases");
  revalidatePath("/admin/inventory");
  return { success: true };
}

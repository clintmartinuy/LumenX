import "server-only";
import { createClient } from "@/lib/supabase/server";

export type InventoryFilters = {
  search?: string;
  categoryId?: string;
  lowStockOnly?: boolean;
};

// Joins products with the product_stock view (cost/qty) — RLS on product_stock restricts
// this to staff+ automatically (§00005), so this must only be called from admin routes.
export async function getInventoryList(filters: InventoryFilters = {}) {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("id, sku, name, retail_price, reorder_point, is_active, category_id, categories(name)")
    .order("name");

  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
  }
  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  const { data: products, error } = await query;
  if (error) throw error;

  const { data: stock, error: stockError } = await supabase
    .from("product_stock")
    .select("product_id, quantity_on_hand, average_unit_cost, stock_value");
  if (stockError) throw stockError;

  const stockByProduct = new Map((stock ?? []).map((s) => [s.product_id as string, s]));

  let rows = (products ?? []).map((p) => {
    const s = stockByProduct.get(p.id as string);
    const quantityOnHand = (s?.quantity_on_hand as number) ?? 0;
    const averageUnitCost = (s?.average_unit_cost as number) ?? 0;
    const stockValue = (s?.stock_value as number) ?? 0;
    const retailPrice = p.retail_price as number;
    const marginPct = retailPrice > 0 ? ((retailPrice - averageUnitCost) / retailPrice) * 100 : 0;

    return {
      ...p,
      quantityOnHand,
      averageUnitCost,
      stockValue,
      marginPct,
      status:
        quantityOnHand <= 0 ? ("out_of_stock" as const) : quantityOnHand <= (p.reorder_point as number) ? ("low_stock" as const) : ("in_stock" as const),
    };
  });

  if (filters.lowStockOnly) {
    rows = rows.filter((r) => r.status !== "in_stock");
  }

  return rows;
}

export async function getProductForEdit(id: string) {
  const supabase = await createClient();

  const [{ data: product, error }, { data: fitments }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("vehicle_fitments").select("id, make, model, year_from, year_to").eq("product_id", id),
  ]);

  if (error) throw error;
  if (!product) return null;

  return { ...product, fitments: fitments ?? [] };
}

export async function getAllProductsForSelect() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select("id, sku, name").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("id, name, slug").order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function getStockMovements(productId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stock_movements")
    .select("id, movement_type, quantity, unit_cost, reference_type, notes, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function getSuppliers() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("suppliers").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getPurchaseOrders() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchase_orders")
    .select("id, po_number, status, order_date, received_date, shipping_cost, other_costs, suppliers(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getPurchaseOrderDetail(id: string) {
  const supabase = await createClient();

  const [{ data: po, error }, { data: items, error: itemsError }] = await Promise.all([
    supabase
      .from("purchase_orders")
      .select("*, suppliers(name)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("purchase_order_items")
      .select("id, product_id, quantity_ordered, quantity_received, unit_cost, line_total, products(name, sku)")
      .eq("purchase_order_id", id),
  ]);

  if (error) throw error;
  if (itemsError) throw itemsError;
  if (!po) return null;

  return { ...po, items: items ?? [] };
}

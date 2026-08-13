import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getPosCatalog() {
  const supabase = await createClient();

  const [{ data: products, error: productsError }, { data: services, error: servicesError }, { data: stock, error: stockError }, { data: categories }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, sku, name, retail_price, wholesale_price, category_id")
        .eq("is_active", true)
        .order("name"),
      supabase.from("services").select("id, name, base_price").eq("is_active", true).order("name"),
      supabase.from("product_stock").select("product_id, quantity_on_hand"),
      supabase.from("categories").select("id, name").eq("is_active", true).order("sort_order"),
    ]);

  if (productsError) throw productsError;
  if (servicesError) throw servicesError;
  if (stockError) throw stockError;

  const stockByProduct = new Map((stock ?? []).map((s) => [s.product_id as string, s.quantity_on_hand as number]));

  return {
    products: (products ?? []).map((p) => ({ ...p, quantityOnHand: stockByProduct.get(p.id as string) ?? 0 })),
    services: services ?? [],
    categories: categories ?? [],
  };
}

export async function searchCustomers(query: string) {
  if (!query || query.length < 2) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, full_name, phone, customer_type")
    .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
    .limit(10);
  if (error) throw error;
  return data ?? [];
}

export async function getSales() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sales")
    .select("id, sale_number, sale_date, total, payment_status, payment_method, customers(full_name)")
    .order("sale_date", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function getSaleDetail(id: string) {
  const supabase = await createClient();

  const [{ data: sale, error }, { data: items, error: itemsError }, { data: payments }] = await Promise.all([
    supabase.from("sales").select("*, customers(full_name, phone, customer_type)").eq("id", id).maybeSingle(),
    supabase.from("sale_items").select("*").eq("sale_id", id),
    supabase.from("payments").select("*").eq("sale_id", id).order("paid_at"),
  ]);

  if (error) throw error;
  if (itemsError) throw itemsError;
  if (!sale) return null;

  return { ...sale, items: items ?? [], payments: payments ?? [] };
}

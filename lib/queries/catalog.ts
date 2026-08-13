import { createPublicClient } from "@/lib/supabase/public";

export async function getActiveCategories() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, sort_order")
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw error;
  return data;
}

export async function getFitmentOptions(): Promise<Record<string, string[]>> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("vehicle_fitments").select("make, model").order("make");
  if (error) throw error;

  const byMake: Record<string, Set<string>> = {};
  for (const row of data ?? []) {
    const make = row.make as string;
    byMake[make] ??= new Set();
    byMake[make].add(row.model as string);
  }

  return Object.fromEntries(
    Object.entries(byMake).map(([make, models]) => [make, [...models].sort()]),
  );
}

export async function getActiveServices() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, name, slug, description, base_price, duration_minutes")
    .eq("is_active", true)
    .order("name");

  if (error) throw error;
  return data;
}

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export async function getStockStatuses(
  productIds?: string[],
): Promise<Map<string, StockStatus>> {
  const supabase = createPublicClient();
  let query = supabase.from("product_stock_status").select("product_id, status");
  if (productIds) query = query.in("product_id", productIds);

  const { data, error } = await query;
  if (error) throw error;

  return new Map((data ?? []).map((row) => [row.product_id as string, row.status as StockStatus]));
}

// Products with zero fitment rows are treated as universal (§5.1). Returns null when no
// vehicle filter is applied (meaning "don't filter by fitment").
async function getVehicleCompatibleProductIds(
  supabase: ReturnType<typeof createPublicClient>,
  make?: string,
  model?: string,
  year?: number,
): Promise<Set<string> | null> {
  if (!make) return null;

  const [{ data: fitments, error: fitmentsError }, { data: allProducts, error: productsError }] =
    await Promise.all([
      supabase.from("vehicle_fitments").select("product_id, make, model, year_from, year_to"),
      supabase.from("products").select("id").eq("is_active", true),
    ]);

  if (fitmentsError) throw fitmentsError;
  if (productsError) throw productsError;

  const productsWithFitments = new Set((fitments ?? []).map((f) => f.product_id as string));

  const matched = new Set(
    (fitments ?? [])
      .filter((f) => {
        if ((f.make as string).toLowerCase() !== make.toLowerCase()) return false;
        if (model && (f.model as string).toLowerCase() !== model.toLowerCase()) return false;
        if (year) {
          if (f.year_from !== null && year < (f.year_from as number)) return false;
          if (f.year_to !== null && year > (f.year_to as number)) return false;
        }
        return true;
      })
      .map((f) => f.product_id as string),
  );

  const universal = (allProducts ?? [])
    .map((p) => p.id as string)
    .filter((id) => !productsWithFitments.has(id));

  return new Set([...matched, ...universal]);
}

export type ProductFilters = {
  categorySlug?: string;
  make?: string;
  model?: string;
  year?: number;
  minPriceCentavos?: number;
  maxPriceCentavos?: number;
  inStockOnly?: boolean;
  sort?: "newest" | "price_asc" | "price_desc" | "featured";
};

export async function getProducts(filters: ProductFilters = {}) {
  const supabase = createPublicClient();

  let query = supabase
    .from("products")
    .select(
      "id, sku, name, slug, category_id, short_description, specs, retail_price, install_fee, is_featured, created_at, categories(slug, name)",
    )
    .eq("is_active", true);

  if (filters.categorySlug) {
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", filters.categorySlug)
      .maybeSingle();
    query = query.eq("category_id", category?.id ?? "00000000-0000-0000-0000-000000000000");
  }

  if (filters.minPriceCentavos !== undefined) query = query.gte("retail_price", filters.minPriceCentavos);
  if (filters.maxPriceCentavos !== undefined) query = query.lte("retail_price", filters.maxPriceCentavos);

  switch (filters.sort) {
    case "price_asc":
      query = query.order("retail_price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("retail_price", { ascending: false });
      break;
    case "featured":
      query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;

  let products = data ?? [];

  const compatibleIds = await getVehicleCompatibleProductIds(
    supabase,
    filters.make,
    filters.model,
    filters.year,
  );
  if (compatibleIds) {
    products = products.filter((p) => compatibleIds.has(p.id as string));
  }

  if (filters.inStockOnly) {
    const statuses = await getStockStatuses(products.map((p) => p.id as string));
    products = products.filter((p) => statuses.get(p.id as string) !== "out_of_stock");
  }

  const { data: images } = await supabase
    .from("product_images")
    .select("product_id, storage_path")
    .in("product_id", products.map((p) => p.id as string))
    .eq("is_primary", true);
  const imageByProduct = new Map((images ?? []).map((i) => [i.product_id as string, i.storage_path as string]));

  return products.map((p) => ({ ...p, imagePath: imageByProduct.get(p.id as string) }));
}

export async function getProductBySlug(slug: string) {
  const supabase = createPublicClient();

  const { data: product, error } = await supabase
    .from("products")
    .select(
      "id, sku, name, slug, category_id, short_description, description, specs, retail_price, install_fee, warranty_months, is_active, categories(slug, name)",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  if (!product) return null;

  const [{ data: images }, { data: fitments }, statuses] = await Promise.all([
    supabase
      .from("product_images")
      .select("storage_path, alt_text, sort_order, is_primary")
      .eq("product_id", product.id)
      .order("sort_order"),
    supabase
      .from("vehicle_fitments")
      .select("make, model, year_from, year_to")
      .eq("product_id", product.id)
      .order("make"),
    getStockStatuses([product.id as string]),
  ]);

  return {
    ...product,
    images: images ?? [],
    fitments: fitments ?? [],
    stockStatus: statuses.get(product.id as string) ?? "out_of_stock",
    // wholesale_price is intentionally never selected here — anon has no column grant for
    // it anyway (§00004), but this keeps the shape honest even for a staff-session request.
  };
}

// Used by generateStaticParams and sitemap.ts, both of which run at build time. A
// database outage (or, in this environment, no real Supabase project configured yet)
// should not fail the whole build — product pages still render on-demand at request time
// (dynamicParams defaults to true), just without being pre-rendered.
export async function getAllActiveProductSlugs(): Promise<string[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from("products").select("slug").eq("is_active", true);
    if (error) throw error;
    return (data ?? []).map((p) => p.slug as string);
  } catch (err) {
    console.warn("getAllActiveProductSlugs: falling back to empty list —", err);
    return [];
  }
}

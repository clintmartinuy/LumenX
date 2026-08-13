import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductCard } from "@/components/public/product-card";
import { ProductFilters } from "@/components/public/product-filters";
import {
  getActiveCategories,
  getFitmentOptions,
  getProducts,
  getStockStatuses,
  type ProductFilters as CatalogFilters,
} from "@/lib/queries/catalog";
import { pesosToCentavos } from "@/lib/money";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Products — LumenX PH",
  description: "Browse projector fog lights, headlight retrofits, light bars, and accessories.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function param(searchParams: SearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

async function ProductGrid({ searchParams }: { searchParams: SearchParams }) {
  const filters: CatalogFilters = {
    categorySlug: param(searchParams, "category"),
    make: param(searchParams, "make"),
    model: param(searchParams, "model"),
    year: param(searchParams, "year") ? Number(param(searchParams, "year")) : undefined,
    minPriceCentavos: param(searchParams, "min") ? pesosToCentavos(Number(param(searchParams, "min"))) : undefined,
    maxPriceCentavos: param(searchParams, "max") ? pesosToCentavos(Number(param(searchParams, "max"))) : undefined,
    inStockOnly: param(searchParams, "in_stock") === "1",
    sort: (param(searchParams, "sort") as CatalogFilters["sort"]) ?? "newest",
  };

  const products = await getProducts(filters);
  const statuses = await getStockStatuses(products.map((p) => p.id as string));

  if (products.length === 0) {
    return <p className="text-muted-foreground py-12 text-center text-sm">No products match those filters.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.slug as string}
          product={product}
          stockStatus={statuses.get(product.id as string) ?? "out_of_stock"}
        />
      ))}
    </div>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const [categories, fitmentOptions] = await Promise.all([
    getActiveCategories(),
    getFitmentOptions(),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <h1 className="font-heading mb-8 text-3xl font-bold tracking-tight">Products</h1>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[220px_1fr]">
        <aside>
          <ProductFilters categories={categories ?? []} fitmentOptions={fitmentOptions} />
        </aside>
        <Suspense fallback={<p className="text-muted-foreground text-sm">Loading...</p>}>
          <ProductGrid searchParams={resolvedSearchParams} />
        </Suspense>
      </div>
    </main>
  );
}

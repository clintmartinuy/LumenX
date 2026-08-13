import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/public/product-card";
import { getProducts, getStockStatuses } from "@/lib/queries/catalog";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "LumenX PH — High-Wattage Automotive Lighting",
  description:
    "Projector fog lights, headlight retrofits, and light bars — sold and professionally installed in Metro Manila.",
};

export default async function HomePage() {
  const featured = (await getProducts({ sort: "featured" })).slice(0, 4);
  const statuses = await getStockStatuses(featured.map((p) => p.id as string));

  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
          High-wattage lighting.
          <br />
          <span className="text-primary">Professionally installed.</span>
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-sm sm:text-base">
          Projector fog lights, headlight retrofits, and light bars for cars and
          motorcycles — sold and installed by LumenX PH in Metro Manila.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" render={<Link href="/book" />}>
            Book Installation
          </Button>
          <Button
            size="lg"
            variant="outline"
            render={<a href="https://www.facebook.com/LumenxPH" target="_blank" rel="noreferrer" />}
          >
            Message Us
          </Button>
        </div>
      </section>

      {featured.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Featured Products</h2>
            <Link href="/products" className="text-muted-foreground hover:text-foreground text-sm">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard
                key={product.slug as string}
                product={product}
                stockStatus={statuses.get(product.id as string) ?? "out_of_stock"}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="border-border/60 border-t">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-16 sm:grid-cols-3">
          <div>
            <h3 className="font-semibold">Warranty on every install</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              6-12 months depending on the product, covering parts and workmanship.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Installation included</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Every product we sell, we install — no separate shop needed.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Metro Manila shop</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              123 EDSA, Quezon City. Open six days a week.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

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

const TRUST_ITEMS = [
  {
    title: "Warranty on every install",
    body: "6-12 months depending on the product, covering parts and workmanship.",
  },
  {
    title: "Installation included",
    body: "Every product we sell, we install — no separate shop needed.",
  },
  {
    title: "Metro Manila shop",
    body: "123 EDSA, Quezon City. Open six days a week.",
  },
];

export default async function HomePage() {
  const featured = (await getProducts({ sort: "featured" })).slice(0, 4);
  const statuses = await getStockStatuses(featured.map((p) => p.id as string));

  return (
    <main>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="from-primary/15 pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b via-transparent to-transparent"
        />
        <div className="mx-auto max-w-6xl px-4 pt-20 pb-16 sm:pt-28 sm:pb-24">
          <p className="text-primary mb-4 text-xs font-semibold tracking-[0.2em] uppercase">
            Metro Manila · Sales &amp; Installation
          </p>
          <h1 className="font-heading max-w-3xl text-5xl leading-[0.98] font-bold tracking-tight text-balance sm:text-7xl">
            High-wattage lighting.
            <br />
            <span className="text-primary">Professionally installed.</span>
          </h1>
          <p className="text-muted-foreground mt-6 max-w-lg text-base sm:text-lg">
            Projector fog lights, headlight retrofits, and light bars for cars and
            motorcycles — sold and installed by LumenX PH.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button size="lg" className="rounded-full px-6 text-base font-semibold" render={<Link href="/book" />}>
              Book Installation
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-6 text-base font-semibold"
              render={<a href="https://www.facebook.com/LumenxPH" target="_blank" rel="noreferrer" />}
            >
              Message Us
            </Button>
          </div>
        </div>
      </section>

      {featured.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-heading text-2xl font-bold tracking-tight">Featured</h2>
            <Link
              href="/products"
              className="text-muted-foreground hover:text-foreground text-sm font-medium underline-offset-4 hover:underline"
            >
              View all products →
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
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-20 sm:grid-cols-3">
          {TRUST_ITEMS.map((item) => (
            <div key={item.title}>
              <h3 className="font-heading text-lg font-semibold">{item.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

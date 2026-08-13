import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SpecChips } from "@/components/public/spec-chips";
import { StockBadge } from "@/components/public/stock-badge";
import { getAllActiveProductSlugs, getProductBySlug } from "@/lib/queries/catalog";
import { centavos, formatCentavos } from "@/lib/money";
import { publicStorageUrl } from "@/lib/storage";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getAllActiveProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  return {
    title: `${product.name} — LumenX PH`,
    description: product.short_description ?? undefined,
    openGraph: product.images[0]
      ? { images: [publicStorageUrl("product-images", product.images[0].storage_path as string)] }
      : undefined,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const primaryImage = product.images.find((i) => i.is_primary) ?? product.images[0];
  const category = product.categories as unknown as { slug: string; name: string } | null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short_description,
    sku: product.sku,
    offers: {
      "@type": "Offer",
      priceCurrency: "PHP",
      price: (product.retail_price / 100).toFixed(2),
      availability:
        product.stockStatus === "out_of_stock"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
    },
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="text-muted-foreground mb-4 text-xs">
        <Link href="/products" className="hover:text-foreground">
          Products
        </Link>
        {category ? (
          <>
            {" / "}
            <Link href={`/products?category=${category.slug}`} className="hover:text-foreground">
              {category.name}
            </Link>
          </>
        ) : null}
      </nav>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="bg-muted relative aspect-square overflow-hidden rounded-lg">
          {primaryImage ? (
            <Image
              src={publicStorageUrl("product-images", primaryImage.storage_path as string)}
              alt={product.name}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
              No image
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight">{product.name}</h1>
            <StockBadge status={product.stockStatus} />
          </div>
          <p className="font-mono text-xs text-muted-foreground">{product.sku}</p>

          <div>
            <p className="font-heading text-3xl font-bold">{formatCentavos(centavos(product.retail_price))}</p>
            {product.install_fee > 0 ? (
              <p className="text-muted-foreground text-sm">
                + {formatCentavos(centavos(product.install_fee))} installation
              </p>
            ) : null}
          </div>

          <SpecChips specs={product.specs} className="flex flex-wrap gap-1.5" />

          {product.short_description ? (
            <p className="text-muted-foreground text-sm">{product.short_description}</p>
          ) : null}

          <p className="text-muted-foreground text-xs">
            Warranty: {product.warranty_months} months
          </p>

          <div className="bg-card rounded-xl border p-3 text-xs">
            <p className="font-medium">Wholesale pricing available — inquire</p>
            <Link
              href={`/contact?customer_type=b2b&product=${product.sku}`}
              className="text-primary hover:underline"
            >
              Ask about B2B pricing
            </Link>
          </div>

          {product.fitments.length > 0 ? (
            <div>
              <p className="mb-1 text-sm font-medium">Confirmed fitment</p>
              <ul className="text-muted-foreground text-xs">
                {product.fitments.map((f, i) => (
                  <li key={i}>
                    {f.make} {f.model}
                    {f.year_from || f.year_to ? ` (${f.year_from ?? ""}-${f.year_to ?? ""})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">Universal fit — no vehicle restrictions on record.</p>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button className="rounded-full font-semibold" render={<Link href={`/book?product=${product.sku}`} />}>
              Book Installation with This
            </Button>
            <Button
              variant="outline"
              className="rounded-full font-semibold"
              render={<Link href={`/contact?product=${product.sku}&subject=${encodeURIComponent(product.name)}`} />}
            >
              Ask About This
            </Button>
            <Button
              variant="outline"
              className="rounded-full font-semibold"
              render={<a href="https://www.facebook.com/LumenxPH" target="_blank" rel="noreferrer" />}
            >
              Message on Facebook
            </Button>
          </div>
        </div>
      </div>

      {product.description ? (
        <div className="mt-12 max-w-3xl space-y-2 text-sm">
          <h2 className="font-semibold">Details</h2>
          <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
        </div>
      ) : null}
    </main>
  );
}

import Image from "next/image";
import Link from "next/link";
import { centavos, formatCentavos } from "@/lib/money";
import { publicStorageUrl } from "@/lib/storage";
import { SpecChips } from "@/components/public/spec-chips";
import { StockBadge } from "@/components/public/stock-badge";
import type { StockStatus } from "@/lib/queries/catalog";

export type ProductCardData = {
  slug: string;
  name: string;
  short_description: string | null;
  specs: Record<string, string | number> | null;
  retail_price: number;
  imagePath?: string;
};

export function ProductCard({
  product,
  stockStatus,
}: {
  product: ProductCardData;
  stockStatus: StockStatus;
}) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group bg-card border-border/60 hover:border-primary/40 block overflow-hidden rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-12px_oklch(0_0_0/0.6)]"
    >
      <div className="bg-muted relative aspect-square overflow-hidden">
        {product.imagePath ? (
          <Image
            src={publicStorageUrl("product-images", product.imagePath)}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
            No image
          </div>
        )}
        <div className="absolute top-2 right-2">
          <StockBadge status={stockStatus} />
        </div>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="text-sm leading-tight font-semibold">{product.name}</h3>
        {product.short_description ? (
          <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
            {product.short_description}
          </p>
        ) : null}
        <SpecChips specs={product.specs} keys={["wattage", "lumens", "color_temp"]} />
        <p className="font-heading pt-1 text-base font-bold">
          {formatCentavos(centavos(product.retail_price))}
        </p>
      </div>
    </Link>
  );
}

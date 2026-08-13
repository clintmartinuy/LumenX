import type { Metadata } from "next";
import { BookingWizard } from "@/components/public/booking-wizard";
import { getActiveServices, getProducts } from "@/lib/queries/catalog";

export const metadata: Metadata = {
  title: "Book Installation — LumenX PH",
  description: "Book an installation slot online — pick services, your vehicle, and a time.",
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const product = typeof params.product === "string" ? params.product : undefined;

  const [services, products] = await Promise.all([getActiveServices(), getProducts()]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <h1 className="font-heading mb-8 text-center text-3xl font-bold tracking-tight">Book Installation</h1>
      <BookingWizard
        services={(services ?? []).map((s) => ({
          id: s.id as string,
          name: s.name as string,
          base_price: s.base_price as number,
          duration_minutes: s.duration_minutes as number,
        }))}
        products={products.map((p) => ({ id: p.id as string, sku: p.sku as string, name: p.name as string, retail_price: p.retail_price as number }))}
        defaultProductSku={product}
      />
    </main>
  );
}

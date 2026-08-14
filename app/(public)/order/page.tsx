import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Order Now — LumenX PH",
  description: "Order for personal use or request a bulk/reseller quotation.",
};

export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const product = typeof params.product === "string" ? params.product : undefined;
  const productQuery = product ? `?product=${encodeURIComponent(product)}` : "";
  const businessHref = product
    ? `/contact?customer_type=b2b&subject=Quotation%20Request&product=${encodeURIComponent(product)}`
    : `/contact?customer_type=b2b&subject=Quotation%20Request`;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <h1 className="font-heading text-center text-3xl font-bold tracking-tight">How are you ordering?</h1>
      <p className="text-muted-foreground mt-2 mb-10 text-center text-sm">
        Pick the option that fits — personal orders go straight to booking, business orders
        get a quotation.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="border-border/60 bg-card flex flex-col items-start gap-3 rounded-2xl border p-6">
          <h2 className="font-heading text-lg font-semibold">Personal Use</h2>
          <p className="text-muted-foreground text-sm">
            Buying for your own vehicle. Pick a service and time slot — installed and ready
            to go.
          </p>
          <Button className="mt-auto w-full rounded-full font-semibold" render={<Link href={`/book${productQuery}`} />}>
            Continue to Booking
          </Button>
        </div>

        <div className="border-border/60 bg-card flex flex-col items-start gap-3 rounded-2xl border p-6">
          <h2 className="font-heading text-lg font-semibold">Business / Bulk</h2>
          <p className="text-muted-foreground text-sm">
            Ordering for a shop, reseller, or in bulk. Tell us what you need and we&apos;ll
            send a quotation.
          </p>
          <Button
            variant="outline"
            className="mt-auto w-full rounded-full font-semibold"
            render={<Link href={businessHref} />}
          >
            Request a Quotation
          </Button>
        </div>
      </div>
    </main>
  );
}

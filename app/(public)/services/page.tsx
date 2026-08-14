import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getActiveServices } from "@/lib/queries/catalog";
import { centavos, formatCentavos } from "@/lib/money";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Installation Services — LumenX PH",
  description: "Installation, wiring, and diagnostic services for automotive lighting.",
};

export default async function ServicesPage() {
  const services = await getActiveServices();

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <h1 className="font-heading text-3xl font-bold tracking-tight">Installation Services</h1>
      <p className="text-muted-foreground mt-2 mb-8 text-sm">
        Every service below is performed in-shop. Prices are starting rates — final quotes
        depend on vehicle and setup.
      </p>

      <div className="divide-border/60 bg-card divide-y rounded-2xl border">
        {(services ?? []).map((service) => (
          <div key={service.slug as string} className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="font-semibold">{service.name}</p>
              {service.description ? (
                <p className="text-muted-foreground mt-0.5 text-sm">{service.description}</p>
              ) : null}
              <p className="text-muted-foreground text-xs">{service.duration_minutes} min</p>
            </div>
            <p className="font-heading text-lg font-bold whitespace-nowrap">
              {formatCentavos(centavos(service.base_price as number))}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Button className="rounded-full font-semibold" render={<Link href="/order" />}>
          Order Now
        </Button>
      </div>
    </main>
  );
}

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
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-1 text-xl font-semibold">Installation Services</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Every service below is performed in-shop. Prices are starting rates — final quotes
        depend on vehicle and setup.
      </p>

      <div className="divide-border/60 divide-y rounded-lg border">
        {(services ?? []).map((service) => (
          <div key={service.slug as string} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium">{service.name}</p>
              {service.description ? (
                <p className="text-muted-foreground text-sm">{service.description}</p>
              ) : null}
              <p className="text-muted-foreground text-xs">{service.duration_minutes} min</p>
            </div>
            <p className="font-semibold whitespace-nowrap">
              {formatCentavos(centavos(service.base_price as number))}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Button render={<Link href="/book" />}>Book Installation</Button>
      </div>
    </main>
  );
}

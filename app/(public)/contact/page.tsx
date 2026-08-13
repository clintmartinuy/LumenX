import type { Metadata } from "next";
import { ContactForm } from "@/components/public/contact-form";

export const metadata: Metadata = {
  title: "Contact — LumenX PH",
  description: "Get in touch about products, fitment, or wholesale pricing.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const product = typeof params.product === "string" ? params.product : undefined;
  const subject = typeof params.subject === "string" ? params.subject : undefined;
  const customerType = params.customer_type === "b2b" ? "b2b" : undefined;

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-1 text-xl font-semibold">Contact Us</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Every inquiry lands in our inbox — we typically reply within a few hours during
        business hours.
      </p>
      <ContactForm defaultProductSku={product} defaultSubject={subject} defaultCustomerType={customerType} />
    </main>
  );
}

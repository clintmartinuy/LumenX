import type { Metadata } from "next";
import { createPublicClient } from "@/lib/supabase/public";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "FAQ — LumenX PH",
  description: "Answers to common questions about pricing, installation, warranty, and booking.",
};

async function getSettings() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("settings")
    .select("address, phone, business_hours, facebook_page_url")
    .maybeSingle();
  return data;
}

export default async function FaqPage() {
  const settings = await getSettings();

  const faqs = [
    {
      q: "How much do your products cost?",
      a: "Fog light kits are PHP 10,000-11,500 depending on size and color, and brackets/modules are PHP 500 each. Check individual product pages for exact pricing.",
    },
    {
      q: "Do you install everything you sell?",
      a: "Yes — every product we sell, we install. Message us or book online for installation.",
    },
    {
      q: "Will a product fit my vehicle?",
      a: "Product pages list confirmed fitments where we have them. If your vehicle isn't listed, message us with your make, model, and year and we'll confirm before your appointment.",
    },
    {
      q: "Where are you located, and what are your hours?",
      a: `We're based in ${settings?.address ?? "Dagupan City, Urdaneta City & Metro Manila"}, and we ship nationwide. Message us to confirm hours before visiting.`,
    },
    {
      q: "What's your warranty policy?",
      a: "Products carry a warranty of 3-6 months depending on the item, covering parts and workmanship. Message us with your receipt or sale number to start a claim.",
    },
    {
      q: "Do you offer wholesale/dealer pricing?",
      a: "Yes, for shops, resellers, and installers. Wholesale pricing isn't shown publicly — message us with your business name and what you're looking to order.",
    },
    {
      q: "How do I pay?",
      a: "Cash or GCash, payable on-site at the time of installation or pickup. We don't process online payments yet.",
    },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="font-heading mb-8 text-3xl font-bold tracking-tight">Frequently Asked Questions</h1>
      <div className="divide-border/60 divide-y">
        {faqs.map((item) => (
          <div key={item.q} className="py-5">
            <p className="font-semibold">{item.q}</p>
            <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
    </main>
  );
}

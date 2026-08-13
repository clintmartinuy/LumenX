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
      a: "Fog light kits start around PHP 2,200 and headlight retrofits start around PHP 3,200. Check individual product pages for exact pricing, or message us for a full price list.",
    },
    {
      q: "Do you install everything you sell?",
      a: "Yes — every product we sell, we install in-shop. Installation fees range from PHP 250 (diagnostic check) to PHP 1,500 (full headlight retrofit).",
    },
    {
      q: "Will a product fit my vehicle?",
      a: "Product pages list confirmed fitments where we have them. If your vehicle isn't listed, message us with your make, model, and year and we'll confirm before your appointment.",
    },
    {
      q: "Where are you located, and what are your hours?",
      a: `We're at ${settings?.address ?? "123 EDSA, Quezon City, Metro Manila"}. Hours: Monday-Friday 9:00-18:00, Saturday 9:00-15:00, closed Sunday.`,
    },
    {
      q: "What's your warranty policy?",
      a: "All products carry a warranty of 6-12 months depending on the item, covering parts and workmanship. Message us with your receipt or sale number to start a claim.",
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
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold">Frequently Asked Questions</h1>
      <div className="divide-border/60 divide-y">
        {faqs.map((item) => (
          <div key={item.q} className="py-4">
            <p className="font-medium">{item.q}</p>
            <p className="text-muted-foreground mt-1 text-sm">{item.a}</p>
          </div>
        ))}
      </div>
    </main>
  );
}

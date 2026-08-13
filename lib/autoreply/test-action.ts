"use server";

import { createClient } from "@/lib/supabase/server";
import { matchIntent } from "@/lib/autoreply/matcher";
import type { AutoreplyIntent, ProductLookup } from "@/lib/autoreply/intents";
import { getCurrentStaffProfile } from "@/lib/auth/roles";

export type TestIntentResult = {
  type: string;
  matchedKey: string | null;
  confidence: number;
  renderedResponse: string | null;
};

// Settings -> intent test box (§9.10): type a message, see the matched intent, confidence,
// and rendered response — without sending anything or touching an inquiry.
export async function testIntentAction(message: string): Promise<TestIntentResult | { error: string }> {
  const { profile } = await getCurrentStaffProfile();
  if (!profile) return { error: "You don't have permission to do that." };
  if (!message.trim()) return { error: "Enter a message to test." };

  const supabase = await createClient();
  const [{ data: intentRows }, { data: productRows }] = await Promise.all([
    supabase
      .from("autoreply_intents")
      .select("key, keywords, patterns, response_template, requires_human, priority")
      .eq("is_active", true),
    supabase.from("products").select("id, sku, name").eq("is_active", true),
  ]);

  const intents: AutoreplyIntent[] = (intentRows ?? []).map((i) => ({
    key: i.key as string,
    keywords: (i.keywords as string[]) ?? [],
    patterns: (i.patterns as string[]) ?? [],
    responseTemplate: i.response_template as string,
    requiresHuman: i.requires_human as boolean,
    priority: i.priority as number,
  }));
  const products: ProductLookup[] = (productRows ?? []).map((p) => ({
    id: p.id as string,
    sku: p.sku as string,
    name: p.name as string,
  }));

  const result = matchIntent(message, intents, products);

  if (result.type === "product") {
    return {
      type: "product",
      matchedKey: "product_price",
      confidence: 1,
      renderedResponse: `${result.product.name}: [live price] ([live stock status]). See full details: [product link]`,
    };
  }
  if (result.type === "intent") {
    const intent = intents.find((i) => i.key === result.intentKey);
    return {
      type: "intent",
      matchedKey: result.intentKey,
      confidence: result.confidence,
      renderedResponse: intent?.responseTemplate ?? null,
    };
  }
  if (result.type === "disambiguation") {
    return { type: "disambiguation", matchedKey: null, confidence: 0, renderedResponse: `Did you mean: ${result.options.join(" or ")}?` };
  }
  return { type: "none", matchedKey: null, confidence: result.confidence, renderedResponse: null };
}

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { matchIntent } from "@/lib/autoreply/matcher";
import type { AutoreplyIntent, ProductLookup } from "@/lib/autoreply/intents";
import { centavos, formatCentavos } from "@/lib/money";

const FOLLOW_UP_LINE = "A team member will follow up shortly if you need more help.";
const FALLBACK_LINE =
  "Sorry, I'm not sure I understood that — could you rephrase, or would you like to talk to a team member?";

type ReplyOutcome = {
  sent: boolean;
  body?: string;
  matchedIntentKey?: string | null;
  needsHuman: boolean;
};

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

// Orchestrates §8: fetches context, runs the matcher, applies the §8.3 guardrails
// (2-consecutive-unmatched stop, bot-paused-after-staff-reply, in_progress suppression,
// after-hours gating), renders the template, and logs to autoreply_logs. Called from the
// contact form, chat widget route, and (Phase 7) the Messenger webhook.
export async function getAutoReply(inquiryId: string, message: string, channel: string): Promise<ReplyOutcome> {
  const supabase = createAdminClient();

  const [{ data: inquiry }, { data: settings }] = await Promise.all([
    supabase.from("inquiries").select("status, meta").eq("id", inquiryId).maybeSingle(),
    supabase.from("settings").select("*").maybeSingle(),
  ]);

  if (!inquiry || !settings) return { sent: false, needsHuman: true };

  const meta = (inquiry.meta as Record<string, unknown>) ?? {};
  const botPausedUntil = meta.bot_paused_until ? new Date(meta.bot_paused_until as string) : null;

  if (
    !settings.autoreply_enabled ||
    inquiry.status === "in_progress" ||
    (botPausedUntil && botPausedUntil > new Date())
  ) {
    return { sent: false, needsHuman: false };
  }

  if (settings.autoreply_after_hours_only) {
    const hours = settings.business_hours as Record<string, string> | null;
    // Simple heuristic: if today's entry isn't "closed", treat it as within business hours
    // and skip auto-reply per the after-hours-only setting.
    const dayKey = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()];
    if (hours && hours[dayKey] && hours[dayKey] !== "closed") {
      return { sent: false, needsHuman: false };
    }
  }

  const [{ data: intentRows }, { data: productRows }] = await Promise.all([
    supabase
      .from("autoreply_intents")
      .select("key, name, keywords, patterns, response_template, requires_human, priority, hit_count")
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
  const consecutiveUnmatched = (meta.consecutive_unmatched as number) ?? 0;

  async function logAndReturn(outcome: ReplyOutcome, confidence: number, matchedKey: string | null) {
    await supabase.from("autoreply_logs").insert({
      inquiry_id: inquiryId,
      inbound_text: message,
      matched_intent_key: matchedKey,
      confidence,
      response_sent: outcome.body ?? null,
      was_escalated: outcome.needsHuman,
      channel,
    });
    return outcome;
  }

  if (result.type === "none" || result.type === "disambiguation") {
    if (consecutiveUnmatched >= 1) {
      // §8.3: two consecutive misses — stop replying entirely, don't loop a fallback.
      await supabase
        .from("inquiries")
        .update({ status: "needs_human", meta: { ...meta, consecutive_unmatched: consecutiveUnmatched + 1 } })
        .eq("id", inquiryId);
      return logAndReturn({ sent: false, needsHuman: true }, 0, null);
    }

    const body =
      result.type === "disambiguation"
        ? `Did you mean: ${result.options.join(" or ")}? ${FOLLOW_UP_LINE}`
        : `${FALLBACK_LINE} ${FOLLOW_UP_LINE}`;

    await supabase
      .from("inquiries")
      .update({ status: "needs_human", meta: { ...meta, consecutive_unmatched: consecutiveUnmatched + 1 } })
      .eq("id", inquiryId);

    return logAndReturn({ sent: true, body, needsHuman: true }, 0, null);
  }

  // Matched — reset the miss counter.
  const resetMeta = { ...meta, consecutive_unmatched: 0 };

  if (result.type === "product") {
    const { data: product } = await supabase
      .from("products")
      .select("name, retail_price, install_fee, slug")
      .eq("id", result.product.id)
      .maybeSingle();
    const { data: stockStatus } = await supabase
      .from("product_stock_status")
      .select("status")
      .eq("product_id", result.product.id)
      .maybeSingle();

    if (!product) return logAndReturn({ sent: false, needsHuman: true }, 1, "product_price");

    const STOCK_LABELS: Record<string, string> = {
      in_stock: "In Stock",
      low_stock: "Low Stock",
      out_of_stock: "Out of Stock",
    };
    const stockLabel = STOCK_LABELS[(stockStatus?.status as string) ?? "out_of_stock"] ?? "Out of Stock";

    const template = intents.find((i) => i.key === "product_price")?.responseTemplate ??
      "{{product_name}}: {{product_price}} ({{stock_status}}). See full details: {{product_url}}";

    const body =
      fillTemplate(template, {
        product_name: product.name as string,
        product_price: formatCentavos(centavos(product.retail_price as number)),
        stock_status: stockLabel,
        product_url: `/products/${product.slug}`,
      }) +
      " " +
      FOLLOW_UP_LINE;

    await supabase.from("inquiries").update({ status: "auto_answered", meta: resetMeta }).eq("id", inquiryId);
    return logAndReturn({ sent: true, body, needsHuman: false, matchedIntentKey: "product_price" }, 1, "product_price");
  }

  const intent = intents.find((i) => i.key === result.intentKey)!;
  const body =
    fillTemplate(intent.responseTemplate, {
      business_name: settings.business_name as string,
      address: (settings.address as string) ?? "",
      hours: formatHours(settings.business_hours as Record<string, string> | null),
      booking_url: "/book",
      next_slots: "see /book for live availability",
    }) +
    " " +
    FOLLOW_UP_LINE;

  await supabase
    .from("inquiries")
    .update({ status: intent.requiresHuman ? "needs_human" : "auto_answered", meta: resetMeta })
    .eq("id", inquiryId);
  const matchedIntentRow = intentRows?.find((i) => i.key === result.intentKey) as { hit_count?: number } | undefined;
  await supabase
    .from("autoreply_intents")
    .update({ hit_count: (matchedIntentRow?.hit_count ?? 0) + 1 })
    .eq("key", result.intentKey);

  return logAndReturn(
    { sent: true, body, needsHuman: intent.requiresHuman, matchedIntentKey: result.intentKey },
    result.confidence,
    result.intentKey,
  );
}

function formatHours(hours: Record<string, string> | null): string {
  if (!hours) return "";
  const labels: Record<string, string> = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };
  return Object.entries(hours)
    .map(([day, range]) => `${labels[day] ?? day} ${range}`)
    .join(", ");
}

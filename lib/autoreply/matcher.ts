import { SYNONYMS, type AutoreplyIntent, type ProductLookup } from "@/lib/autoreply/intents";

const CONFIDENCE_THRESHOLD = 0.6;
const DISAMBIGUATION_MARGIN = 0.1;
const PATTERN_WEIGHT = 0.9;

function basicNormalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// §8.1 step 1: lowercase, strip punctuation, collapse whitespace, map Taglish synonyms.
// Synonym mapping only makes sense on the customer's message, not on product names/SKUs.
export function normalize(text: string): string {
  return basicNormalize(text)
    .split(" ")
    .map((word) => SYNONYMS[word] ?? word)
    .join(" ");
}

export type MatchResult =
  | { type: "product"; product: ProductLookup; confidence: 1 }
  | { type: "intent"; intentKey: string; confidence: number }
  | { type: "disambiguation"; options: string[] }
  | { type: "none"; confidence: number };

// §8.1 step 3: an inline SKU or product name always wins outright, preferring
// `product_price` over generic keyword scoring — a customer naming a specific product is
// an unambiguous signal no keyword weighting should override. Matching requires most of
// the product name's tokens to appear (not the full name verbatim — nobody types the full
// catalog name), so "3 inch bi-led fog" matches "3-Inch Bi-LED Projector Fog Light Kit".
function detectProduct(normalizedText: string, products: ProductLookup[]): ProductLookup | null {
  const textTokens = new Set(normalizedText.split(" "));

  for (const product of products) {
    const skuTokens = basicNormalize(product.sku);
    if (skuTokens && normalizedText.includes(skuTokens)) return product;
  }

  for (const product of products) {
    const nameTokens = basicNormalize(product.name)
      .split(" ")
      .filter((t) => t.length > 1);
    if (nameTokens.length === 0) continue;

    const overlap = nameTokens.filter((t) => textTokens.has(t)).length;
    const ratio = overlap / nameTokens.length;
    if (overlap >= Math.min(3, nameTokens.length) && ratio >= 0.5) return product;
  }

  return null;
}

// §8.1 step 2: score every active intent by keyword hits weighted by term rarity (a
// keyword shared across many intents counts for less than one unique to a single intent),
// plus a strong bonus for a regex pattern match. Signals combine as a probabilistic OR
// (1 - product of (1 - weight)) rather than a sum-over-total: a single keyword unique to
// one intent should already be a confident match on its own — real chat messages are
// short and rarely contain more than one trigger phrase, so requiring near-full keyword
// coverage (a plain ratio-of-total formula) would escalate almost everything.
function scoreIntent(normalizedText: string, intent: AutoreplyIntent, keywordRarity: Map<string, number>): number {
  const weights: number[] = [];

  for (const keyword of intent.keywords) {
    if (normalizedText.includes(keyword.toLowerCase())) {
      weights.push(keywordRarity.get(keyword.toLowerCase()) ?? 1);
    }
  }

  for (const pattern of intent.patterns) {
    try {
      if (new RegExp(pattern, "i").test(normalizedText)) {
        weights.push(PATTERN_WEIGHT);
      }
    } catch {
      // Malformed pattern in a seeded/edited intent — skip rather than crash the matcher.
    }
  }

  if (weights.length === 0) return 0;
  return 1 - weights.reduce((product, w) => product * (1 - w), 1);
}

export function matchIntent(
  rawText: string,
  intents: AutoreplyIntent[],
  products: ProductLookup[] = [],
): MatchResult {
  const normalizedText = normalize(rawText);

  const product = detectProduct(normalizedText, products);
  if (product) {
    return { type: "product", product, confidence: 1 };
  }

  const activeIntents = intents.filter((i) => i.keywords.length > 0 || i.patterns.length > 0);
  if (activeIntents.length === 0) return { type: "none", confidence: 0 };

  // Term rarity: keywords shared by fewer intents score higher per hit (inverse of how
  // many active intents contain that exact keyword).
  const keywordIntentCount = new Map<string, number>();
  for (const intent of activeIntents) {
    for (const keyword of intent.keywords) {
      const k = keyword.toLowerCase();
      keywordIntentCount.set(k, (keywordIntentCount.get(k) ?? 0) + 1);
    }
  }
  const keywordRarity = new Map<string, number>();
  for (const [keyword, count] of keywordIntentCount) {
    keywordRarity.set(keyword, 1 / count);
  }

  const scored = activeIntents
    .map((intent) => ({ intent, confidence: scoreIntent(normalizedText, intent, keywordRarity) }))
    .filter((s) => s.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence);

  if (scored.length === 0) return { type: "none", confidence: 0 };

  const [top, second] = scored;

  if (second && top.confidence - second.confidence < DISAMBIGUATION_MARGIN) {
    return { type: "disambiguation", options: [top.intent.key, second.intent.key] };
  }

  if (top.confidence < CONFIDENCE_THRESHOLD) {
    return { type: "none", confidence: top.confidence };
  }

  return { type: "intent", intentKey: top.intent.key, confidence: top.confidence };
}

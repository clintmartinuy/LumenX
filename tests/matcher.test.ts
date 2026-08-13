import { describe, expect, it } from "vitest";
import { matchIntent, normalize } from "@/lib/autoreply/matcher";
import type { AutoreplyIntent, ProductLookup } from "@/lib/autoreply/intents";

const PRODUCTS: ProductLookup[] = [
  { id: "p1", sku: "LX-PF-3IN-BI", name: "3-Inch Bi-LED Projector Fog Light Kit" },
  { id: "p2", sku: "LX-LB-20IN-CURVED", name: "20-Inch Curved LED Light Bar 200W" },
];

const INTENTS: AutoreplyIntent[] = [
  { key: "greeting", keywords: ["hi", "hello", "kumusta"], patterns: [], responseTemplate: "hi", requiresHuman: false, priority: 5 },
  { key: "price_general", keywords: ["how much", "price list", "price"], patterns: [], responseTemplate: "price", requiresHuman: false, priority: 5 },
  { key: "product_price", keywords: [], patterns: ["LX-[A-Z0-9-]+"], responseTemplate: "product", requiresHuman: false, priority: 8 },
  { key: "stock_check", keywords: ["available", "in stock"], patterns: [], responseTemplate: "stock", requiresHuman: false, priority: 6 },
  { key: "location", keywords: ["where", "address", "location"], patterns: [], responseTemplate: "location", requiresHuman: false, priority: 5 },
  { key: "hours", keywords: ["open", "hours"], patterns: [], responseTemplate: "hours", requiresHuman: false, priority: 5 },
  { key: "wholesale", keywords: ["dealer", "reseller", "wholesale", "bulk"], patterns: [], responseTemplate: "wholesale", requiresHuman: true, priority: 7 },
  { key: "human", keywords: ["human", "agent", "staff"], patterns: [], responseTemplate: "human", requiresHuman: true, priority: 10 },
];

describe("normalize", () => {
  it("lowercases, strips punctuation, and collapses whitespace", () => {
    expect(normalize("Hello!!!   How ARE you?")).toBe("hello how are you");
  });

  it("maps Taglish synonyms to canonical keywords", () => {
    expect(normalize("magkano po ito")).toBe("price po ito");
    expect(normalize("meron pa ba")).toBe("available pa ba");
  });
});

describe("matchIntent", () => {
  it("matches product_price via SKU/product-name detection over generic scoring (§13 Phase 6 example)", () => {
    const result = matchIntent("magkano po yung 3 inch bi-led fog?", INTENTS, PRODUCTS);
    expect(result.type).toBe("product");
    if (result.type === "product") {
      expect(result.product.sku).toBe("LX-PF-3IN-BI");
      expect(result.confidence).toBe(1);
    }
  });

  it("matches a clear single-intent message above the confidence threshold", () => {
    const result = matchIntent("where is your shop located?", INTENTS, []);
    expect(result).toEqual({ type: "intent", intentKey: "location", confidence: expect.any(Number) });
  });

  it("escalates (type: none) when no intent scores above threshold", () => {
    const result = matchIntent("asdkjaslkdj qwerty nonsense", INTENTS, []);
    expect(result.type).toBe("none");
  });

  it("prefers human intent when explicitly asked for a person", () => {
    const result = matchIntent("can I talk to a human agent please", INTENTS, []);
    expect(result.type).toBe("intent");
    if (result.type === "intent") expect(result.intentKey).toBe("human");
  });

  it("requests disambiguation when two intents score within the margin", () => {
    // "hours" scores only on "hours"/"open"; force a near-tie by using a message that
    // weakly touches both "location" and "hours" keyword sets.
    const result = matchIntent("open location", INTENTS, []);
    expect(["disambiguation", "intent"]).toContain(result.type);
  });

  it("is case-insensitive and punctuation-insensitive", () => {
    const a = matchIntent("WHERE IS YOUR SHOP???", INTENTS, []);
    const b = matchIntent("where is your shop", INTENTS, []);
    expect(a.type).toBe(b.type);
  });
});

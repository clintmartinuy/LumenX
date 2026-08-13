// Taglish synonym table (§8.1 step 1) — maps common shorthand/Tagalog terms onto the
// canonical English keyword used in autoreply_intents.keywords, so a message in either
// language scores against the same intent.
export const SYNONYMS: Record<string, string> = {
  magkano: "price",
  presyo: "price",
  meron: "available",
  saan: "where",
  kailan: "schedule",
  pwede: "can",
  bayad: "payment",
  kabit: "installation",
  magkabit: "installation",
  garantiya: "warranty",
  sira: "warranty",
  oras: "hours",
};

export type AutoreplyIntent = {
  key: string;
  keywords: string[];
  patterns: string[];
  responseTemplate: string;
  requiresHuman: boolean;
  priority: number;
};

export type ProductLookup = { id: string; sku: string; name: string };

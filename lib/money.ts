// The only module that touches money math. Everything is stored and passed around as
// integer centavos (bigint in Postgres, plain number here — comfortably within
// Number.MAX_SAFE_INTEGER for a single shop's transaction volumes, and what PostgREST
// actually sends over the wire for int8 columns). Never format or parse money elsewhere.

export type Centavos = number & { readonly __brand: "Centavos" };

export function centavos(value: number): Centavos {
  if (!Number.isInteger(value)) {
    throw new Error(`Centavos must be an integer, got ${value}`);
  }
  return value as Centavos;
}

export function pesosToCentavos(pesos: number): Centavos {
  return centavos(Math.round(pesos * 100));
}

export function centavosToPesos(amount: Centavos): number {
  return amount / 100;
}

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

export function formatCentavos(amount: Centavos): string {
  return currencyFormatter.format(centavosToPesos(amount));
}

// Parses a user-entered peso amount ("₱1,500.50", "1500", "-200") into centavos.
export function parsePesosInput(input: string): Centavos {
  const cleaned = input.replace(/[^\d.-]/g, "");
  const pesos = cleaned === "" ? NaN : Number(cleaned);

  if (!Number.isFinite(pesos)) {
    throw new Error(`Cannot parse "${input}" as a peso amount`);
  }

  return pesosToCentavos(pesos);
}

export function addCentavos(...amounts: Centavos[]): Centavos {
  return centavos(amounts.reduce((sum: number, a) => sum + a, 0));
}

export function subtractCentavos(a: Centavos, b: Centavos): Centavos {
  return centavos(a - b);
}

export function multiplyCentavos(amount: Centavos, factor: number): Centavos {
  return centavos(Math.round(amount * factor));
}

// Splits an amount into shares proportional to `weights`, with any leftover centavo(s)
// from flooring assigned one-by-one to the largest-weight shares first — so shares always
// sum exactly to `amount`. Used for freight/cost allocation by value share (§9.3) and
// partner profit-distribution splits (§9.9), where lines must sum exactly to the total.
export function splitByWeight(amount: Centavos, weights: number[]): Centavos[] {
  if (weights.length === 0) return [];

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight <= 0) {
    throw new Error("splitByWeight requires a positive total weight");
  }

  const shares = weights.map((w) => Math.floor((amount * w) / totalWeight));
  const distributed = shares.reduce((sum, s) => sum + s, 0);
  let remainder = amount - distributed;

  const byWeightDesc = weights
    .map((_, i) => i)
    .sort((a, b) => weights[b] - weights[a]);

  for (const i of byWeightDesc) {
    if (remainder <= 0) break;
    shares[i] += 1;
    remainder -= 1;
  }

  return shares.map((s) => centavos(s));
}

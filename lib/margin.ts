import { centavos, type Centavos } from "@/lib/money";

// Single source of truth for the §9.8 margin formulas. Per-sale cogs/gross_profit are
// already computed by generated columns in the sales/sale_items tables (identical
// formula, enforced at the DB level so it can never drift) — this module is for
// aggregating and deriving percentages across many sales for reports.

export function grossMarginPct(grossProfit: Centavos, total: Centavos, taxAmount: Centavos): number {
  const base = total - taxAmount;
  if (base <= 0) return 0;
  return (grossProfit / base) * 100;
}

export function netProfit(totalGrossProfit: Centavos, totalExpenses: Centavos): Centavos {
  return centavos(totalGrossProfit - totalExpenses);
}

export function netMarginPct(netProfitAmount: Centavos, totalRevenue: Centavos): number {
  if (totalRevenue <= 0) return 0;
  return (netProfitAmount / totalRevenue) * 100;
}

export function averageOrderValue(totalRevenue: Centavos, orderCount: number): Centavos {
  if (orderCount <= 0) return centavos(0);
  return centavos(Math.round(totalRevenue / orderCount));
}

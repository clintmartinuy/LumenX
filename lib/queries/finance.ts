import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getCapitalSummary() {
  const supabase = await createClient();

  const [{ data: contributions }, { data: purchaseOrders }, { data: expenses }, { data: stock }, { data: payments }, { data: payouts }] =
    await Promise.all([
      supabase.from("capital_contributions").select("amount"),
      supabase.from("purchase_orders").select("shipping_cost, other_costs, purchase_order_items(line_total)").eq("status", "received"),
      supabase.from("expenses").select("amount"),
      supabase.from("product_stock").select("stock_value, quantity_on_hand"),
      supabase.from("payments").select("amount"),
      supabase.from("partner_payouts").select("amount"),
    ]);

  const totalContributions = (contributions ?? []).reduce((sum, c) => sum + (c.amount as number), 0);

  const totalPurchases = (purchaseOrders ?? []).reduce((sum, po) => {
    const itemsTotal = ((po.purchase_order_items as unknown as { line_total: number }[]) ?? []).reduce(
      (s, i) => s + i.line_total,
      0,
    );
    return sum + itemsTotal + (po.shipping_cost as number) + (po.other_costs as number);
  }, 0);

  const totalExpenses = (expenses ?? []).reduce((sum, e) => sum + (e.amount as number), 0);
  const stockValuation = (stock ?? []).reduce((sum, s) => sum + (s.stock_value as number), 0);
  const totalPayments = (payments ?? []).reduce((sum, p) => sum + (p.amount as number), 0);
  const totalPayouts = (payouts ?? []).reduce((sum, p) => sum + (p.amount as number), 0);

  // Book cash — not a bank reconciliation (§9.7).
  const cashPosition = totalContributions + totalPayments - totalPurchases - totalExpenses - totalPayouts;

  return {
    totalContributions,
    totalPurchases,
    totalExpenses,
    capitalDeployed: totalPurchases + totalExpenses,
    stockValuation,
    cashPosition,
  };
}

export async function getSlowMovers(daysThreshold: number = 60) {
  const supabase = await createClient();
  const cutoff = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: recentSales }, { data: products }] = await Promise.all([
    supabase.from("stock_movements").select("product_id").eq("movement_type", "sale_out").gte("created_at", cutoff),
    supabase.from("products").select("id, name, sku").eq("is_active", true),
  ]);

  const soldRecently = new Set((recentSales ?? []).map((s) => s.product_id as string));
  return (products ?? []).filter((p) => !soldRecently.has(p.id as string));
}

export type DateRange = { start: string; end: string };

export async function getPnlReport(range: DateRange) {
  const supabase = await createClient();

  const [{ data: sales }, { data: expenses }] = await Promise.all([
    supabase
      .from("sales")
      .select("total, tax_amount, cogs_total, gross_profit, pricing_tier, sale_date, customer_id")
      .gte("sale_date", range.start)
      .lte("sale_date", range.end),
    supabase.from("expenses").select("amount").gte("expense_date", range.start.slice(0, 10)).lte("expense_date", range.end.slice(0, 10)),
  ]);

  const revenue = (sales ?? []).reduce((sum, s) => sum + (s.total as number), 0);
  const cogs = (sales ?? []).reduce((sum, s) => sum + (s.cogs_total as number), 0);
  const grossProfit = (sales ?? []).reduce((sum, s) => sum + (s.gross_profit as number), 0);
  const operatingExpenses = (expenses ?? []).reduce((sum, e) => sum + (e.amount as number), 0);
  const taxTotal = (sales ?? []).reduce((sum, s) => sum + (s.tax_amount as number), 0);

  return {
    revenue,
    cogs,
    grossProfit,
    operatingExpenses,
    netProfit: grossProfit - operatingExpenses,
    taxTotal,
    orderCount: sales?.length ?? 0,
    sales: sales ?? [],
  };
}

export async function getSalesByProduct(range: DateRange) {
  const supabase = await createClient();
  const { data: sales } = await supabase.from("sales").select("id").gte("sale_date", range.start).lte("sale_date", range.end);
  const saleIds = (sales ?? []).map((s) => s.id as string);
  if (saleIds.length === 0) return [];

  const { data: items } = await supabase
    .from("sale_items")
    .select("description, item_type, quantity, unit_price, unit_cost, line_total")
    .in("sale_id", saleIds);

  const byProduct = new Map<string, { name: string; units: number; revenue: number; cogs: number }>();
  for (const item of items ?? []) {
    const key = item.description as string;
    const existing = byProduct.get(key) ?? { name: key, units: 0, revenue: 0, cogs: 0 };
    existing.units += item.quantity as number;
    existing.revenue += item.line_total as number;
    existing.cogs += (item.quantity as number) * (item.unit_cost as number);
    byProduct.set(key, existing);
  }

  return [...byProduct.values()]
    .map((p) => ({ ...p, grossProfit: p.revenue - p.cogs, marginPct: p.revenue > 0 ? ((p.revenue - p.cogs) / p.revenue) * 100 : 0 }))
    .sort((a, b) => b.grossProfit - a.grossProfit);
}

export async function getSalesByCustomerType(range: DateRange) {
  const supabase = await createClient();
  const { data: sales } = await supabase
    .from("sales")
    .select("total, cogs_total, pricing_tier")
    .gte("sale_date", range.start)
    .lte("sale_date", range.end);

  const groups: Record<string, { revenue: number; cogs: number; count: number }> = {
    retail: { revenue: 0, cogs: 0, count: 0 },
    wholesale: { revenue: 0, cogs: 0, count: 0 },
  };

  for (const sale of sales ?? []) {
    const tier = sale.pricing_tier as "retail" | "wholesale";
    groups[tier].revenue += sale.total as number;
    groups[tier].cogs += sale.cogs_total as number;
    groups[tier].count += 1;
  }

  return groups;
}

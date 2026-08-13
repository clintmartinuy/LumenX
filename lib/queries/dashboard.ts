import "server-only";
import { createClient } from "@/lib/supabase/server";

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

export async function getDashboardData() {
  const supabase = await createClient();
  const todayStart = startOfToday();
  const monthStart = startOfMonth();

  const [
    { data: todaySales },
    { data: todayBookings },
    { data: newInquiriesToday },
    { data: openInquiries },
    { data: monthSales },
    { data: monthExpenses },
    { data: products },
    { data: stock },
    { data: overdueBookings },
    { data: trendSales },
  ] = await Promise.all([
    supabase.from("sales").select("total").gte("sale_date", todayStart),
    supabase.from("bookings").select("id").gte("scheduled_at", todayStart).lte("scheduled_at", new Date(Date.now() + 86400000).toISOString()),
    supabase.from("inquiries").select("id").gte("created_at", todayStart),
    supabase.from("inquiries").select("id, created_at, status").in("status", ["new", "needs_human"]),
    supabase.from("sales").select("total, cogs_total, tax_amount").gte("sale_date", monthStart),
    supabase.from("expenses").select("amount").gte("expense_date", monthStart.slice(0, 10)),
    supabase.from("products").select("id, name, reorder_point").eq("is_active", true),
    supabase.from("product_stock").select("product_id, quantity_on_hand"),
    supabase.from("bookings").select("id, reference").eq("status", "pending").lt("scheduled_at", todayStart),
    supabase.from("sales").select("sale_date, total").gte("sale_date", new Date(Date.now() - 30 * 86400000).toISOString()),
  ]);

  const todayRevenue = (todaySales ?? []).reduce((s, x) => s + (x.total as number), 0);
  const monthRevenue = (monthSales ?? []).reduce((s, x) => s + (x.total as number), 0);
  const monthCogs = (monthSales ?? []).reduce((s, x) => s + (x.cogs_total as number), 0);
  const monthTax = (monthSales ?? []).reduce((s, x) => s + (x.tax_amount as number), 0);
  const monthGrossProfit = monthRevenue - monthTax - monthCogs;
  const monthExpenseTotal = (monthExpenses ?? []).reduce((s, x) => s + (x.amount as number), 0);
  const monthNetProfit = monthGrossProfit - monthExpenseTotal;
  const monthMarginPct = monthRevenue > 0 ? (monthGrossProfit / (monthRevenue - monthTax)) * 100 : 0;

  const stockByProduct = new Map((stock ?? []).map((s) => [s.product_id as string, s.quantity_on_hand as number]));
  const lowStockProducts = (products ?? []).filter((p) => {
    const qty = stockByProduct.get(p.id as string) ?? 0;
    return qty <= (p.reorder_point as number);
  });

  const oldestOpenInquiry = (openInquiries ?? []).sort(
    (a, b) => new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime(),
  )[0];
  const oldestWaitHours = oldestOpenInquiry
    ? (Date.now() - new Date(oldestOpenInquiry.created_at as string).getTime()) / (1000 * 60 * 60)
    : 0;

  const trendByDay = new Map<string, number>();
  for (const s of trendSales ?? []) {
    const day = (s.sale_date as string).slice(0, 10);
    trendByDay.set(day, (trendByDay.get(day) ?? 0) + (s.total as number));
  }

  return {
    today: {
      salesCount: (todaySales ?? []).length,
      revenue: todayRevenue,
      bookingsCount: (todayBookings ?? []).length,
      newInquiries: (newInquiriesToday ?? []).length,
      awaitingReply: (openInquiries ?? []).length,
      oldestWaitHours,
    },
    month: {
      revenue: monthRevenue,
      grossProfit: monthGrossProfit,
      marginPct: monthMarginPct,
      expenses: monthExpenseTotal,
      netProfit: monthNetProfit,
    },
    alerts: {
      lowStock: lowStockProducts.map((p) => p.name as string),
      overdueBookings: (overdueBookings ?? []).map((b) => b.reference as string),
      staleInquiries: (openInquiries ?? []).filter(
        (i) => Date.now() - new Date(i.created_at as string).getTime() > 2 * 60 * 60 * 1000,
      ).length,
    },
    trend: [...trendByDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, revenue]) => ({ date, revenue })),
  };
}

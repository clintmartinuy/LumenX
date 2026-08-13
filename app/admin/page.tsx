import Link from "next/link";
import { RevenueTrendChart } from "@/components/admin/revenue-trend-chart";
import { getDashboardData } from "@/lib/queries/dashboard";
import { centavos, formatCentavos } from "@/lib/money";

export default async function AdminDashboardPage() {
  const data = await getDashboardData();
  const hasAlerts = data.alerts.lowStock.length > 0 || data.alerts.overdueBookings.length > 0 || data.alerts.staleInquiries > 0;

  return (
    <div className="space-y-8">
      <h1 className="text-lg font-semibold">Dashboard</h1>

      {hasAlerts ? (
        <div className="border-destructive/40 bg-destructive/5 space-y-1 rounded-md border p-4 text-sm">
          <p className="text-destructive font-medium">Alerts</p>
          {data.alerts.lowStock.length > 0 ? (
            <p>
              {data.alerts.lowStock.length} product(s) low/out of stock:{" "}
              <Link href="/admin/inventory?low_stock=1" className="underline">
                {data.alerts.lowStock.slice(0, 3).join(", ")}
                {data.alerts.lowStock.length > 3 ? "..." : ""}
              </Link>
            </p>
          ) : null}
          {data.alerts.overdueBookings.length > 0 ? (
            <p>
              {data.alerts.overdueBookings.length} booking(s) still pending past their scheduled time:{" "}
              <Link href="/admin/bookings?status=pending" className="underline">
                view
              </Link>
            </p>
          ) : null}
          {data.alerts.staleInquiries > 0 ? (
            <p>
              {data.alerts.staleInquiries} inquiry(ies) unanswered for over 2 hours:{" "}
              <Link href="/admin/inquiries?status=needs_human" className="underline">
                view
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      <div>
        <p className="text-muted-foreground mb-2 text-sm font-medium">Today</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Sales" value={String(data.today.salesCount)} />
          <Stat label="Revenue" value={formatCentavos(centavos(data.today.revenue))} />
          <Stat label="Bookings" value={String(data.today.bookingsCount)} />
          <Stat label="New Inquiries" value={String(data.today.newInquiries)} />
        </div>
        {data.today.awaitingReply > 0 ? (
          <p className="text-muted-foreground mt-2 text-xs">
            {data.today.awaitingReply} inquiries awaiting reply — oldest waiting {data.today.oldestWaitHours.toFixed(1)}h
          </p>
        ) : null}
      </div>

      <div>
        <p className="text-muted-foreground mb-2 text-sm font-medium">This month</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Revenue" value={formatCentavos(centavos(data.month.revenue))} />
          <Stat label="Gross Profit" value={`${formatCentavos(centavos(data.month.grossProfit))} (${data.month.marginPct.toFixed(1)}%)`} />
          <Stat label="Expenses" value={formatCentavos(centavos(data.month.expenses))} />
          <Stat label="Net Profit" value={formatCentavos(centavos(data.month.netProfit))} />
        </div>
      </div>

      <div>
        <p className="text-muted-foreground mb-2 text-sm font-medium">30-day revenue</p>
        <div className="rounded-md border p-4">
          <RevenueTrendChart data={data.trend} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-4">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

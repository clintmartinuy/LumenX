import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPnlReport, getSalesByCustomerType, getSalesByProduct } from "@/lib/queries/finance";
import { averageOrderValue, grossMarginPct } from "@/lib/margin";
import { centavos, formatCentavos } from "@/lib/money";

function presetRange(preset: string): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString();
  let start = new Date(now);

  switch (preset) {
    case "7d":
      start.setDate(start.getDate() - 7);
      break;
    case "30d":
      start.setDate(start.getDate() - 30);
      break;
    case "mtd":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "ytd":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }

  return { start: start.toISOString(), end };
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const preset = typeof params.preset === "string" ? params.preset : "30d";
  const range = presetRange(preset);

  const [pnl, byProduct, byCustomerType] = await Promise.all([
    getPnlReport(range),
    getSalesByProduct(range),
    getSalesByCustomerType(range),
  ]);

  const grossMargin = grossMarginPct(centavos(pnl.grossProfit), centavos(pnl.revenue), centavos(pnl.taxTotal));
  const netMargin = pnl.revenue > 0 ? (pnl.netProfit / pnl.revenue) * 100 : 0;
  const aov = averageOrderValue(centavos(pnl.revenue), pnl.orderCount);

  const PRESETS = [
    { key: "7d", label: "7 days" },
    { key: "30d", label: "30 days" },
    { key: "mtd", label: "MTD" },
    { key: "ytd", label: "YTD" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Reports</h1>
        <Button variant="outline" size="sm" render={<a href={`/api/admin/reports/export?preset=${preset}`} />}>
          Export CSV
        </Button>
      </div>

      <div className="flex gap-2">
        {PRESETS.map((p) => (
          <Button key={p.key} size="sm" variant={preset === p.key ? "default" : "outline"} render={<Link href={`/admin/reports?preset=${p.key}`} />}>
            {p.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Revenue", value: formatCentavos(centavos(pnl.revenue)) },
          { label: "Gross Profit", value: `${formatCentavos(centavos(pnl.grossProfit))} (${grossMargin.toFixed(1)}%)` },
          { label: "Net Profit", value: `${formatCentavos(centavos(pnl.netProfit))} (${netMargin.toFixed(1)}%)` },
          { label: "Avg Order Value", value: formatCentavos(aov) },
        ].map((s) => (
          <div key={s.label} className="rounded-md border p-4">
            <p className="text-muted-foreground text-xs">{s.label}</p>
            <p className="text-lg font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">By customer type</p>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(byCustomerType).map(([tier, data]) => (
            <div key={tier} className="rounded-md border p-4 text-sm">
              <p className="font-medium capitalize">{tier}</p>
              <p>Revenue: {formatCentavos(centavos(data.revenue))}</p>
              <p>Margin: {data.revenue > 0 ? (((data.revenue - data.cogs) / data.revenue) * 100).toFixed(1) : "0"}%</p>
              <p className="text-muted-foreground text-xs">{data.count} orders</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">By product</p>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Units</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Gross Profit</TableHead>
                <TableHead className="text-right">Margin %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byProduct.map((p) => (
                <TableRow key={p.name}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell className="text-right">{p.units}</TableCell>
                  <TableCell className="text-right">{formatCentavos(centavos(p.revenue))}</TableCell>
                  <TableCell className="text-right">{formatCentavos(centavos(p.grossProfit))}</TableCell>
                  <TableCell className="text-right">{p.marginPct.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
              {byProduct.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground py-6 text-center">
                    No sales in this period.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

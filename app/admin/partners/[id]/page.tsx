import { notFound } from "next/navigation";
import { PrintButton } from "@/components/admin/print-button";
import { getPartnerStatement } from "@/lib/queries/partners";
import { centavos, formatCentavos } from "@/lib/money";

export default async function PartnerStatementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { partner, contributions, distributionLines, payouts } = await getPartnerStatement(id);
  if (!partner) notFound();

  type Row = { date: string; label: string; amount: number };
  const rows: Row[] = [
    ...contributions.map((c) => ({ date: c.contributed_at as string, label: "Contribution", amount: c.amount as number })),
    ...distributionLines.map((d) => ({
      date: (d.profit_distributions as unknown as { period_end: string })?.period_end ?? "",
      label: "Distribution",
      amount: d.amount as number,
    })),
    ...payouts.map((p) => ({ date: p.paid_at as string, label: "Payout", amount: -(p.amount as number) })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  let running = 0;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{partner.full_name as string} — Statement</h1>
        <PrintButton />
      </div>
      <p className="text-muted-foreground text-sm">Equity: {partner.equity_percent as number}%</p>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="p-2">Date</th>
              <th className="p-2">Type</th>
              <th className="p-2 text-right">Amount</th>
              <th className="p-2 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              running += r.amount;
              return (
                <tr key={i} className="border-b">
                  <td className="p-2">{r.date}</td>
                  <td className="p-2">{r.label}</td>
                  <td className="p-2 text-right">{formatCentavos(centavos(r.amount))}</td>
                  <td className="p-2 text-right">{formatCentavos(centavos(running))}</td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted-foreground p-6 text-center">
                  No transactions yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

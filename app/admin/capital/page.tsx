import { getCapitalSummary, getSlowMovers } from "@/lib/queries/finance";
import { centavos, formatCentavos } from "@/lib/money";

export default async function CapitalPage() {
  const [summary, slowMovers] = await Promise.all([getCapitalSummary(), getSlowMovers()]);
  const recoveryPct = summary.totalContributions > 0 ? (summary.capitalDeployed / summary.totalContributions) * 100 : 0;

  return (
    <div className="space-y-8">
      <h1 className="text-lg font-semibold">Capital Tracker</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Capital Deployed", value: summary.capitalDeployed },
          { label: "Stock Valuation", value: summary.stockValuation },
          { label: "Cash Position (book)", value: summary.cashPosition },
          { label: "Total Contributed", value: summary.totalContributions },
        ].map((stat) => (
          <div key={stat.label} className="rounded-md border p-4">
            <p className="text-muted-foreground text-xs">{stat.label}</p>
            <p className="text-lg font-semibold">{formatCentavos(centavos(stat.value))}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Capital recovery</p>
        <div className="bg-muted h-3 w-full max-w-md overflow-hidden rounded-full">
          <div className="bg-primary h-full" style={{ width: `${Math.min(100, recoveryPct)}%` }} />
        </div>
        <p className="text-muted-foreground mt-1 text-xs">{recoveryPct.toFixed(1)}% of contributed capital deployed into inventory + expenses</p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Slow movers (no sale in 60 days)</p>
        <div className="text-muted-foreground text-sm">
          {slowMovers.length === 0 ? (
            <p>None — everything has moved recently.</p>
          ) : (
            <ul className="list-disc pl-5">
              {slowMovers.map((p) => (
                <li key={p.id as string}>
                  {p.name as string} ({p.sku as string})
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

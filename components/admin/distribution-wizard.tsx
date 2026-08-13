"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { centavos, formatCentavos } from "@/lib/money";
import { finalizeDistribution, previewDistribution } from "@/lib/finance/partner-actions";

type Preview = Awaited<ReturnType<typeof previewDistribution>>;

export function DistributionWizard() {
  const router = useRouter();
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [amountPesos, setAmountPesos] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runPreview() {
    if (!periodStart || !periodEnd) {
      setError("Pick a period.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await previewDistribution(periodStart, periodEnd, Number(amountPesos || 0));
      setPreview(result);
      if (!amountPesos) setAmountPesos((result.pnl.netProfit / 100).toString());
    });
  }

  function finalize() {
    setError(null);
    startTransition(async () => {
      const result = await finalizeDistribution({ periodStart, periodEnd, distributedAmountPesos: Number(amountPesos) });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setPreview(null);
      router.refresh();
    });
  }

  return (
    <div className="max-w-lg space-y-4 rounded-md border p-4">
      <p className="font-semibold">Distribution wizard</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Period start</Label>
          <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Period end</Label>
          <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
        </div>
      </div>
      <Button size="sm" variant="outline" onClick={runPreview} disabled={isPending}>
        Compute period
      </Button>

      {preview ? (
        <div className="space-y-3 border-t pt-3 text-sm">
          <p>Net profit: {formatCentavos(centavos(preview.pnl.netProfit))}</p>
          <div className="space-y-1">
            <Label className="text-xs">Amount to distribute (PHP)</Label>
            <Input value={amountPesos} onChange={(e) => setAmountPesos(e.target.value)} />
          </div>
          <p className="text-muted-foreground text-xs">Retained: {formatCentavos(centavos(preview.retained))}</p>
          <div className="space-y-1">
            {preview.lines.map((l) => (
              <div key={l.partnerId} className="flex justify-between">
                <span>
                  {l.partnerName} ({l.equityPercentSnapshot}%)
                </span>
                <span>{formatCentavos(l.amount)}</span>
              </div>
            ))}
          </div>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <Button size="sm" onClick={finalize} disabled={isPending}>
            {isPending ? "Finalizing..." : "Finalize distribution"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

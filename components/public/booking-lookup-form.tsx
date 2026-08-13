"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { centavos, formatCentavos } from "@/lib/money";
import { lookupBookingAction } from "@/lib/booking/actions";

export function BookingLookupForm({ initialReference }: { initialReference?: string }) {
  const [reference, setReference] = useState(initialReference ?? "");
  const [phoneLast4, setPhoneLast4] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof lookupBookingAction>> | null>(null);

  function onSubmit() {
    setError(null);
    startTransition(async () => {
      const res = await lookupBookingAction({ reference, phoneLast4 });
      if ("error" in res) {
        setError(res.error);
        setResult(null);
        return;
      }
      setResult(res);
    });
  }

  if (result && "success" in result) {
    const b = result.booking;
    return (
      <div className="bg-card space-y-2 rounded-2xl border p-6 text-sm">
        <p className="font-heading text-xl font-bold">{b.reference}</p>
        <p className="capitalize">Status: {b.status.replace("_", " ")}</p>
        <p>Scheduled: {new Date(b.scheduledAt).toLocaleString("en-PH")}</p>
        <p>Services: {b.services.join(", ")}</p>
        <p className="font-semibold">Estimated total: {formatCentavos(centavos(b.estimatedTotal))}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Booking reference</Label>
        <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="BK-20260101-0001" />
      </div>
      <div className="space-y-1">
        <Label>Last 4 digits of your phone</Label>
        <Input value={phoneLast4} maxLength={4} onChange={(e) => setPhoneLast4(e.target.value)} />
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <Button className="rounded-full font-semibold" onClick={onSubmit} disabled={isPending}>
        {isPending ? "Checking..." : "Check status"}
      </Button>
    </div>
  );
}

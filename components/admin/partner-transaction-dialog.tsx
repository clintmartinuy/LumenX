"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addCapitalContribution, recordPayout } from "@/lib/finance/partner-actions";

type Partner = { id: string; full_name: string };

export function PartnerTransactionDialog({ partners, type }: { partners: Partner[]; type: "contribution" | "payout" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [partnerId, setPartnerId] = useState(partners[0]?.id ?? "");
  const [amountPesos, setAmountPesos] = useState("");
  const [method, setMethod] = useState("bank_transfer");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const action = type === "contribution" ? addCapitalContribution : recordPayout;
      const result = await action({ partnerId, amountPesos: Number(amountPesos), method, reference });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setAmountPesos("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        {type === "contribution" ? "Add Contribution" : "Record Payout"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{type === "contribution" ? "Add contribution" : "Record payout"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="txnPartner">Partner</Label>
            <select
              id="txnPartner"
              className="border-input bg-background h-8 w-full rounded-md border px-2 text-sm"
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
            >
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="txnAmount">Amount (PHP)</Label>
            <Input id="txnAmount" value={amountPesos} onChange={(e) => setAmountPesos(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="txnMethod">Method</Label>
            <Input id="txnMethod" value={method} onChange={(e) => setMethod(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="txnReference">Reference (optional)</Label>
            <Input id="txnReference" value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

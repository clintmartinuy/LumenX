"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { receivePurchaseOrder } from "@/lib/inventory/actions";

type Item = {
  id: string;
  productName: string;
  quantityOrdered: number;
  quantityReceived: number;
};

export function ReceivePurchaseOrderForm({ purchaseOrderId, items }: { purchaseOrderId: string; items: Item[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const outstanding = items.filter((i) => i.quantityReceived < i.quantityOrdered);
  if (outstanding.length === 0) {
    return <p className="text-muted-foreground text-sm">All items have been received.</p>;
  }

  const onSubmit = () => {
    setError(null);
    const lines = outstanding
      .map((item) => ({ itemId: item.id, quantityReceivedNow: quantities[item.id] ?? 0 }))
      .filter((l) => l.quantityReceivedNow > 0);

    if (lines.length === 0) {
      setError("Enter a quantity for at least one item.");
      return;
    }

    startTransition(async () => {
      const result = await receivePurchaseOrder({ purchaseOrderId, lines });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="max-w-xl space-y-4">
      {outstanding.map((item) => {
        const remaining = item.quantityOrdered - item.quantityReceived;
        return (
          <div key={item.id} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{item.productName}</p>
              <p className="text-muted-foreground text-xs">
                {item.quantityReceived} of {item.quantityOrdered} received
              </p>
            </div>
            <Input
              type="number"
              min={0}
              max={remaining}
              placeholder="Qty now"
              className="w-28"
              onChange={(e) =>
                setQuantities((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))
              }
            />
          </div>
        );
      })}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <Button onClick={onSubmit} disabled={isPending}>
        {isPending ? "Receiving..." : "Record receipt"}
      </Button>
    </div>
  );
}

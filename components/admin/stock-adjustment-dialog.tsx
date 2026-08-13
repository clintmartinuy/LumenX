"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { adjustStock } from "@/lib/inventory/actions";
import {
  stockAdjustmentSchema,
  type StockAdjustmentFormValues,
  type StockAdjustmentInput,
} from "@/lib/validation/inventory";

const MOVEMENT_LABELS: Record<StockAdjustmentInput["movementType"], string> = {
  adjustment_in: "Adjustment (add stock)",
  adjustment_out: "Adjustment (remove stock)",
  damage_out: "Damaged / written off",
  return_in: "Customer return",
  demo_out: "Demo unit",
};

export function StockAdjustmentDialog({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StockAdjustmentFormValues, unknown, StockAdjustmentInput>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: { productId, movementType: "adjustment_in" },
  });

  const onSubmit = (data: StockAdjustmentInput) => {
    setError(null);
    startTransition(async () => {
      const result = await adjustStock(data);
      if ("error" in result) {
        setError(result.error);
      } else {
        setOpen(false);
        reset({ productId, movementType: "adjustment_in" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>Adjust</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust stock — {productName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <input type="hidden" {...register("productId")} value={productId} />
          <div className="space-y-2">
            <Label htmlFor="movementType">Type</Label>
            <select
              id="movementType"
              className="border-input bg-background h-8 w-full rounded-md border px-2 text-sm"
              {...register("movementType")}
            >
              {Object.entries(MOVEMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input id="quantity" type="number" min={1} {...register("quantity")} />
            {errors.quantity ? <p className="text-destructive text-sm">{errors.quantity.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Input id="reason" {...register("reason")} />
            {errors.reason ? <p className="text-destructive text-sm">{errors.reason.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input id="notes" {...register("notes")} />
          </div>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save adjustment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

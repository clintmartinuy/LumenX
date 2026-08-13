"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPurchaseOrder } from "@/lib/inventory/actions";
import { purchaseOrderSchema, type PurchaseOrderFormValues, type PurchaseOrderInput } from "@/lib/validation/inventory";

type Supplier = { id: string; name: string };
type Product = { id: string; sku: string; name: string };

export function PurchaseOrderForm({ suppliers, products }: { suppliers: Supplier[]; products: Product[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PurchaseOrderFormValues, unknown, PurchaseOrderInput>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      orderDate: new Date().toISOString().slice(0, 10),
      shippingCostPesos: 0,
      otherCostsPesos: 0,
      items: [{ productId: products[0]?.id ?? "", quantityOrdered: 1, unitCostPesos: 0 }],
    },
  });

  const items = useFieldArray({ control, name: "items" });

  const onSubmit = (data: PurchaseOrderInput) => {
    setError(null);
    startTransition(async () => {
      const result = await createPurchaseOrder(data);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.push(`/admin/purchases/${result.id}`);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="supplierId">Supplier</Label>
          <select
            id="supplierId"
            className="border-input bg-background h-8 w-full rounded-md border px-2 text-sm"
            {...register("supplierId")}
          >
            <option value="">Select supplier</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {errors.supplierId ? <p className="text-destructive text-sm">Required</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="orderDate">Order date</Label>
          <Input id="orderDate" type="date" {...register("orderDate")} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Line items</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => items.append({ productId: products[0]?.id ?? "", quantityOrdered: 1, unitCostPesos: 0 })}
          >
            Add line
          </Button>
        </div>
        {items.fields.map((field, i) => (
          <div key={field.id} className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Product</Label>
              <select
                className="border-input bg-background h-8 w-full rounded-md border px-2 text-sm"
                {...register(`items.${i}.productId` as const)}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} — {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24 space-y-1">
              <Label className="text-xs">Qty</Label>
              <Input type="number" min={1} {...register(`items.${i}.quantityOrdered` as const)} />
            </div>
            <div className="w-32 space-y-1">
              <Label className="text-xs">Unit cost (PHP)</Label>
              <Input type="number" step="0.01" {...register(`items.${i}.unitCostPesos` as const)} />
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => items.remove(i)}>
              Remove
            </Button>
          </div>
        ))}
        {errors.items?.message ? <p className="text-destructive text-sm">{errors.items.message}</p> : null}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="shippingCostPesos">Shipping cost (PHP)</Label>
          <Input id="shippingCostPesos" type="number" step="0.01" {...register("shippingCostPesos")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="otherCostsPesos">Other costs (PHP)</Label>
          <Input id="otherCostsPesos" type="number" step="0.01" {...register("otherCostsPesos")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" {...register("notes")} />
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create purchase order"}
      </Button>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { productSchema, type ProductFormValues, type ProductInput } from "@/lib/validation/inventory";
import { upsertProduct, uploadProductImage } from "@/lib/inventory/actions";

type Category = { id: string; name: string };

export function ProductForm({
  productId,
  categories,
  defaultValues,
}: {
  productId: string | null;
  categories: Category[];
  defaultValues?: Partial<ProductFormValues>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues, unknown, ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      specs: [],
      fitments: [],
      isActive: true,
      isFeatured: false,
      warrantyMonths: 6,
      reorderPoint: 3,
      installFeePesos: 0,
      ...defaultValues,
    },
  });

  const specFields = useFieldArray({ control, name: "specs" });
  const fitmentFields = useFieldArray({ control, name: "fitments" });

  const onSubmit = (data: ProductInput) => {
    setError(null);
    startTransition(async () => {
      const result = await upsertProduct(productId, data);
      if ("error" in result) {
        setError(result.error);
        return;
      }

      const file = fileInputRef.current?.files?.[0];
      if (file && result.id) {
        await uploadProductImage(result.id, file);
      }

      router.push("/admin/inventory");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" {...register("sku")} />
          {errors.sku ? <p className="text-destructive text-sm">{errors.sku.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" {...register("slug")} />
          {errors.slug ? <p className="text-destructive text-sm">{errors.slug.message}</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name ? <p className="text-destructive text-sm">{errors.name.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryId">Category</Label>
        <select
          id="categoryId"
          className="border-input bg-background h-8 w-full rounded-md border px-2 text-sm"
          {...register("categoryId")}
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="shortDescription">Short description</Label>
        <Input id="shortDescription" {...register("shortDescription")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (markdown)</Label>
        <textarea
          id="description"
          rows={4}
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          {...register("description")}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="retailPricePesos">Retail (PHP)</Label>
          <Input id="retailPricePesos" type="number" step="0.01" {...register("retailPricePesos")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wholesalePricePesos">Wholesale (PHP)</Label>
          <Input id="wholesalePricePesos" type="number" step="0.01" {...register("wholesalePricePesos")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="installFeePesos">Install fee (PHP)</Label>
          <Input id="installFeePesos" type="number" step="0.01" {...register("installFeePesos")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="warrantyMonths">Warranty (months)</Label>
          <Input id="warrantyMonths" type="number" {...register("warrantyMonths")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reorderPoint">Reorder point</Label>
        <Input id="reorderPoint" type="number" className="max-w-[120px]" {...register("reorderPoint")} />
      </div>

      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <input type="checkbox" {...register("isActive")} /> Active
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" {...register("isFeatured")} /> Featured
        </label>
      </div>

      <div className="space-y-2">
        <Label>Product image</Label>
        <input ref={fileInputRef} type="file" accept="image/*" className="text-sm" />
        <p className="text-muted-foreground text-xs">Uploaded after saving. First image becomes primary.</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Specs</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => specFields.append({ key: "", value: "" })}
          >
            Add spec
          </Button>
        </div>
        {specFields.fields.map((field, i) => (
          <div key={field.id} className="flex gap-2">
            <Input placeholder="key (e.g. wattage)" {...register(`specs.${i}.key` as const)} />
            <Input placeholder="value (e.g. 55W)" {...register(`specs.${i}.value` as const)} />
            <Button type="button" variant="ghost" size="sm" onClick={() => specFields.remove(i)}>
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Vehicle fitments</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fitmentFields.append({ make: "", model: "" })}
          >
            Add fitment
          </Button>
        </div>
        {fitmentFields.fields.length === 0 ? (
          <p className="text-muted-foreground text-xs">None — treated as a universal fit.</p>
        ) : null}
        {fitmentFields.fields.map((field, i) => (
          <div key={field.id} className="flex gap-2">
            <Input placeholder="Make" {...register(`fitments.${i}.make` as const)} />
            <Input placeholder="Model" {...register(`fitments.${i}.model` as const)} />
            <Input
              placeholder="Year from"
              type="number"
              className="max-w-[110px]"
              {...register(`fitments.${i}.yearFrom` as const)}
            />
            <Input
              placeholder="Year to"
              type="number"
              className="max-w-[110px]"
              {...register(`fitments.${i}.yearTo` as const)}
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => fitmentFields.remove(i)}>
              Remove
            </Button>
          </div>
        ))}
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save product"}
      </Button>
    </form>
  );
}

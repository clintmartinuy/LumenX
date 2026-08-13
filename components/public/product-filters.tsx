"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Category = { slug: string; name: string };

export function ProductFilters({
  categories,
  fitmentOptions,
}: {
  categories: Category[];
  fitmentOptions: Record<string, string[]>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [make, setMake] = useState(searchParams.get("make") ?? "");
  const makes = useMemo(() => Object.keys(fitmentOptions).sort(), [fitmentOptions]);
  const models = make ? (fitmentOptions[make] ?? []) : [];

  function update(params: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(params)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    startTransition(() => {
      router.push(`/products?${next.toString()}`);
    });
  }

  return (
    <div className="space-y-6" aria-busy={isPending}>
      <div className="space-y-2">
        <Label>Category</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={!searchParams.get("category") ? "default" : "outline"}
            onClick={() => update({ category: null })}
          >
            All
          </Button>
          {categories.map((c) => (
            <Button
              key={c.slug}
              size="sm"
              variant={searchParams.get("category") === c.slug ? "default" : "outline"}
              onClick={() => update({ category: c.slug })}
            >
              {c.name}
            </Button>
          ))}
        </div>
      </div>

      {makes.length > 0 ? (
        <div className="space-y-2">
          <Label>Will it fit my vehicle?</Label>
          <div className="flex flex-wrap gap-2">
            <select
              className="border-input bg-background h-8 rounded-md border px-2 text-sm"
              value={make}
              onChange={(e) => {
                setMake(e.target.value);
                update({ make: e.target.value || null, model: null });
              }}
            >
              <option value="">Make</option>
              {makes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              className="border-input bg-background h-8 rounded-md border px-2 text-sm"
              value={searchParams.get("model") ?? ""}
              disabled={!make}
              onChange={(e) => update({ model: e.target.value || null })}
            >
              <option value="">Model</option>
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <Input
              type="number"
              placeholder="Year"
              className="h-8 w-24"
              defaultValue={searchParams.get("year") ?? ""}
              onBlur={(e) => update({ year: e.target.value || null })}
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label>Price range (PHP)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            className="h-8"
            defaultValue={searchParams.get("min") ?? ""}
            onBlur={(e) => update({ min: e.target.value || null })}
          />
          <span className="text-muted-foreground text-xs">to</span>
          <Input
            type="number"
            placeholder="Max"
            className="h-8"
            defaultValue={searchParams.get("max") ?? ""}
            onBlur={(e) => update({ max: e.target.value || null })}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={searchParams.get("in_stock") === "1"}
          onChange={(e) => update({ in_stock: e.target.checked ? "1" : null })}
        />
        In stock only
      </label>

      <div className="space-y-2">
        <Label>Sort</Label>
        <select
          className="border-input bg-background h-8 w-full rounded-md border px-2 text-sm"
          value={searchParams.get("sort") ?? "newest"}
          onChange={(e) => update({ sort: e.target.value })}
        >
          <option value="newest">Newest</option>
          <option value="featured">Featured</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>
    </div>
  );
}

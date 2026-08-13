"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

export function InventoryFiltersBar({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(params: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(params)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.push(`/admin/inventory?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Search SKU or name..."
        className="h-8 max-w-xs"
        defaultValue={searchParams.get("q") ?? ""}
        onKeyDown={(e) => {
          if (e.key === "Enter") update({ q: (e.target as HTMLInputElement).value || null });
        }}
        onBlur={(e) => update({ q: e.target.value || null })}
      />
      <select
        className="border-input bg-background h-8 rounded-md border px-2 text-sm"
        value={searchParams.get("category") ?? ""}
        onChange={(e) => update({ category: e.target.value || null })}
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-1.5 text-sm">
        <input
          type="checkbox"
          checked={searchParams.get("low_stock") === "1"}
          onChange={(e) => update({ low_stock: e.target.checked ? "1" : null })}
        />
        Low stock only
      </label>
    </div>
  );
}

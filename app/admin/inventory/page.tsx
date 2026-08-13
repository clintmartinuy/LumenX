import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StockAdjustmentDialog } from "@/components/admin/stock-adjustment-dialog";
import { InventoryFiltersBar } from "@/components/admin/inventory-filters-bar";
import { getCategories, getInventoryList } from "@/lib/queries/inventory";
import { centavos, formatCentavos } from "@/lib/money";

type SearchParams = Record<string, string | string[] | undefined>;

function param(searchParams: SearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

const STATUS_LABEL: Record<string, string> = {
  in_stock: "In Stock",
  low_stock: "Low Stock",
  out_of_stock: "Out of Stock",
};
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  in_stock: "default",
  low_stock: "secondary",
  out_of_stock: "destructive",
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolved = await searchParams;
  const search = param(resolved, "q");
  const categoryId = param(resolved, "category");
  const lowStockOnly = param(resolved, "low_stock") === "1";

  const [items, categories] = await Promise.all([
    getInventoryList({ search, categoryId, lowStockOnly }),
    getCategories(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Inventory</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" render={<a href="/api/admin/inventory/export" />}>
            Export CSV
          </Button>
          <Button size="sm" render={<Link href="/admin/inventory/new" />}>
            New Product
          </Button>
        </div>
      </div>

      <InventoryFiltersBar categories={categories} />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">On Hand</TableHead>
              <TableHead className="text-right">Avg Cost</TableHead>
              <TableHead className="text-right">Stock Value</TableHead>
              <TableHead className="text-right">Retail</TableHead>
              <TableHead className="text-right">Margin %</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id as string}>
                <TableCell className="font-mono text-xs">{item.sku as string}</TableCell>
                <TableCell>
                  <Link href={`/admin/inventory/${item.id}`} className="hover:underline">
                    {item.name as string}
                  </Link>
                </TableCell>
                <TableCell className="text-right">{item.quantityOnHand}</TableCell>
                <TableCell className="text-right">{formatCentavos(centavos(item.averageUnitCost))}</TableCell>
                <TableCell className="text-right">{formatCentavos(centavos(item.stockValue))}</TableCell>
                <TableCell className="text-right">{formatCentavos(centavos(item.retail_price as number))}</TableCell>
                <TableCell className="text-right">{item.marginPct.toFixed(1)}%</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[item.status]}>{STATUS_LABEL[item.status]}</Badge>
                </TableCell>
                <TableCell>
                  <StockAdjustmentDialog productId={item.id as string} productName={item.name as string} />
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-muted-foreground py-8 text-center">
                  No products match those filters.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

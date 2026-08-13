import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCategories, getProductForEdit, getStockMovements } from "@/lib/queries/inventory";
import { centavos, formatCentavos } from "@/lib/money";

const MOVEMENT_LABELS: Record<string, string> = {
  purchase_in: "Purchase received",
  sale_out: "Sale",
  return_in: "Customer return",
  damage_out: "Damaged / written off",
  adjustment_in: "Adjustment (in)",
  adjustment_out: "Adjustment (out)",
  demo_out: "Demo unit",
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, movements] = await Promise.all([
    getProductForEdit(id),
    getCategories(),
    getStockMovements(id),
  ]);

  if (!product) notFound();

  const specs = (product.specs ?? {}) as Record<string, string>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold">{product.name as string}</h1>
        <p className="text-muted-foreground text-xs font-mono">{product.sku as string}</p>
      </div>

      <ProductForm
        productId={id}
        categories={categories}
        defaultValues={{
          sku: product.sku as string,
          name: product.name as string,
          slug: product.slug as string,
          categoryId: (product.category_id as string) ?? "",
          shortDescription: (product.short_description as string) ?? "",
          description: (product.description as string) ?? "",
          specs: Object.entries(specs).map(([key, value]) => ({ key, value: String(value) })),
          retailPricePesos: (product.retail_price as number) / 100,
          wholesalePricePesos: product.wholesale_price ? (product.wholesale_price as number) / 100 : "",
          installFeePesos: (product.install_fee as number) / 100,
          warrantyMonths: product.warranty_months as number,
          reorderPoint: product.reorder_point as number,
          isActive: product.is_active as boolean,
          isFeatured: product.is_featured as boolean,
          fitments: (product.fitments as { make: string; model: string; year_from: number | null; year_to: number | null }[]).map(
            (f) => ({ make: f.make, model: f.model, yearFrom: f.year_from ?? undefined, yearTo: f.year_to ?? undefined }),
          ),
        }}
      />

      <div className="max-w-2xl space-y-2">
        <h2 className="font-semibold">Movement history</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((m) => (
                <TableRow key={m.id as string}>
                  <TableCell>{new Date(m.created_at as string).toLocaleDateString("en-PH")}</TableCell>
                  <TableCell>{MOVEMENT_LABELS[m.movement_type as string] ?? m.movement_type}</TableCell>
                  <TableCell className="text-right">{m.quantity as number}</TableCell>
                  <TableCell className="text-right">
                    {m.unit_cost ? formatCentavos(centavos(m.unit_cost as number)) : "—"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{(m.notes as string) ?? ""}</TableCell>
                </TableRow>
              ))}
              {movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground py-6 text-center">
                    No movements yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

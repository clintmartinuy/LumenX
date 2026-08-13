import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReceivePurchaseOrderForm } from "@/components/admin/receive-purchase-order-form";
import { getPurchaseOrderDetail } from "@/lib/queries/inventory";
import { centavos, formatCentavos } from "@/lib/money";

export default async function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const po = await getPurchaseOrderDetail(id);
  if (!po) notFound();

  const supplier = po.suppliers as unknown as { name: string } | null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{po.po_number as string}</h1>
          <p className="text-muted-foreground text-sm">{supplier?.name}</p>
        </div>
        <Badge>{po.status as string}</Badge>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Ordered</TableHead>
              <TableHead className="text-right">Received</TableHead>
              <TableHead className="text-right">Unit Cost</TableHead>
              <TableHead className="text-right">Line Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {po.items.map((item: Record<string, unknown>) => {
              const product = item.products as unknown as { name: string; sku: string } | null;
              return (
                <TableRow key={item.id as string}>
                  <TableCell>
                    {product?.name} <span className="text-muted-foreground font-mono text-xs">{product?.sku}</span>
                  </TableCell>
                  <TableCell className="text-right">{item.quantity_ordered as number}</TableCell>
                  <TableCell className="text-right">{item.quantity_received as number}</TableCell>
                  <TableCell className="text-right">{formatCentavos(centavos(item.unit_cost as number))}</TableCell>
                  <TableCell className="text-right">{formatCentavos(centavos(item.line_total as number))}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="text-muted-foreground max-w-xl space-y-1 text-sm">
        <p>Shipping: {formatCentavos(centavos(po.shipping_cost as number))}</p>
        <p>Other costs: {formatCentavos(centavos(po.other_costs as number))}</p>
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold">Receive stock</h2>
        <ReceivePurchaseOrderForm
          purchaseOrderId={id}
          items={po.items.map((item: Record<string, unknown>) => ({
            id: item.id as string,
            productName: (item.products as unknown as { name: string })?.name ?? "",
            quantityOrdered: item.quantity_ordered as number,
            quantityReceived: item.quantity_received as number,
          }))}
        />
      </div>
    </div>
  );
}

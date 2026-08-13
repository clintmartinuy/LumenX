import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SupplierDialog } from "@/components/admin/supplier-dialog";
import { getPurchaseOrders, getSuppliers } from "@/lib/queries/inventory";
import { centavos, formatCentavos } from "@/lib/money";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  ordered: "secondary",
  partial: "secondary",
  received: "default",
  cancelled: "destructive",
};

export default async function PurchasesPage() {
  const [orders, suppliers] = await Promise.all([getPurchaseOrders(), getSuppliers()]);

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Purchase Orders</h1>
          <Button size="sm" render={<Link href="/admin/purchases/new" />}>
            New Purchase Order
          </Button>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Freight + Other</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((po) => {
                const supplier = po.suppliers as unknown as { name: string } | null;
                return (
                  <TableRow key={po.id as string}>
                    <TableCell>
                      <Link href={`/admin/purchases/${po.id}`} className="hover:underline">
                        {po.po_number as string}
                      </Link>
                    </TableCell>
                    <TableCell>{supplier?.name ?? "—"}</TableCell>
                    <TableCell>{po.order_date as string}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[po.status as string]}>{po.status as string}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCentavos(centavos((po.shipping_cost as number) + (po.other_costs as number)))}
                    </TableCell>
                  </TableRow>
                );
              })}
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                    No purchase orders yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Suppliers</h2>
          <SupplierDialog />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((s) => (
                <TableRow key={s.id as string}>
                  <TableCell>{s.name as string}</TableCell>
                  <TableCell>{(s.contact_person as string) ?? "—"}</TableCell>
                  <TableCell>{(s.phone as string) ?? "—"}</TableCell>
                  <TableCell>{(s.email as string) ?? "—"}</TableCell>
                </TableRow>
              ))}
              {suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                    No suppliers yet.
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

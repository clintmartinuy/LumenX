import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSales } from "@/lib/queries/pos";
import { centavos, formatCentavos } from "@/lib/money";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  paid: "default",
  partial: "secondary",
  unpaid: "destructive",
};

export default async function SalesPage() {
  const sales = await getSales();

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Sales</h1>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sale #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => {
              const customer = sale.customers as unknown as { full_name: string } | null;
              return (
                <TableRow key={sale.id as string}>
                  <TableCell>
                    <Link href={`/admin/sales/${sale.id}`} className="hover:underline">
                      {sale.sale_number as string}
                    </Link>
                  </TableCell>
                  <TableCell>{customer?.full_name ?? "Walk-in"}</TableCell>
                  <TableCell>{new Date(sale.sale_date as string).toLocaleDateString("en-PH")}</TableCell>
                  <TableCell className="text-right">{formatCentavos(centavos(sale.total as number))}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[sale.payment_status as string]}>{sale.payment_status as string}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
            {sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                  No sales yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

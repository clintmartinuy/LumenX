import { notFound } from "next/navigation";
import { PrintButton } from "@/components/admin/print-button";
import { getSaleDetail } from "@/lib/queries/pos";
import { centavos, formatCentavos } from "@/lib/money";

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sale = await getSaleDetail(id);
  if (!sale) notFound();

  const customer = sale.customers as unknown as { full_name: string; phone: string | null } | null;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{sale.sale_number as string}</h1>
        <PrintButton />
      </div>

      <div className="space-y-1 rounded-md border p-4 text-sm">
        <p className="font-semibold">LumenX PH</p>
        <p className="text-muted-foreground text-xs">Dagupan City, Urdaneta City & Metro Manila</p>
        <p className="text-muted-foreground text-xs">
          {new Date(sale.sale_date as string).toLocaleString("en-PH")}
        </p>
        <p className="text-muted-foreground text-xs">Customer: {customer?.full_name ?? "Walk-in"}</p>

        <div className="divide-border/60 my-3 divide-y border-t border-b py-2">
          {sale.items.map((item: Record<string, unknown>) => (
            <div key={item.id as string} className="flex justify-between py-1">
              <span>
                {item.description as string} × {item.quantity as number}
              </span>
              <span>{formatCentavos(centavos(item.line_total as number))}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCentavos(centavos(sale.subtotal as number))}</span>
          </div>
          {(sale.discount_amount as number) > 0 ? (
            <div className="flex justify-between">
              <span>Discount ({sale.discount_reason as string})</span>
              <span>-{formatCentavos(centavos(sale.discount_amount as number))}</span>
            </div>
          ) : null}
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatCentavos(centavos(sale.total as number))}</span>
          </div>
          <div className="flex justify-between">
            <span>Paid ({sale.payment_method as string})</span>
            <span>{formatCentavos(centavos(sale.amount_paid as number))}</span>
          </div>
          {(sale.balance_due as number) > 0 ? (
            <div className="flex justify-between">
              <span>Balance due</span>
              <span>{formatCentavos(centavos(sale.balance_due as number))}</span>
            </div>
          ) : null}
        </div>

        <p className="text-muted-foreground mt-3 border-t pt-2 text-center text-xs">
          Thank you for choosing LumenX PH! facebook.com/LumenxPH
        </p>
      </div>
    </div>
  );
}

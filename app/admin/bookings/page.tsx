import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookingStatusSelect } from "@/components/admin/booking-status-select";
import { getAllBookings } from "@/lib/queries/admin-booking";
import { centavos, formatCentavos } from "@/lib/money";

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : undefined;
  const bookings = await getAllBookings(status);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Bookings</h1>
        <Button variant="outline" size="sm" render={<Link href="/admin/bookings/capacity" />}>
          Capacity settings
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead className="text-right">Est. Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => {
              const customer = b.customers as unknown as { full_name: string; phone: string | null } | null;
              return (
                <TableRow key={b.id as string}>
                  <TableCell className="font-mono text-xs">{b.reference as string}</TableCell>
                  <TableCell>{customer?.full_name ?? "—"}</TableCell>
                  <TableCell>{new Date(b.scheduled_at as string).toLocaleString("en-PH")}</TableCell>
                  <TableCell className="text-right">{formatCentavos(centavos(b.estimated_total as number))}</TableCell>
                  <TableCell>
                    <BookingStatusSelect bookingId={b.id as string} status={b.status as string} />
                  </TableCell>
                  <TableCell>
                    {!b.sale_id && b.status !== "cancelled" ? (
                      <Link href={`/admin/pos?booking=${b.id}`} className="text-primary text-xs hover:underline">
                        Convert to Sale
                      </Link>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                  No bookings yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

import { PosTerminal } from "@/components/admin/pos/pos-terminal";
import { getPosCatalog } from "@/lib/queries/pos";
import { getCurrentStaffProfile } from "@/lib/auth/roles";
import { getBookingWithDetails } from "@/lib/queries/admin-booking";

export default async function PosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const bookingId = typeof params.booking === "string" ? params.booking : undefined;

  const [{ products, services, categories }, { profile }, booking] = await Promise.all([
    getPosCatalog(),
    getCurrentStaffProfile(),
    bookingId ? getBookingWithDetails(bookingId) : Promise.resolve(null),
  ]);

  const initialBooking = booking
    ? {
        id: booking.id as string,
        customerId: booking.customer_id as string | null,
        customerName: (booking.customers as unknown as { full_name: string } | null)?.full_name ?? null,
        serviceIds: (booking.service_ids as string[]) ?? [],
        productIds: (booking.product_ids as string[]) ?? [],
      }
    : null;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Point of Sale</h1>
      <PosTerminal
        products={products}
        services={services}
        categories={categories}
        role={profile?.role ?? "staff"}
        initialBooking={initialBooking}
      />
    </div>
  );
}

import type { Metadata } from "next";
import { BookingLookupForm } from "@/components/public/booking-lookup-form";

export const metadata: Metadata = {
  title: "Booking Status — LumenX PH",
};

export default async function BookingStatusPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;

  return (
    <main className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <h1 className="font-heading mb-2 text-3xl font-bold tracking-tight">Booking Status</h1>
      <p className="text-muted-foreground mb-8 text-sm">
        Enter your reference and the last 4 digits of your phone number to view your booking.
      </p>
      <BookingLookupForm initialReference={ref} />
    </main>
  );
}

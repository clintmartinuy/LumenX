"use client";

import { useTransition } from "react";
import { updateBookingStatus } from "@/lib/booking/actions";

const STATUSES = ["pending", "confirmed", "in_progress", "completed", "cancelled", "no_show"];

export function BookingStatusSelect({ bookingId, status }: { bookingId: string; status: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      className="border-input bg-background h-7 rounded-md border px-1.5 text-xs disabled:opacity-50"
      value={status}
      disabled={isPending}
      onChange={(e) => {
        const newStatus = e.target.value;
        startTransition(async () => {
          await updateBookingStatus(bookingId, newStatus);
        });
      }}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.replace("_", " ")}
        </option>
      ))}
    </select>
  );
}

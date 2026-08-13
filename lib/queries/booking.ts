import { createPublicClient } from "@/lib/supabase/public";
import type { BookingSlotConfig, ExistingBooking } from "@/lib/booking/availability";

export async function getBookingSlotConfigs(): Promise<BookingSlotConfig[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("booking_slots")
    .select("day_of_week, start_time, end_time, max_concurrent")
    .eq("is_active", true);
  if (error) throw error;
  return (data ?? []).map((s) => ({
    dayOfWeek: s.day_of_week as number,
    startTime: (s.start_time as string).slice(0, 5),
    endTime: (s.end_time as string).slice(0, 5),
    maxConcurrent: s.max_concurrent as number,
  }));
}

export async function getBlackoutDates(): Promise<Set<string>> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("blackout_dates").select("date");
  if (error) throw error;
  return new Set((data ?? []).map((d) => d.date as string));
}

export async function getBookingsInRange(startIso: string, endIso: string): Promise<ExistingBooking[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("scheduled_at, duration_minutes")
    .neq("status", "cancelled")
    .gte("scheduled_at", startIso)
    .lte("scheduled_at", endIso);
  if (error) throw error;
  return (data ?? []).map((b) => ({
    scheduledAt: new Date(b.scheduled_at as string),
    durationMinutes: b.duration_minutes as number,
  }));
}

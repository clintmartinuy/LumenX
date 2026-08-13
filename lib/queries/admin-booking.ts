import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getAllBookings(status?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("bookings")
    .select("id, reference, scheduled_at, duration_minutes, status, estimated_total, source, sale_id, customers(full_name, phone)")
    .order("scheduled_at", { ascending: true });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getBookingSlotsConfig() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("booking_slots")
    .select("*")
    .order("day_of_week");
  if (error) throw error;
  return data ?? [];
}

export async function getBlackoutDatesList() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("blackout_dates").select("*").order("date");
  if (error) throw error;
  return data ?? [];
}

export async function getBookingWithDetails(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, customers(full_name, phone, email), customer_vehicles(make, model, year)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

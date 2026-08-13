"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffProfile } from "@/lib/auth/roles";
import { getBlackoutDates, getBookingSlotConfigs, getBookingsInRange } from "@/lib/queries/booking";
import { getAvailableSlotsForDate, hasAvailability } from "@/lib/booking/availability";
import { findOrCreateCustomer } from "@/lib/inquiries/service";
import {
  bookingLookupSchema,
  bookingWizardSchema,
  type BookingLookupInput,
  type BookingWizardInput,
} from "@/lib/validation/booking";

const STEP_MINUTES = 30;

async function loadAvailabilityContext(durationMinutes: number, rangeDays: number) {
  const now = new Date();
  const rangeEnd = new Date(now.getTime() + rangeDays * 24 * 60 * 60 * 1000);

  const [slotConfigs, blackoutDates, bookings] = await Promise.all([
    getBookingSlotConfigs(),
    getBlackoutDates(),
    getBookingsInRange(now.toISOString(), rangeEnd.toISOString()),
  ]);

  return { slotConfigs, blackoutDates, bookings, now };
}

// Which of the next `rangeDays` days have any open slot — powers the wizard's date picker.
export async function getAvailableDatesAction(durationMinutes: number, rangeDays: number = 30) {
  const { slotConfigs, blackoutDates, bookings, now } = await loadAvailabilityContext(durationMinutes, rangeDays);

  const available: string[] = [];
  for (let i = 0; i < rangeDays; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString().slice(0, 10);

    if (
      hasAvailability(date, slotConfigs, bookings, blackoutDates.has(dateKey), durationMinutes, STEP_MINUTES, now)
    ) {
      available.push(dateKey);
    }
  }
  return available;
}

export async function getAvailableTimesAction(dateKey: string, durationMinutes: number) {
  const { slotConfigs, blackoutDates, bookings, now } = await loadAvailabilityContext(durationMinutes, 1);
  const date = new Date(`${dateKey}T00:00:00`);

  const slots = getAvailableSlotsForDate(
    date,
    slotConfigs,
    bookings,
    blackoutDates.has(dateKey),
    durationMinutes,
    STEP_MINUTES,
    now,
  );
  return slots.map((s) => s.toISOString());
}

// Warn-don't-block fitment check (§6.4 step 2): true if at least one selected product has
// fitment rows and none of them match the entered vehicle. Products with zero fitment
// rows are universal and never trigger a warning.
export async function checkFitmentWarningAction(
  productIds: string[],
  make: string,
  model: string,
  year?: number,
): Promise<boolean> {
  if (productIds.length === 0 || !make) return false;

  const supabase = createAdminClient();
  const { data: fitments } = await supabase
    .from("vehicle_fitments")
    .select("product_id, make, model, year_from, year_to")
    .in("product_id", productIds);

  const byProduct = new Map<string, typeof fitments>();
  for (const f of fitments ?? []) {
    const list = byProduct.get(f.product_id as string) ?? [];
    list.push(f);
    byProduct.set(f.product_id as string, list);
  }

  for (const productId of productIds) {
    const productFitments = byProduct.get(productId);
    if (!productFitments || productFitments.length === 0) continue; // universal

    const matches = productFitments.some((f) => {
      if ((f!.make as string).toLowerCase() !== make.toLowerCase()) return false;
      if (model && (f!.model as string).toLowerCase() !== model.toLowerCase()) return false;
      if (year) {
        if (f!.year_from !== null && year < (f!.year_from as number)) return false;
        if (f!.year_to !== null && year > (f!.year_to as number)) return false;
      }
      return true;
    });

    if (!matches) return true;
  }

  return false;
}

type BookingResult = { error: string } | { success: true; reference: string };

export async function submitBooking(input: BookingWizardInput): Promise<BookingResult> {
  const parsed = bookingWizardSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form and try again." };
  const data = parsed.data;

  const scheduledAt = new Date(data.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime()) || scheduledAt < new Date()) {
    return { error: "Pick a valid, upcoming date and time." };
  }

  const supabase = createAdminClient();

  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select("id, base_price, duration_minutes")
    .in("id", data.serviceIds);
  if (servicesError || !services || services.length !== data.serviceIds.length) {
    return { error: "One or more selected services is no longer available." };
  }

  let productsTotal = 0;
  if (data.productIds.length > 0) {
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, retail_price")
      .in("id", data.productIds);
    if (productsError || !products) return { error: "One or more selected products is no longer available." };
    productsTotal = products.reduce((sum, p) => sum + (p.retail_price as number), 0);
  }

  const durationMinutes = services.reduce((sum, s) => sum + (s.duration_minutes as number), 0);
  const servicesTotal = services.reduce((sum, s) => sum + (s.base_price as number), 0);
  const estimatedTotal = servicesTotal + (data.customerSuppliedParts ? 0 : productsTotal);

  const customerId = await findOrCreateCustomer({
    fullName: data.fullName,
    phone: data.phone,
    email: data.email || undefined,
    source: "website_form",
  });

  const { data: vehicle } = await supabase
    .from("customer_vehicles")
    .insert({ customer_id: customerId, make: data.vehicleMake, model: data.vehicleModel, year: data.vehicleYear ?? null, plate_number: data.plateNumber || null })
    .select("id")
    .single();

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      customer_id: customerId,
      vehicle_id: vehicle?.id ?? null,
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: durationMinutes,
      status: "pending",
      service_ids: data.serviceIds,
      product_ids: data.customerSuppliedParts ? [] : data.productIds,
      customer_supplied_parts: data.customerSuppliedParts,
      estimated_total: estimatedTotal,
      notes: data.notes || null,
      source: "website",
    })
    .select("reference")
    .single();

  if (bookingError) return { error: "Could not create booking: " + bookingError.message };

  revalidatePath("/admin/bookings");
  return { success: true, reference: booking.reference as string };
}

type LookupResult =
  | { error: string }
  | {
      success: true;
      booking: {
        reference: string;
        status: string;
        scheduledAt: string;
        estimatedTotal: number;
        services: string[];
      };
    };

export async function lookupBookingAction(input: BookingLookupInput): Promise<LookupResult> {
  const parsed = bookingLookupSchema.safeParse(input);
  if (!parsed.success) return { error: "Enter a valid reference and phone digits." };

  const supabase = createAdminClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("reference, status, scheduled_at, estimated_total, service_ids, customer_id")
    .eq("reference", parsed.data.reference)
    .maybeSingle();

  if (!booking) return { error: "Booking not found." };

  const { data: customer } = await supabase
    .from("customers")
    .select("phone")
    .eq("id", booking.customer_id)
    .maybeSingle();

  if (!customer?.phone || !(customer.phone as string).endsWith(parsed.data.phoneLast4)) {
    return { error: "Reference and phone digits don't match." };
  }

  const { data: services } = await supabase.from("services").select("name").in("id", booking.service_ids as string[]);

  return {
    success: true,
    booking: {
      reference: booking.reference as string,
      status: booking.status as string,
      scheduledAt: booking.scheduled_at as string,
      estimatedTotal: booking.estimated_total as number,
      services: (services ?? []).map((s) => s.name as string),
    },
  };
}

export async function updateBookingStatus(bookingId: string, status: string): Promise<{ error: string } | { success: true }> {
  const { profile } = await getCurrentStaffProfile();
  if (!profile) return { error: "You don't have permission to do that." };

  const supabase = await createClient();
  const { error } = await supabase.from("bookings").update({ status }).eq("id", bookingId);
  if (error) return { error: error.message };

  revalidatePath("/admin/bookings");
  return { success: true };
}

export async function upsertBookingSlot(input: {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxConcurrent: number;
}): Promise<{ error: string } | { success: true }> {
  const { profile } = await getCurrentStaffProfile();
  if (!profile) return { error: "You don't have permission to do that." };

  const supabase = await createClient();
  const row = {
    day_of_week: input.dayOfWeek,
    start_time: input.startTime,
    end_time: input.endTime,
    max_concurrent: input.maxConcurrent,
  };

  const { error } = input.id
    ? await supabase.from("booking_slots").update(row).eq("id", input.id)
    : await supabase.from("booking_slots").insert(row);
  if (error) return { error: error.message };

  revalidatePath("/admin/bookings/capacity");
  return { success: true };
}

export async function deleteBookingSlot(id: string): Promise<{ error: string } | { success: true }> {
  const { profile } = await getCurrentStaffProfile();
  if (!profile) return { error: "You don't have permission to do that." };

  const supabase = await createClient();
  const { error } = await supabase.from("booking_slots").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/bookings/capacity");
  return { success: true };
}

export async function addBlackoutDate(date: string, reason: string): Promise<{ error: string } | { success: true }> {
  const { profile } = await getCurrentStaffProfile();
  if (!profile) return { error: "You don't have permission to do that." };

  const supabase = await createClient();
  const { error } = await supabase.from("blackout_dates").insert({ date, reason: reason || null });
  if (error) return { error: error.message };

  revalidatePath("/admin/bookings/capacity");
  return { success: true };
}

export async function removeBlackoutDate(id: string): Promise<{ error: string } | { success: true }> {
  const { profile } = await getCurrentStaffProfile();
  if (!profile) return { error: "You don't have permission to do that." };

  const supabase = await createClient();
  const { error } = await supabase.from("blackout_dates").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/bookings/capacity");
  return { success: true };
}

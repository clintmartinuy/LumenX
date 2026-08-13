import { describe, expect, it } from "vitest";
import { getAvailableSlotsForDate, hasAvailability } from "@/lib/booking/availability";
import type { BookingSlotConfig, ExistingBooking } from "@/lib/booking/availability";

// A Wednesday, well in the future relative to any "now" used in these tests.
const WEDNESDAY = new Date(2026, 5, 3); // June 3, 2026 is a Wednesday
const EARLY_NOW = new Date(2026, 4, 1); // well before WEDNESDAY

const WEEKDAY_SLOT: BookingSlotConfig = {
  dayOfWeek: 3, // Wednesday
  startTime: "09:00",
  endTime: "11:00",
  maxConcurrent: 1,
};

describe("getAvailableSlotsForDate", () => {
  it("returns empty when no slot config matches the day of week", () => {
    const slots = getAvailableSlotsForDate(WEDNESDAY, [{ ...WEEKDAY_SLOT, dayOfWeek: 1 }], [], false, 60, 30, EARLY_NOW);
    expect(slots).toEqual([]);
  });

  it("returns empty when the date is blacked out", () => {
    const slots = getAvailableSlotsForDate(WEDNESDAY, [WEEKDAY_SLOT], [], true, 60, 30, EARLY_NOW);
    expect(slots).toEqual([]);
  });

  it("generates candidate start times in step increments that fit the job duration", () => {
    // 09:00-11:00 window, 60-minute job, 30-minute steps -> 09:00, 09:30, 10:00 (10:30+60=11:30 > 11:00, excluded)
    const slots = getAvailableSlotsForDate(WEDNESDAY, [WEEKDAY_SLOT], [], false, 60, 30, EARLY_NOW);
    expect(slots.map((s) => s.getHours() * 60 + s.getMinutes())).toEqual([9 * 60, 9 * 60 + 30, 10 * 60]);
  });

  it("excludes a candidate once max_concurrent overlapping bookings exist", () => {
    const existing: ExistingBooking[] = [{ scheduledAt: new Date(2026, 5, 3, 9, 0), durationMinutes: 60 }];
    const slots = getAvailableSlotsForDate(WEDNESDAY, [WEEKDAY_SLOT], existing, false, 60, 30, EARLY_NOW);
    // 09:00 and 09:30 both overlap the existing 09:00-10:00 booking and maxConcurrent is 1.
    expect(slots.some((s) => s.getHours() === 9 && s.getMinutes() === 0)).toBe(false);
    expect(slots.some((s) => s.getHours() === 9 && s.getMinutes() === 30)).toBe(false);
    // 10:00 does not overlap.
    expect(slots.some((s) => s.getHours() === 10 && s.getMinutes() === 0)).toBe(true);
  });

  it("allows overlapping bookings up to max_concurrent", () => {
    const existing: ExistingBooking[] = [{ scheduledAt: new Date(2026, 5, 3, 9, 0), durationMinutes: 60 }];
    const slots = getAvailableSlotsForDate(
      WEDNESDAY,
      [{ ...WEEKDAY_SLOT, maxConcurrent: 2 }],
      existing,
      false,
      60,
      30,
      EARLY_NOW,
    );
    expect(slots.some((s) => s.getHours() === 9 && s.getMinutes() === 0)).toBe(true);
  });

  it("never offers a slot in the past", () => {
    const now = new Date(2026, 5, 3, 9, 45); // 9:45 AM on the booking day itself
    const slots = getAvailableSlotsForDate(WEDNESDAY, [WEEKDAY_SLOT], [], false, 60, 30, now);
    expect(slots.every((s) => s.getTime() > now.getTime())).toBe(true);
    expect(slots.some((s) => s.getHours() === 9 && s.getMinutes() === 0)).toBe(false);
  });
});

describe("hasAvailability", () => {
  it("is false for a fully booked slot (matches §13 Phase 5: disappears from availability)", () => {
    const existing: ExistingBooking[] = [{ scheduledAt: new Date(2026, 5, 3, 9, 0), durationMinutes: 120 }];
    // Only one config window (09:00-11:00), maxConcurrent 1, and a 120-min booking covers the whole window.
    expect(hasAvailability(WEDNESDAY, [WEEKDAY_SLOT], existing, false, 60, 30, EARLY_NOW)).toBe(false);
  });

  it("is true when at least one candidate slot is open", () => {
    expect(hasAvailability(WEDNESDAY, [WEEKDAY_SLOT], [], false, 60, 30, EARLY_NOW)).toBe(true);
  });
});

// Pure availability calculation — no I/O, so it's fully unit-testable. Callers (Server
// Components/Actions) fetch booking_slots/bookings/blackout_dates and pass them in.

export type BookingSlotConfig = {
  dayOfWeek: number; // 0 (Sun) .. 6 (Sat)
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  maxConcurrent: number;
};

export type ExistingBooking = {
  scheduledAt: Date;
  durationMinutes: number;
};

function parseTimeOnDate(date: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const result = new Date(date);
  result.setHours(h, m, 0, 0);
  return result;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

// Returns available start times for `date`, generated in `stepMinutes` increments across
// every matching booking_slots window, for a job lasting `durationMinutes`. A candidate
// start time is available only if fewer than max_concurrent existing (non-cancelled)
// bookings overlap it — and never in the past.
export function getAvailableSlotsForDate(
  date: Date,
  slotConfigs: BookingSlotConfig[],
  existingBookings: ExistingBooking[],
  isBlackedOut: boolean,
  durationMinutes: number,
  stepMinutes: number = 30,
  now: Date = new Date(),
): Date[] {
  if (isBlackedOut) return [];

  const dayOfWeek = date.getDay();
  const configs = slotConfigs.filter((c) => c.dayOfWeek === dayOfWeek);
  if (configs.length === 0) return [];

  const results: Date[] = [];

  for (const config of configs) {
    const windowStart = parseTimeOnDate(date, config.startTime);
    const windowEnd = parseTimeOnDate(date, config.endTime);

    for (
      let candidateStart = new Date(windowStart);
      candidateStart.getTime() + durationMinutes * 60_000 <= windowEnd.getTime();
      candidateStart = new Date(candidateStart.getTime() + stepMinutes * 60_000)
    ) {
      if (candidateStart <= now) continue;

      const candidateEnd = new Date(candidateStart.getTime() + durationMinutes * 60_000);

      const overlappingCount = existingBookings.filter((b) =>
        overlaps(candidateStart, candidateEnd, b.scheduledAt, new Date(b.scheduledAt.getTime() + b.durationMinutes * 60_000)),
      ).length;

      if (overlappingCount < config.maxConcurrent) {
        results.push(new Date(candidateStart));
      }
    }
  }

  return results.sort((a, b) => a.getTime() - b.getTime());
}

// Whether `date` has at least one available start time — used to gray out the date
// picker (§6.4: "a date picker showing only dates with free capacity").
export function hasAvailability(
  date: Date,
  slotConfigs: BookingSlotConfig[],
  existingBookings: ExistingBooking[],
  isBlackedOut: boolean,
  durationMinutes: number,
  stepMinutes: number = 30,
  now: Date = new Date(),
): boolean {
  return (
    getAvailableSlotsForDate(date, slotConfigs, existingBookings, isBlackedOut, durationMinutes, stepMinutes, now)
      .length > 0
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addBlackoutDate,
  deleteBookingSlot,
  removeBlackoutDate,
  upsertBookingSlot,
} from "@/lib/booking/actions";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Slot = { id: string; day_of_week: number; start_time: string; end_time: string; max_concurrent: number };
type Blackout = { id: string; date: string; reason: string | null };

export function CapacityEditor({ slots, blackoutDates }: { slots: Slot[]; blackoutDates: Blackout[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newSlot, setNewSlot] = useState({ dayOfWeek: "1", startTime: "09:00", endTime: "18:00", maxConcurrent: "1" });
  const [newBlackout, setNewBlackout] = useState({ date: "", reason: "" });

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <h2 className="font-semibold">Weekly capacity</h2>
        <div className="space-y-2">
          {slots.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
              <span>
                {DAYS[s.day_of_week]} {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)} · {s.max_concurrent} concurrent
              </span>
              <button
                className="text-destructive text-xs"
                onClick={() => startTransition(async () => {
                  await deleteBookingSlot(s.id);
                  router.refresh();
                })}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <select
            className="border-input bg-background h-8 rounded-md border px-2 text-sm"
            value={newSlot.dayOfWeek}
            onChange={(e) => setNewSlot((s) => ({ ...s, dayOfWeek: e.target.value }))}
          >
            {DAYS.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
          <Input type="time" className="w-28" value={newSlot.startTime} onChange={(e) => setNewSlot((s) => ({ ...s, startTime: e.target.value }))} />
          <Input type="time" className="w-28" value={newSlot.endTime} onChange={(e) => setNewSlot((s) => ({ ...s, endTime: e.target.value }))} />
          <Input
            type="number"
            className="w-20"
            placeholder="Max"
            value={newSlot.maxConcurrent}
            onChange={(e) => setNewSlot((s) => ({ ...s, maxConcurrent: e.target.value }))}
          />
          <Button
            size="sm"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await upsertBookingSlot({
                  dayOfWeek: Number(newSlot.dayOfWeek),
                  startTime: newSlot.startTime,
                  endTime: newSlot.endTime,
                  maxConcurrent: Number(newSlot.maxConcurrent),
                });
                router.refresh();
              })
            }
          >
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold">Blackout dates</h2>
        <div className="space-y-2">
          {blackoutDates.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
              <span>
                {b.date} {b.reason ? `— ${b.reason}` : ""}
              </span>
              <button
                className="text-destructive text-xs"
                onClick={() => startTransition(async () => {
                  await removeBlackoutDate(b.id);
                  router.refresh();
                })}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Input type="date" value={newBlackout.date} onChange={(e) => setNewBlackout((b) => ({ ...b, date: e.target.value }))} />
          <Input placeholder="Reason" value={newBlackout.reason} onChange={(e) => setNewBlackout((b) => ({ ...b, reason: e.target.value }))} />
          <Button
            size="sm"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await addBlackoutDate(newBlackout.date, newBlackout.reason);
                router.refresh();
              })
            }
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}

import { CapacityEditor } from "@/components/admin/capacity-editor";
import { getBlackoutDatesList, getBookingSlotsConfig } from "@/lib/queries/admin-booking";

type Slot = { id: string; day_of_week: number; start_time: string; end_time: string; max_concurrent: number };
type Blackout = { id: string; date: string; reason: string | null };

export default async function CapacityPage() {
  const [slots, blackoutDates] = await Promise.all([getBookingSlotsConfig(), getBlackoutDatesList()]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Booking Capacity</h1>
      <CapacityEditor
        slots={slots as unknown as Slot[]}
        blackoutDates={blackoutDates as unknown as Blackout[]}
      />
    </div>
  );
}

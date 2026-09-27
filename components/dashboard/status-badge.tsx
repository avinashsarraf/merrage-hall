import { DotBadge } from "@/components/ui/badge";
import { BOOKING_STATUS_META } from "@/lib/constants";

export function BookingStatusBadge({ status }: { status: string }) {
  const meta = BOOKING_STATUS_META[status] ?? BOOKING_STATUS_META.PENDING;
  return (
    <DotBadge dot={meta.dot} className={meta.badge}>
      {meta.label}
    </DotBadge>
  );
}

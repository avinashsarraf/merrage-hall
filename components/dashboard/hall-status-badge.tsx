import { DotBadge } from "@/components/ui/badge";
import { HALL_STATUS_META } from "@/lib/constants";

export function HallStatusBadge({ status }: { status: string }) {
  const meta = HALL_STATUS_META[status] ?? HALL_STATUS_META.PENDING;
  return (
    <DotBadge dot={meta.dot} className={meta.badge}>
      {meta.label}
    </DotBadge>
  );
}

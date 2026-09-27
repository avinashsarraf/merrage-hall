import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "./card";

const tones = {
  brand: { chip: "bg-brand-50 text-brand-700 ring-brand-100" },
  gold: { chip: "bg-gold-50 text-gold-700 ring-gold-200" },
  emerald: { chip: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
  sky: { chip: "bg-sky-50 text-sky-600 ring-sky-100" },
  violet: { chip: "bg-violet-50 text-violet-600 ring-violet-100" },
  rose: { chip: "bg-rose-50 text-rose-600 ring-rose-100" },
};

export function StatCard({
  icon,
  label,
  value,
  sub,
  tone = "brand",
  className,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">{label}</p>
          <p className="mt-1.5 truncate font-display text-2xl font-bold text-stone-900">{value}</p>
          {sub ? <div className="mt-1 truncate text-xs text-stone-500">{sub}</div> : null}
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1", tones[tone].chip)}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

"use client";

import { cn } from "@/lib/utils";

export type TabItem = { id: string; label: string; count?: number };

export function Tabs({
  items,
  active,
  onChange,
  className,
}: {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex max-w-full flex-wrap items-center gap-1 rounded-xl bg-stone-100/80 p-1", className)}>
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all",
            active === t.id
              ? "bg-white text-brand-800 shadow-sm ring-1 ring-stone-200/70"
              : "text-stone-500 hover:text-stone-800"
          )}
        >
          {t.label}
          {typeof t.count === "number" ? (
            <span
              className={cn(
                "rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums",
                active === t.id ? "bg-brand-100 text-brand-700" : "bg-stone-200/80 text-stone-500"
              )}
            >
              {t.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

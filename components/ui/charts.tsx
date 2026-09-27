import { cn } from "@/lib/utils";

export type BarDatum = { label: string; value: number };

/** Lightweight CSS bar chart (server-renderable). */
export function BarChart({
  data,
  formatValue,
  className,
  barClassName,
  emptyLabel = "No data yet",
}: {
  data: BarDatum[];
  formatValue?: (n: number) => string;
  className?: string;
  barClassName?: string;
  emptyLabel?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const fmt = formatValue ?? ((n: number) => String(n));
  const hasData = data.some((d) => d.value > 0);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex h-44 items-end gap-1.5 sm:gap-3">
        {data.map((d) => (
          <div key={d.label} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
            <span
              className={cn(
                "text-[10px] font-semibold tabular-nums transition-opacity",
                d.value > 0 ? "text-stone-500 opacity-0 group-hover:opacity-100" : "text-transparent"
              )}
            >
              {fmt(d.value)}
            </span>
            <div
              title={`${d.label}: ${fmt(d.value)}`}
              style={{ height: `${Math.max(d.value > 0 ? 4 : 2, (d.value / max) * 100)}%` }}
              className={cn(
                "w-full rounded-t-lg transition-all duration-300",
                d.value > 0
                  ? barClassName ?? "bg-gradient-to-t from-brand-800 to-brand-500 group-hover:from-brand-900 group-hover:to-brand-600"
                  : "bg-stone-100"
              )}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-3">
        {data.map((d) => (
          <span key={d.label} className="min-w-0 flex-1 truncate text-center text-[10px] font-medium uppercase tracking-wide text-stone-400">
            {d.label}
          </span>
        ))}
      </div>
      {!hasData ? (
        <p className="mt-3 text-center text-xs text-stone-400">{emptyLabel}</p>
      ) : null}
    </div>
  );
}

export type DonutSegment = { label: string; value: number; color: string };

/** SVG donut chart with legend (server-renderable). */
export function DonutChart({
  segments,
  centerLabel,
  centerSub,
  className,
}: {
  segments: DonutSegment[];
  centerLabel?: string;
  centerSub?: string;
  className?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const R = 56;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-6", className)}>
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <circle cx="70" cy="70" r={R} fill="none" stroke="#eef2f8" strokeWidth="17" />
          {total > 0 &&
            segments
              .filter((s) => s.value > 0)
              .map((s) => {
                const frac = s.value / total;
                const el = (
                  <circle
                    key={s.label}
                    cx="70"
                    cy="70"
                    r={R}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="17"
                    strokeLinecap="butt"
                    strokeDasharray={`${frac * C} ${C}`}
                    strokeDashoffset={-offset * C}
                  />
                );
                offset += frac;
                return el;
              })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold text-stone-900">{centerLabel ?? total}</span>
          {centerSub ? <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400">{centerSub}</span> : null}
        </div>
      </div>
      <ul className="min-w-36 space-y-2">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2.5 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-stone-600">{s.label}</span>
            <span className="ml-auto pl-3 font-semibold tabular-nums text-stone-800">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

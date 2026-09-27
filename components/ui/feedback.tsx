import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div style={style} className={cn("animate-pulse rounded-xl bg-stone-200/70", className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-16", className)}>
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-700" />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      {icon ? (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          {icon}
        </div>
      ) : null}
      <h3 className="font-display text-lg font-semibold text-stone-900">{title}</h3>
      {description ? <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-stone-500">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

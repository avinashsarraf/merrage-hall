import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl bg-white ring-1 ring-stone-200/80 shadow-soft", className)}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  sub,
  action,
  className,
  bordered,
}: {
  title: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
  className?: string;
  bordered?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 px-5 py-4",
        bordered && "border-b border-stone-100",
        className
      )}
    >
      <div className="min-w-0">
        <h3 className="truncate font-display text-base font-semibold text-stone-900">{title}</h3>
        {sub ? <p className="mt-0.5 text-xs text-stone-500">{sub}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

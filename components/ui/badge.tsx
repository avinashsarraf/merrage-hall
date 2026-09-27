import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, children, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function DotBadge({
  dot,
  className,
  children,
}: {
  dot: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Badge className={className}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {children}
    </Badge>
  );
}

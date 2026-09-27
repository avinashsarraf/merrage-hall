import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-900 shadow-sm",
        className
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[62%] w-[62%]">
        <circle cx="9.4" cy="14.6" r="4.3" stroke="#f7cfdd" strokeWidth="1.9" />
        <circle cx="14.6" cy="14.6" r="4.3" stroke="#e4c75b" strokeWidth="1.9" />
        <path d="M12 4.6l1.05 2.1 2.1.3-1.53 1.47.37 2.08L12 9.44l-1.99 1.11.37-2.08L8.85 7l2.1-.3z" fill="#e4c75b" />
      </svg>
    </span>
  );
}

export function Logo({
  href = "/",
  dark = false,
  className,
  markClassName,
}: {
  href?: string;
  dark?: boolean;
  className?: string;
  markClassName?: string;
}) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)}>
      <LogoMark className={cn("h-9 w-9", markClassName)} />
      <span
        className={cn(
          "font-display text-xl font-bold tracking-tight",
          dark ? "text-white" : "text-stone-900"
        )}
      >
        Merrage<span className="text-gold-500">Hall</span>
      </span>
    </Link>
  );
}

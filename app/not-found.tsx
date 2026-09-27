import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream-100 px-6 text-center">
      <Logo />
      <p className="mt-10 font-display text-7xl font-bold text-brand-800">404</p>
      <h1 className="mt-3 font-display text-2xl font-semibold text-stone-900">This aisle leads nowhere</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-stone-500">
        The page you're looking for was moved, deleted, or never existed — like a wedding without sweets.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className={buttonClasses("primary", "md")}>
          Back to home
        </Link>
        <Link href="/halls" className={buttonClasses("secondary", "md")}>
          Browse venues
        </Link>
      </div>
    </div>
  );
}

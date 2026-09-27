"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { buttonClasses } from "@/components/ui/button";

export function SiteHeader({ signedIn, isAdmin }: { signedIn: boolean; isAdmin?: boolean }) {
  const [open, setOpen] = useState(false);
  const dashboardHref = isAdmin ? "/dashboard/admin" : "/dashboard";

  const links = (
    <>
      <Link href="/halls" className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:text-brand-800" onClick={() => setOpen(false)}>
        Browse venues
      </Link>
      <Link href="/pricing" className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:text-brand-800" onClick={() => setOpen(false)}>
        For venues
      </Link>
      <Link href="/#how-it-works" className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:text-brand-800" onClick={() => setOpen(false)}>
        How it works
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/60 bg-cream-50/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">{links}</nav>
        </div>
        <div className="hidden items-center gap-2.5 md:flex">
          {signedIn ? (
            <Link href={dashboardHref} className={buttonClasses("primary", "sm")}>
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className={buttonClasses("secondary", "sm")}>
                Log in
              </Link>
              <Link href="/register?mode=owner" className={buttonClasses("primary", "sm")}>
                List your venue
              </Link>
            </>
          )}
        </div>
        <button
          className="rounded-xl p-2 text-stone-600 transition hover:bg-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open ? (
        <div className="animate-fade-in border-t border-stone-200/60 bg-cream-50 px-4 py-4 md:hidden">
          <nav className="flex flex-col">{links}</nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-stone-200 pt-3">
            {signedIn ? (
              <Link href={dashboardHref} className={buttonClasses("primary", "md")} onClick={() => setOpen(false)}>
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className={buttonClasses("secondary", "md")} onClick={() => setOpen(false)}>
                  Log in
                </Link>
                <Link href="/register?mode=owner" className={buttonClasses("primary", "md")} onClick={() => setOpen(false)}>
                  List your venue
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}

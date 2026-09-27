"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  Calendar,
  CalendarDays,
  ChevronDown,
  CreditCard,
  ExternalLink,
  Globe,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  User,
  Users,
  UtensilsCrossed,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { Logo } from "@/components/ui/logo";
import { HALL_STATUS_META, ROLE_LABELS } from "@/lib/constants";
import { cn, initials } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };
type NavGroup = { title: string; items: NavItem[] };

const OWNER_NAV: NavGroup[] = [
  {
    title: "Manage",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/bookings", label: "Bookings", icon: CalendarDays },
      { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
    ],
  },
  {
    title: "Venue",
    items: [
      { href: "/dashboard/menu", label: "Menu & Packages", icon: UtensilsCrossed },
      { href: "/dashboard/addons", label: "Add-ons", icon: Sparkles },
      { href: "/dashboard/staff", label: "Staff", icon: Users },
      { href: "/dashboard/hall", label: "Venue Profile", icon: Building2 },
      { href: "/dashboard/domains", label: "Domains & Site", icon: Globe },
      { href: "/dashboard/subscription", label: "Subscription", icon: CreditCard },
    ],
  },
  {
    title: "Account",
    items: [{ href: "/dashboard/profile", label: "My Profile", icon: User }],
  },
];

const STAFF_NAV: NavGroup[] = [
  {
    title: "Operations",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/bookings", label: "Bookings", icon: CalendarDays },
      { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
    ],
  },
  {
    title: "Venue",
    items: [
      { href: "/dashboard/menu", label: "Menu & Packages", icon: UtensilsCrossed },
      { href: "/dashboard/addons", label: "Add-ons", icon: Sparkles },
    ],
  },
  {
    title: "Account",
    items: [{ href: "/dashboard/profile", label: "My Profile", icon: User }],
  },
];

const ADMIN_NAV: NavGroup[] = [
  {
    title: "Platform",
    items: [
      { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/admin/halls", label: "Venues", icon: Building2 },
      { href: "/dashboard/admin/plans", label: "Plans", icon: Layers },
      { href: "/dashboard/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
      { href: "/dashboard/admin/payments", label: "Payments", icon: Wallet },
      { href: "/dashboard/admin/settings", label: "Settings", icon: Settings },
    ],
  },
  {
    title: "Account",
    items: [{ href: "/dashboard/profile", label: "My Profile", icon: User }],
  },
];

const CUSTOMER_NAV: NavGroup[] = [
  {
    title: "My Events",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/bookings", label: "My Bookings", icon: CalendarDays },
    ],
  },
  {
    title: "Discover",
    items: [
      { href: "/halls", label: "Browse Venues", icon: Search },
      { href: "/pricing", label: "Venue Plans", icon: CreditCard },
    ],
  },
  {
    title: "Account",
    items: [{ href: "/dashboard/profile", label: "My Profile", icon: User }],
  },
];

const NAV_BY_ROLE: Record<string, NavGroup[]> = {
  HALL_OWNER: OWNER_NAV,
  HALL_STAFF: STAFF_NAV,
  SUPER_ADMIN: ADMIN_NAV,
  CUSTOMER: CUSTOMER_NAV,
};

export type ShellUser = { name: string; email: string; role: string };
export type ShellHall = { name: string; slug: string; status: string; city: string } | null;

export function DashboardShell({
  user,
  hall,
  children,
}: {
  user: ShellUser;
  hall: ShellHall;
  children: ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const nav = NAV_BY_ROLE[user.role] ?? CUSTOMER_NAV;

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const currentItem = nav.flatMap((g) => g.items).find((i) => isActive(i));

  const title =
    user.role === "SUPER_ADMIN"
      ? "Platform Administration"
      : hall
        ? hall.name
        : "Dashboard";
  const sub =
    currentItem?.label ?? (user.role === "SUPER_ADMIN" ? "MerrageHall control tower" : "Wedding venue operations");

  const sidebar = (
    <>
      <div className="flex h-16 shrink-0 items-center border-b border-stone-100 px-5">
        <Logo />
      </div>
      {hall ? (
        <div className="px-4 pt-4">
          <div className="rounded-2xl bg-gradient-to-br from-brand-800 to-brand-950 p-4 text-white shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-display text-sm font-semibold">{hall.name}</p>
              <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", hall.status === "ACTIVE" ? "bg-emerald-400/20 text-emerald-200" : hall.status === "PENDING" ? "bg-amber-400/20 text-amber-200" : "bg-rose-400/20 text-rose-200")}>
                {HALL_STATUS_META[hall.status]?.label ?? hall.status}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-brand-100/80">{hall.city}</p>
            <Link
              href={`/halls/${hall.slug}`}
              target="_blank"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] font-medium text-gold-200 transition hover:bg-white/20"
            >
              <ExternalLink className="h-3 w-3" />
              View public site
            </Link>
          </div>
        </div>
      ) : null}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {nav.map((group) => (
          <div key={group.title}>
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setNavOpen(false)}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-brand-50 font-semibold text-brand-800 ring-1 ring-brand-100"
                          : "font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-900"
                      )}
                    >
                      <item.icon className={cn("h-[18px] w-[18px]", active ? "text-brand-700" : "text-stone-400 group-hover:text-stone-600")} />
                      {item.label}
                      {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold-500" /> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="shrink-0 border-t border-stone-100 px-5 py-4">
        <p className="text-[10px] font-medium uppercase tracking-widest text-stone-300">MerrageHall v1.0</p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-cream-100">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-stone-200/70 bg-white lg:flex">
        {sidebar}
      </aside>

      {/* mobile drawer */}
      {navOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-brand-950/45 backdrop-blur-[2px]" onClick={() => setNavOpen(false)} />
          <aside className="relative flex h-full w-72 max-w-[85%] animate-fade-in flex-col bg-white shadow-lift">
            <button
              onClick={() => setNavOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-stone-400 hover:bg-stone-100"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-stone-200/60 bg-cream-100/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-2 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setNavOpen(true)}
              className="rounded-xl p-2 text-stone-500 transition hover:bg-white hover:text-stone-800 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[15px] font-semibold leading-tight text-stone-900">{title}</p>
              <p className="truncate text-[11px] text-stone-500">{sub}</p>
            </div>

            {hall ? (
              <Link
                href={`/halls/${hall.slug}`}
                target="_blank"
                className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-700 transition hover:bg-brand-50 sm:inline-flex"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View site
              </Link>
            ) : null}

            <button className="relative hidden rounded-xl p-2 text-stone-400 transition hover:bg-white hover:text-stone-700 sm:block" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-gold-500 ring-2 ring-cream-100" />
            </button>

            {/* user menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 rounded-xl p-1.5 transition hover:bg-white/80"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-700 to-brand-900 text-[11px] font-bold text-white">
                  {initials(user.name)}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block max-w-28 truncate text-[13px] font-semibold leading-tight text-stone-800">{user.name}</span>
                  <span className="block text-[10px] text-stone-400">{ROLE_LABELS[user.role] ?? user.role}</span>
                </span>
                <ChevronDown className="hidden h-4 w-4 text-stone-400 sm:block" />
              </button>
              {menuOpen ? (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-60 animate-fade-up overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-stone-200">
                    <div className="border-b border-stone-100 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-stone-800">{user.name}</p>
                      <p className="truncate text-xs text-stone-400">{user.email}</p>
                    </div>
                    <div className="p-1.5">
                      <Link
                        href="/dashboard/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-stone-600 transition hover:bg-stone-50"
                      >
                        <User className="h-4 w-4 text-stone-400" />
                        My profile
                      </Link>
                      {hall ? (
                        <Link
                          href={`/halls/${hall.slug}`}
                          target="_blank"
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-stone-600 transition hover:bg-stone-50"
                        >
                          <ExternalLink className="h-4 w-4 text-stone-400" />
                          Venue page
                        </Link>
                      ) : (
                        <Link
                          href="/halls"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-stone-600 transition hover:bg-stone-50"
                        >
                          <Search className="h-4 w-4 text-stone-400" />
                          Browse venues
                        </Link>
                      )}
                      <form action={logout}>
                        <button
                          type="submit"
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Log out
                        </button>
                      </form>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {hall && hall.status !== "ACTIVE" ? (
            <div
              className={cn(
                "px-4 py-2 text-center text-xs font-medium sm:px-6 lg:px-8",
                hall.status === "PENDING"
                  ? "bg-amber-50 text-amber-800"
                  : "bg-rose-50 text-rose-800"
              )}
            >
              {hall.status === "PENDING"
                ? "Your venue is pending platform approval — complete your profile while you wait."
                : "Your venue is suspended — settle your subscription to go live again."}
            </div>
          ) : null}
        </header>

        <main className="mx-auto w-full max-w-[1440px] animate-fade-in px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

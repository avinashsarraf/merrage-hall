import Link from "next/link";
import { CalendarDays, IndianRupee, PartyPopper, Search, Ticket } from "lucide-react";
import { getCustomerOverview } from "@/lib/queries";
import { dateKey, formatDate, formatINR } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat";
import { Card, CardHeader } from "@/components/ui/card";
import { buttonClasses } from "@/components/ui/button";
import { MyBookings, type MyBooking } from "./my-bookings";
import { BookingStatusBadge } from "./status-badge";

export async function CustomerHome({ userId, name }: { userId: string; name: string }) {
  const data = await getCustomerOverview(userId);
  const todayK = dateKey(new Date());
  const next = data.upcoming[0];

  const rows: MyBooking[] = data.all.slice(0, 4).map((b) => ({
    id: b.id,
    hallName: b.hall.name,
    hallCity: b.hall.city,
    hallSlug: b.hall.slug,
    hallImage: b.hall.images[0] ?? null,
    eventType: b.eventType,
    eventDate: b.eventDate,
    slot: b.slot,
    guestCount: b.guestCount,
    menuPackageName: b.menuPackageName,
    totalAmount: b.totalAmount,
    paidAmount: b.paidAmount,
    status: b.status,
  }));

  const daysToNext = next ? Math.round((new Date(`${next.eventDate}T00:00:00`).getTime() - new Date(`${todayK}T00:00:00`).getTime()) / 86400000) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900 sm:text-[1.7rem]">
            Hello, {name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-stone-500">Counting down to the big day?</p>
        </div>
        <Link href="/halls" className={buttonClasses("primary", "md")}>
          <Search className="h-4 w-4" /> Browse venues
        </Link>
      </div>

      {/* next event hero */}
      {next ? (
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-6 bg-gradient-to-r from-brand-800 to-brand-950 px-6 py-6 text-white sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <span className="text-[10px] font-bold uppercase tracking-wide text-gold-300">
                {new Date(`${next.eventDate}T00:00:00`).toLocaleString("en-IN", { month: "short" })}
              </span>
              <span className="font-display text-2xl font-bold leading-none">{new Date(`${next.eventDate}T00:00:00`).getDate()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gold-300">
                {daysToNext === 0 ? "Today is the day!" : daysToNext === 1 ? "Tomorrow" : `In ${daysToNext} days`}
              </p>
              <p className="mt-1 truncate font-display text-xl font-bold">
                {next.eventType} at {next.hall.name}
              </p>
              <p className="mt-0.5 text-sm text-brand-100/75">
                {formatDate(next.eventDate)} · {next.guestCount.toLocaleString("en-IN")} guests · {next.menuPackageName || "Venue only"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <BookingStatusBadge status={next.status} />
            </div>
          </div>
        </Card>
      ) : null}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<CalendarDays className="h-5 w-5" />} label="Upcoming events" value={data.upcoming.length} sub="confirmed & pending" tone="brand" />
        <StatCard icon={<Ticket className="h-5 w-5" />} label="Total bookings" value={data.all.length} sub="lifetime with MerrageHall" tone="violet" />
        <StatCard icon={<IndianRupee className="h-5 w-5" />} label="Amount paid" value={formatINR(data.spent)} sub="across all bookings" tone="emerald" />
      </div>

      {/* bookings */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-stone-900">Your bookings</h2>
          <Link href="/dashboard/bookings" className="text-xs font-semibold text-brand-700 hover:underline">
            View all
          </Link>
        </div>
        {data.all.length === 0 ? (
          <Card className="flex flex-col items-center px-6 py-14 text-center">
            <PartyPopper className="h-10 w-10 text-gold-400" />
            <h3 className="mt-4 font-display text-lg font-semibold text-stone-900">No bookings yet</h3>
            <p className="mt-1.5 max-w-sm text-sm text-stone-500">
              Browse verified venues with transparent per-plate pricing and book your date in minutes.
            </p>
            <Link href="/halls" className={`mt-5 ${buttonClasses("primary", "md")}`}>
              <Search className="h-4 w-4" /> Find a venue
            </Link>
          </Card>
        ) : (
          <MyBookings bookings={rows} />
        )}
      </div>
    </div>
  );
}

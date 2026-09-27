import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarRange } from "lucide-react";
import { getHallForUser, requireUser } from "@/lib/auth";
import { getCalendarBookings } from "@/lib/queries";
import { BOOKING_STATUS_META } from "@/lib/constants";
import { cn, dateKey } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { buttonClasses } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Calendar" };

type SP = Promise<Record<string, string | string[] | undefined>>;

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function CalendarPage({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  if (user.role === "SUPER_ADMIN") redirect("/dashboard/admin");

  const sp = await searchParams;
  const monthParam = typeof sp.month === "string" ? sp.month : "";
  const base = /^\d{4}-\d{2}$/.test(monthParam)
    ? new Date(Number(monthParam.slice(0, 4)), Number(monthParam.slice(5, 7)) - 1, 1)
    : new Date();
  const y = base.getFullYear();
  const m0 = base.getMonth();
  const monthTitle = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(base);
  const todayK = dateKey(new Date());

  const daysInMonth = new Date(y, m0 + 1, 0).getDate();
  const from = dateKey(new Date(y, m0, 1));
  const to = dateKey(new Date(y, m0, daysInMonth));

  const isManager = user.role === "HALL_OWNER" || user.role === "HALL_STAFF";
  const hall = isManager ? await getHallForUser(user) : null;

  const bookings = await getCalendarBookings(
    hall ? { hallId: hall.id, from, to } : { userId: user.id, from, to }
  );

  const byDay = new Map<string, typeof bookings>();
  for (const b of bookings) {
    const list = byDay.get(b.eventDate) ?? [];
    list.push(b);
    byDay.set(b.eventDate, list);
  }

  const prevMonth = dateKey(new Date(y, m0 - 1, 1)).slice(0, 7);
  const nextMonth = dateKey(new Date(y, m0 + 1, 1)).slice(0, 7);

  // build grid (Monday-first)
  const firstWeekday = (new Date(y, m0, 1).getDay() + 6) % 7;
  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => dateKey(new Date(y, m0, i + 1))),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthBookingCount = bookings.filter((b) => b.status !== "CANCELLED").length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900">Booking calendar</h1>
          <p className="mt-1 text-sm text-stone-500">
            {hall ? `${hall.name} · ` : ""}{monthBookingCount} event{monthBookingCount === 1 ? "" : "s"} in {monthTitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/calendar?month=${prevMonth}`} className={buttonClasses("secondary", "icon")} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link href="/dashboard/calendar" className={buttonClasses("secondary", "sm")}>
            Today
          </Link>
          <Link href={`/dashboard/calendar?month=${nextMonth}`} className={buttonClasses("secondary", "icon")} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <Card className="overflow-hidden p-3 sm:p-5">
        <p className="mb-3 text-center font-display text-lg font-bold text-stone-900 sm:hidden">{monthTitle}</p>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {WEEKDAYS.map((d) => (
            <div key={d} className="pb-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-stone-400 sm:text-[11px]">
              <span className="hidden sm:inline">{d}</span>
              <span className="sm:hidden">{d[0]}</span>
            </div>
          ))}
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="min-h-16 rounded-lg bg-stone-50/50 sm:min-h-24" />;
            const dayBookings = byDay.get(day) ?? [];
            const isToday = day === todayK;
            const dayNum = Number(day.slice(8, 10));
            const weekend = i % 7 >= 5;
            return (
              <div
                key={day}
                className={cn(
                  "min-h-16 rounded-lg border p-1 sm:min-h-24 sm:p-1.5",
                  isToday ? "border-brand-400 bg-brand-50/50 ring-1 ring-brand-300" : weekend ? "border-stone-100 bg-cream-50/60" : "border-stone-100 bg-white"
                )}
              >
                <p className={cn("px-0.5 text-[11px] font-semibold sm:text-xs", isToday ? "text-brand-800" : "text-stone-400")}>
                  {dayNum}
                </p>
                <div className="mt-0.5 space-y-0.5">
                  {dayBookings.slice(0, 2).map((b) => {
                    const meta = BOOKING_STATUS_META[b.status] ?? BOOKING_STATUS_META.PENDING;
                    return (
                      <Link
                        key={b.id}
                        href={`/dashboard/bookings/${b.id}`}
                        title={`${b.eventType} · ${b.customerName}`}
                        className={cn("block truncate rounded px-1 py-0.5 text-[9px] font-semibold leading-tight transition hover:opacity-80 sm:text-[10px]", b.status === "CANCELLED" ? "bg-stone-100 text-stone-400 line-through" : meta.badge)}
                      >
                        <span className={cn("mr-1 inline-block h-1 w-1 rounded-full align-middle", b.status === "CANCELLED" ? "bg-stone-300" : meta.dot)} />
                        {b.eventType}
                      </Link>
                    );
                  })}
                  {dayBookings.length > 2 ? (
                    <p className="px-1 text-[9px] font-bold text-stone-400">+{dayBookings.length - 2} more</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-stone-500">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Pending</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Confirmed</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-500" /> Completed</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-stone-400" /> Cancelled</span>
        <span className="ml-auto hidden items-center gap-1.5 sm:flex">
          <CalendarRange className="h-3.5 w-3.5 text-brand-400" /> Today is highlighted
        </span>
      </div>
    </div>
  );
}

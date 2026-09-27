import Link from "next/link";
import {
  ArrowUpRight,
  Banknote,
  CalendarDays,
  CalendarRange,
  IndianRupee,
  LayoutDashboard,
  Percent,
  Plus,
  Wallet,
} from "lucide-react";
import { getHallOverview } from "@/lib/queries";
import type { HallWithPlan } from "@/lib/auth";
import { formatDate, formatCompactINR, formatINR } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat";
import { Card, CardHeader } from "@/components/ui/card";
import { BarChart, DonutChart } from "@/components/ui/charts";
import { Button, buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { BookingStatusBadge } from "./status-badge";

export async function HallOverview({ hall, isStaff }: { hall: HallWithPlan; isStaff: boolean }) {
  const data = await getHallOverview(hall.id);
  const firstName = hall.name;

  const upcomingList = (
    <div className="divide-y divide-stone-50">
      {data.upcoming.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title="No upcoming events"
          description="New requests and confirmed bookings will appear here."
          action={
            <Link href="/dashboard/bookings" className={buttonClasses("primary", "sm")}>
              <Plus className="h-4 w-4" /> Add booking
            </Link>
          }
        />
      ) : (
        data.upcoming.map((b) => (
          <Link
            key={b.id}
            href={`/dashboard/bookings/${b.id}`}
            className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-brand-50/30"
          >
            <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 ring-1 ring-brand-100">
              <span className="text-[9px] font-bold uppercase text-brand-400">
                {new Date(`${b.eventDate}T00:00:00`).toLocaleString("en-IN", { month: "short" })}
              </span>
              <span className="text-sm font-bold leading-none text-brand-800">
                {new Date(`${b.eventDate}T00:00:00`).getDate()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-stone-800">
                {b.eventType} · {b.customerName}
              </p>
              <p className="truncate text-xs text-stone-400">
                {b.guestCount.toLocaleString("en-IN")} guests · {b.menuPackageName || "Venue only"}
                {b.source === "WEBSITE" ? " · via website" : ""}
              </p>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold tabular-nums text-stone-800">{formatCompactINR(b.totalAmount)}</p>
              <BookingStatusBadge status={b.status} />
            </div>
          </Link>
        ))
      )}
    </div>
  );

  const statusSegments = [
    { label: "Pending", value: data.statusCounts.PENDING ?? 0, color: "#f59e0b" },
    { label: "Confirmed", value: data.statusCounts.CONFIRMED ?? 0, color: "#10b981" },
    { label: "Completed", value: data.statusCounts.COMPLETED ?? 0, color: "#0ea5e9" },
    { label: "Cancelled", value: data.statusCounts.CANCELLED ?? 0, color: "#a8a29e" },
  ];

  return (
    <div className="space-y-6">
      {/* heading */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900 sm:text-[1.7rem]">
            {isStaff ? "Venue operations" : `Managing ${firstName}`}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {hall.subscription ? ` · ${hall.subscription.plan.name} plan` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/calendar" className={buttonClasses("secondary", "md")}>
            <CalendarRange className="h-4 w-4" /> Calendar
          </Link>
          <Link href="/dashboard/bookings" className={buttonClasses("primary", "md")}>
            <Plus className="h-4 w-4" /> New booking
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<CalendarDays className="h-5 w-5" />} label="Pending requests" value={data.pendingCount} sub="awaiting your confirmation" tone="gold" />
        <StatCard icon={<LayoutDashboard className="h-5 w-5" />} label="Upcoming events" value={data.upcomingCount} sub="next 6 shown below" tone="brand" />
        <StatCard icon={<IndianRupee className="h-5 w-5" />} label="Revenue this month" value={formatCompactINR(data.monthRevenue)} sub={`${data.totalBookings} bookings all-time`} tone="emerald" />
        <StatCard icon={<Percent className="h-5 w-5" />} label="Occupancy" value={`${data.occupancyPct}%`} sub="event days this month" tone="violet" />
      </div>

      {/* charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Event revenue" sub="Confirmed & completed events · last 6 months" bordered />
          <div className="p-5">
            <BarChart data={data.months.map((m) => ({ label: m.label, value: m.total }))} formatValue={(n) => formatCompactINR(n)} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Bookings by status" sub="All-time" bordered />
          <div className="p-5">
            <DonutChart segments={statusSegments} centerLabel={String(data.totalBookings)} centerSub="total" />
          </div>
        </Card>
      </div>

      {/* lists */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader
            title="Upcoming events"
            sub="Requests & confirmed bookings"
            action={
              <Link href="/dashboard/bookings" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
            bordered
          />
          {upcomingList}
        </Card>

        <Card className="overflow-hidden">
          <CardHeader title="Recent payments" bordered />
          <div className="divide-y divide-stone-50">
            {data.recentPayments.length === 0 ? (
              <EmptyState icon={<Wallet className="h-6 w-6" />} title="No payments yet" description="Record advances & settlements from booking pages." className="py-10" />
            ) : (
              data.recentPayments.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${p.type === "COMMISSION" ? "bg-gold-50 text-gold-600 ring-gold-200" : p.type === "SUBSCRIPTION" ? "bg-violet-50 text-violet-500 ring-violet-100" : "bg-emerald-50 text-emerald-600 ring-emerald-100"}`}>
                    {p.type === "COMMISSION" ? <Percent className="h-4 w-4" /> : p.type === "SUBSCRIPTION" ? <Banknote className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-stone-800">
                      {p.type === "COMMISSION" ? "Platform commission" : p.type === "SUBSCRIPTION" ? "Subscription" : p.description || "Booking payment"}
                    </p>
                    <p className="text-[11px] text-stone-400">{formatDate(p.createdAt)} · {p.method}</p>
                  </div>
                  <p className={`shrink-0 text-sm font-bold tabular-nums ${p.status === "PAID" ? "text-emerald-600" : "text-amber-600"}`}>
                    {formatINR(p.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

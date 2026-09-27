import Link from "next/link";
import {
  ArrowUpRight,
  Banknote,
  Building2,
  CalendarDays,
  IndianRupee,
  Percent,
  Ticket,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminOverview } from "@/lib/queries";
import { formatCompactINR, formatDate, formatINR } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat";
import { Card, CardHeader } from "@/components/ui/card";
import { BarChart, DonutChart } from "@/components/ui/charts";
import { BookingStatusBadge } from "@/components/dashboard/status-badge";
import { HallStatusBadge } from "@/components/dashboard/hall-status-badge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Platform overview" };

export default async function AdminOverviewPage() {
  await requireAdmin();
  const data = await getAdminOverview();

  const revenueSeries = data.months.map((m) => ({
    label: m.label,
    value: m.subscriptions + m.commission,
  }));
  const mrrAnnual = data.mrr * 12;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-stone-900 sm:text-[1.7rem]">Platform overview</h1>
        <p className="mt-1 text-sm text-stone-500">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Building2 className="h-5 w-5" />}
          label="Venues onboard"
          value={data.totalHalls}
          sub={`${data.hallCounts.ACTIVE ?? 0} active · ${data.hallCounts.PENDING ?? 0} pending · ${data.hallCounts.SUSPENDED ?? 0} suspended`}
          tone="brand"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="MRR"
          value={formatCompactINR(data.mrr)}
          sub={`${formatCompactINR(mrrAnnual)} annualised`}
          tone="emerald"
        />
        <StatCard
          icon={<IndianRupee className="h-5 w-5" />}
          label="GMV this month"
          value={formatCompactINR(data.gmv)}
          sub="confirmed & completed events"
          tone="sky"
        />
        <StatCard
          icon={<Percent className="h-5 w-5" />}
          label="Commission earned"
          value={formatCompactINR(data.commissionMonth)}
          sub="this month"
          tone="gold"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<UserRound className="h-5 w-5" />} label="Customers" value={data.customers} sub="registered booking clients" tone="violet" />
        <StatCard icon={<Ticket className="h-5 w-5" />} label="Bookings (6 mo)" value={data.totalBookings} sub="across all venues" tone="brand" />
      </div>

      {/* charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Platform revenue" sub="Subscriptions + commission · last 6 months" bordered />
          <div className="p-5">
            <BarChart data={revenueSeries} formatValue={(n) => formatCompactINR(n)} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Venues by status" bordered />
          <div className="p-5">
            <DonutChart
              segments={[
                { label: "Active", value: data.hallCounts.ACTIVE ?? 0, color: "#10b981" },
                { label: "Pending", value: data.hallCounts.PENDING ?? 0, color: "#f59e0b" },
                { label: "Suspended", value: data.hallCounts.SUSPENDED ?? 0, color: "#f43f5e" },
              ]}
              centerLabel={String(data.totalHalls)}
              centerSub="venues"
            />
          </div>
        </Card>
      </div>

      {/* lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader
            title="Newest venues"
            action={
              <Link href="/dashboard/admin/halls" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
                Manage all <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
            bordered
          />
          <div className="divide-y divide-stone-50">
            {data.recentHalls.map((h) => (
              <div key={h.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-stone-800">{h.name}</p>
                  <p className="text-xs text-stone-400">
                    {h.city} · {h.ownerName} · joined {formatDate(h.createdAt)}
                  </p>
                </div>
                <HallStatusBadge status={h.status} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            title="Latest bookings"
            action={
              <Link href="/dashboard/admin/payments" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
                Payments <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
            bordered
          />
          <div className="divide-y divide-stone-50">
            {data.recentBookings.map((b) => (
              <div key={b.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-stone-800">
                    {b.eventType} · {b.customerName}
                  </p>
                  <p className="truncate text-xs text-stone-400">
                    <CalendarDays className="mr-1 inline h-3 w-3" />
                    {formatDate(b.eventDate)} · {b.hallName} · {formatCompactINR(b.totalAmount)}
                  </p>
                </div>
                <BookingStatusBadge status={b.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-brand-800 to-brand-950 p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Banknote className="h-8 w-8 text-gold-400" />
            <div>
              <p className="font-display text-lg font-bold">Revenue split this month</p>
              <p className="text-sm text-brand-100/75">
                Subscriptions {formatINR(data.months[data.months.length - 1]?.subscriptions ?? 0)} + commission{" "}
                {formatINR(data.months[data.months.length - 1]?.commission ?? 0)}
              </p>
            </div>
          </div>
          <Link href="/dashboard/admin/payments" className="inline-flex h-10 items-center gap-2 rounded-xl bg-gold-500 px-4 text-sm font-bold text-gold-950 transition hover:bg-gold-400">
            Open ledger <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </Card>
    </div>
  );
}

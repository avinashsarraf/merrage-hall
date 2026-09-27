import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getAdminPayments } from "@/lib/queries";
import { PAYMENT_TYPE_META } from "@/lib/constants";
import { cn, formatDate, formatINR } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { Wallet } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payments" };

type SP = Promise<Record<string, string | string[] | undefined>>;

const TYPES = [
  { id: "ALL", label: "All" },
  { id: "SUBSCRIPTION", label: "Subscriptions" },
  { id: "COMMISSION", label: "Commission" },
  { id: "BOOKING", label: "Venue collections" },
];

export default async function AdminPaymentsPage({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const type = typeof sp.type === "string" && TYPES.some((t) => t.id === sp.type) ? (sp.type as string) : "ALL";
  const payments = await getAdminPayments(type);

  const total = payments.reduce((s, p) => s + (p.status === "PAID" ? p.amount : 0), 0);
  const platformTotal = payments
    .filter((p) => p.type !== "BOOKING" && p.status === "PAID")
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900">Payment ledger</h1>
          <p className="mt-1 text-sm text-stone-500">Every rupee moving through MerrageHall</p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-2xl bg-white px-5 py-3 text-right shadow-soft ring-1 ring-stone-200/80">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Platform revenue</p>
            <p className="font-display text-xl font-bold text-brand-800">{formatINR(platformTotal)}</p>
          </div>
          <div className="hidden rounded-2xl bg-white px-5 py-3 text-right shadow-soft ring-1 ring-stone-200/80 sm:block">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Listed total</p>
            <p className="font-display text-xl font-bold text-stone-700">{formatINR(total)}</p>
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {TYPES.map((t) => (
          <Link
            key={t.id}
            href={t.id === "ALL" ? "/dashboard/admin/payments" : `/dashboard/admin/payments?type=${t.id}`}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
              type === t.id ? "bg-brand-800 text-white shadow-sm" : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {payments.length === 0 ? (
        <Card>
          <EmptyState icon={<Wallet className="h-6 w-6" />} title="No payments in this view" description="Try a different type filter." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Venue</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const meta = PAYMENT_TYPE_META[p.type] ?? PAYMENT_TYPE_META.BOOKING;
                  return (
                    <tr key={p.id} className="border-b border-stone-50 transition hover:bg-brand-50/30">
                      <td className="whitespace-nowrap px-5 py-3 text-xs text-stone-500">{formatDate(p.createdAt)}</td>
                      <td className="px-5 py-3">
                        <Badge className={meta.badge}>{meta.label}</Badge>
                      </td>
                      <td className="px-5 py-3 font-medium text-stone-700">{p.hallName}</td>
                      <td className="max-w-56 truncate px-5 py-3 text-stone-500">{p.bookingRef ? `${p.description || "Booking payment"} · ${p.bookingRef}` : p.description}</td>
                      <td className="px-5 py-3 text-xs text-stone-500">{p.method}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={cn("font-bold tabular-nums", p.status === "PAID" ? "text-emerald-600" : "text-amber-600")}>
                          {formatINR(p.amount)}
                        </span>
                        {p.status !== "PAID" ? <span className="block text-[10px] font-semibold uppercase text-amber-500">{p.status.toLowerCase()}</span> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

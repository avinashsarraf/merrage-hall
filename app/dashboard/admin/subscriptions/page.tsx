import { requireAdmin } from "@/lib/auth";
import { getAdminSubscriptions } from "@/lib/queries";
import { formatCompactINR, formatDate, formatINR } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SUB_STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { SubscriptionStatusSelect } from "@/components/dashboard/subscription-status-select";

export const dynamic = "force-dynamic";
export const metadata = { title: "Subscriptions" };

export default async function AdminSubscriptionsPage() {
  await requireAdmin();
  const subs = await getAdminSubscriptions();
  const activeMrr = subs.filter((s) => s.status === "ACTIVE").reduce((s2, x) => s2 + x.priceMonthly, 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900">Subscriptions</h1>
          <p className="mt-1 text-sm text-stone-500">Every venue's plan &amp; billing state</p>
        </div>
        <div className="rounded-2xl bg-white px-5 py-3 shadow-soft ring-1 ring-stone-200/80">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Active MRR</p>
          <p className="font-display text-xl font-bold text-brand-800">{formatCompactINR(activeMrr)}</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                <th className="px-5 py-3">Venue</th>
                <th className="px-5 py-3">Owner</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Monthly</th>
                <th className="px-5 py-3">Since</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id} className="border-b border-stone-50 transition hover:bg-brand-50/30">
                  <td className="px-5 py-3.5 font-semibold text-stone-800">{s.hall.name}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-stone-600">{s.ownerName}</p>
                    <p className="text-xs text-stone-400">{s.hall.city}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge className="bg-brand-50 text-brand-700 ring-1 ring-brand-200">{s.plan.name}</Badge>
                  </td>
                  <td className="px-5 py-3.5 font-semibold tabular-nums text-stone-800">{formatINR(s.priceMonthly)}</td>
                  <td className="px-5 py-3.5 text-xs text-stone-500">{formatDate(s.startedAt)}</td>
                  <td className="px-5 py-3.5">
                    <SubscriptionStatusSelect hallId={s.hallId} status={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className={cn("mt-4 text-xs text-stone-400")}>
        Suspending a venue from the Venues page also marks its subscription past-due. Active subscriptions
        count toward MRR.
      </p>
    </div>
  );
}

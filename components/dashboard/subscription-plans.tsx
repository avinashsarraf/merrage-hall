"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check, Loader2, Sparkles } from "lucide-react";
import { changePlan } from "@/lib/actions/hall";
import { cn, formatDate, formatINR } from "@/lib/utils";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { SUB_STATUS_META } from "@/lib/constants";

export type PlanCard = {
  id: string;
  name: string;
  tagline: string;
  priceMonthly: number;
  features: string[];
  maxStaff: number;
  maxBookings: number;
  customDomain: boolean;
  commissionPct: number;
  isActive: boolean;
};

export type InvoiceRow = {
  id: string;
  amount: number;
  status: string;
  method: string;
  description: string;
  createdAt: string;
};

export function SubscriptionPanel({
  plans,
  current,
  invoices,
  usage,
}: {
  plans: PlanCard[];
  current: { planId: string; status: string; priceMonthly: number; startedAt: string } | null;
  invoices: InvoiceRow[];
  usage: { bookingsThisMonth: number; staffCount: number };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [target, setTarget] = useState<PlanCard | null>(null);

  const currentPlan = plans.find((p) => p.id === current?.planId) ?? null;

  function switchPlan() {
    if (!target) return;
    startTransition(async () => {
      const res = await changePlan(target.id);
      if (res.ok) {
        toast({ title: "Plan changed 🎉", description: res.message, variant: "success" });
        setTarget(null);
        router.refresh();
      } else {
        toast({ title: "Couldn't switch", description: res.error, variant: "error" });
      }
    });
  }

  const maxBookings = currentPlan?.maxBookings ?? 40;
  const maxStaff = currentPlan?.maxStaff ?? 2;

  return (
    <div className="space-y-8">
      {/* current plan */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-brand-800 to-brand-950 px-6 py-5 text-white">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gold-300">Current plan</p>
            <p className="mt-1 font-display text-2xl font-bold">{currentPlan?.name ?? "Starter (trialing)"}</p>
            <p className="mt-0.5 text-sm text-brand-100/80">
              {current ? `${formatINR(current.priceMonthly)}/month · since ${formatDate(current.startedAt)}` : "No active subscription"}
            </p>
          </div>
          {current ? (
            <Badge className={cn("px-3 py-1 text-sm", SUB_STATUS_META[current.status]?.badge)}>{SUB_STATUS_META[current.status]?.label}</Badge>
          ) : null}
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <UsageMeter
            label="Bookings this month"
            used={usage.bookingsThisMonth}
            cap={maxBookings}
            capLabel={maxBookings === -1 ? "Unlimited" : undefined}
          />
          <UsageMeter
            label="Staff accounts"
            used={usage.staffCount}
            cap={maxStaff}
            capLabel={maxStaff === -1 ? "Unlimited" : undefined}
          />
        </div>
      </Card>

      {/* plans */}
      <div>
        <h2 className="mb-4 font-display text-xl font-bold text-stone-900">Change plan</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((p) => {
            const isCurrent = p.id === current?.planId;
            return (
              <Card
                key={p.id}
                className={cn(
                  "relative flex flex-col p-6",
                  isCurrent ? "ring-2 ring-brand-600" : "hover:shadow-lift transition-shadow"
                )}
              >
                {isCurrent ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-800 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-300">
                    Current plan
                  </span>
                ) : null}
                <h3 className="font-display text-lg font-semibold text-stone-900">{p.name}</h3>
                <p className="mt-0.5 text-xs text-stone-500">{p.tagline}</p>
                <p className="mt-4">
                  <span className="font-display text-3xl font-bold text-brand-800">{formatINR(p.priceMonthly)}</span>
                  <span className="text-sm text-stone-400">/mo</span>
                </p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-stone-600">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={isCurrent ? "secondary" : "primary"}
                  disabled={isCurrent || !p.isActive || pending}
                  onClick={() => setTarget(p)}
                >
                  {isCurrent ? (
                    "Active"
                  ) : (
                    <>
                      <ArrowUpRight className="h-4 w-4" /> Switch to {p.name}
                    </>
                  )}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>

      {/* invoices */}
      <Card>
        <CardHeader title="Subscription invoices" sub="Charged to your saved UPI / card" bordered />
        {invoices.length === 0 ? (
          <CardBody>
            <p className="py-6 text-center text-sm text-stone-400">No invoices yet.</p>
          </CardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-stone-50">
                    <td className="px-5 py-3 text-stone-600">{formatDate(inv.createdAt)}</td>
                    <td className="px-5 py-3 font-medium text-stone-700">{inv.description}</td>
                    <td className="px-5 py-3 text-stone-500">{inv.method}</td>
                    <td className="px-5 py-3 font-semibold tabular-nums text-stone-800">{formatINR(inv.amount)}</td>
                    <td className="px-5 py-3">
                      <Badge
                        className={
                          inv.status === "PAID"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : inv.status === "PENDING"
                              ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                              : "bg-stone-100 text-stone-500 ring-1 ring-stone-200"
                        }
                      >
                        {inv.status.toLowerCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={!!target}
        onClose={() => setTarget(null)}
        title={`Switch to ${target?.name ?? ""}?`}
        description="Your subscription changes immediately and an invoice is raised."
      >
        <ul className="space-y-2 rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-200/70">
          {(target?.features ?? []).slice(0, 4).map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-stone-600">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-500" />
              {f}
            </li>
          ))}
        </ul>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setTarget(null)}>
            Maybe later
          </Button>
          <Button onClick={switchPlan} disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Switching…
              </>
            ) : (
              `Confirm · ${formatINR(target?.priceMonthly ?? 0)}/mo`
            )}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function UsageMeter({ label, used, cap, capLabel }: { label: string; used: number; cap: number; capLabel?: string }) {
  const pct = cap === -1 ? Math.min(100, used * 8) : cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 0;
  return (
    <div className="rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-200/70">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
        <p className="text-sm font-bold text-stone-800">
          {used}
          <span className="font-medium text-stone-400"> / {capLabel ?? cap}</span>
        </p>
      </div>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-stone-200/70">
        <div
          className={cn("h-full rounded-full transition-all duration-500", pct >= 90 ? "bg-rose-400" : pct >= 70 ? "bg-gold-400" : "bg-brand-500")}
          style={{ width: `${Math.max(4, pct)}%` }}
        />
      </div>
    </div>
  );
}

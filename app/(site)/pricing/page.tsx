import Link from "next/link";
import { BadgeCheck, Check, CreditCard, Globe, Minus } from "lucide-react";
import { getPlans } from "@/lib/queries";
import { formatINR } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata = { title: "Pricing for venues" };

export default async function PricingPage() {
  const plans = await getPlans();

  const comparison: { label: string; get: (p: (typeof plans)[number]) => string | boolean }[] = [
    { label: "Venue page on marketplace", get: () => true },
    { label: "Bookings / month", get: (p) => (p.maxBookings === -1 ? "Unlimited" : String(p.maxBookings)) },
    { label: "Staff accounts", get: (p) => (p.maxStaff === -1 ? "Unlimited" : String(p.maxStaff)) },
    { label: "Free subdomain", get: () => true },
    { label: "Custom domain", get: (p) => p.customDomain },
    { label: "Menu & add-on catalog", get: () => true },
    { label: "Booking calendar", get: () => true },
    { label: "Analytics dashboard", get: (p) => p.priceMonthly >= 5999 },
    { label: "Priority marketplace listing", get: (p) => p.priceMonthly >= 5999 },
    { label: "Platform commission", get: (p) => `${p.commissionPct}%` },
    { label: "Dedicated account manager", get: (p) => p.priceMonthly >= 11999 },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-brand-800 ring-1 ring-brand-200">
          <CreditCard className="h-3.5 w-3.5 text-gold-500" />
          For marriage hall owners
        </span>
        <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
          Pricing that pays for itself
        </h1>
        <p className="mt-4 text-base leading-relaxed text-stone-600">
          One confirmed wedding usually covers a full year of MerrageHall. Start with a 14-day free trial —
          no setup fees, no lock-in.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {plans.map((p, idx) => (
          <Card
            key={p.id}
            className={`relative flex flex-col p-7 ${
              idx === 1 ? "ring-2 ring-brand-600 shadow-lift md:-translate-y-2" : ""
            }`}
          >
            {idx === 1 ? (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-brand-800 px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest text-gold-300">
                Most popular
              </span>
            ) : null}
            <h2 className="font-display text-2xl font-bold text-stone-900">{p.name}</h2>
            <p className="mt-1 text-xs text-stone-500">{p.tagline}</p>
            <p className="mt-5">
              <span className="font-display text-4xl font-bold text-brand-800">{formatINR(p.priceMonthly)}</span>
              <span className="text-sm text-stone-400">/month</span>
            </p>
            <p className="mt-1 text-[11px] text-stone-400">+ {p.commissionPct}% platform commission on completed events</p>
            <ul className="mt-6 flex-1 space-y-2.5">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-stone-600">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href={`/register?mode=owner&plan=${p.slug}`} className={`mt-7 ${buttonClasses(idx === 1 ? "primary" : "secondary", "md", "w-full")}`}>
              Start free trial
            </Link>
          </Card>
        ))}
      </div>

      {/* comparison table */}
      <div className="mt-16">
        <h2 className="text-center font-display text-2xl font-bold text-stone-900">Compare plans</h2>
        <Card className="mt-8 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/60 text-left">
                  <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-stone-400">Feature</th>
                  {plans.map((p) => (
                    <th key={p.id} className="px-5 py-4 text-center font-display text-sm font-bold text-stone-800">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-white" : "bg-cream-50/50"}>
                    <td className="px-5 py-3.5 font-medium text-stone-700">{row.label}</td>
                    {plans.map((p) => {
                      const v = row.get(p);
                      return (
                        <td key={p.id} className="px-5 py-3.5 text-center">
                          {v === true ? (
                            <BadgeCheck className="mx-auto h-4.5 w-4.5 text-emerald-500" style={{ height: 18, width: 18 }} />
                          ) : v === false ? (
                            <Minus className="mx-auto h-4 w-4 text-stone-300" />
                          ) : (
                            <span className="font-semibold tabular-nums text-stone-700">{v}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="mt-16 rounded-[2rem] bg-gradient-to-br from-brand-800 to-brand-950 px-8 py-12 text-center shadow-lift sm:px-14">
        <Globe className="mx-auto h-8 w-8 text-gold-400" />
        <h2 className="mt-4 font-display text-3xl font-bold text-white">Every plan includes</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-brand-100/80">
          A gorgeous venue page, slot-wise booking management, menu &amp; add-on catalog, staff logins, payment
          tracking, invoices, and friendly humans on support.
        </p>
        <Link href="/register?mode=owner" className={`mt-7 ${buttonClasses("gold", "lg")}`}>
          Create your venue account
        </Link>
      </div>
    </main>
  );
}

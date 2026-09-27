import { requireAdmin } from "@/lib/auth";
import { getPlans } from "@/lib/queries";
import { PlanManager } from "@/components/dashboard/plan-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Plans" };

export default async function AdminPlansPage() {
  await requireAdmin();
  const plans = await getPlans(false);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-stone-900">Subscription plans</h1>
        <p className="mt-1 text-sm text-stone-500">Plans offered to venue owners on the pricing page</p>
      </div>
      <PlanManager
        plans={plans.map((p) => ({
          id: p.id,
          name: p.name,
          tagline: p.tagline,
          priceMonthly: p.priceMonthly,
          features: p.features,
          maxStaff: p.maxStaff,
          maxBookings: p.maxBookings,
          customDomain: p.customDomain,
          commissionPct: p.commissionPct,
          isActive: p.isActive,
          sortOrder: p.sortOrder,
        }))}
      />
    </div>
  );
}

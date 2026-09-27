import { requireRole, getHallForUser } from "@/lib/auth";
import { getPlans, getSubscriptionData, getSubscriptionUsage } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { CreditCard } from "lucide-react";
import { SubscriptionPanel } from "@/components/dashboard/subscription-plans";

export const dynamic = "force-dynamic";
export const metadata = { title: "Subscription" };

export default async function SubscriptionPage() {
  const user = await requireRole(["HALL_OWNER"]);
  const hall = await getHallForUser(user);
  if (!hall) {
    return (
      <Card>
        <EmptyState icon={<CreditCard className="h-6 w-6" />} title="No venue found" description="Register your venue to manage a subscription." />
      </Card>
    );
  }

  const [{ subscription, invoices }, plans, usage] = await Promise.all([
    getSubscriptionData(hall.id),
    getPlans(),
    getSubscriptionUsage(hall.id),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-stone-900">Subscription &amp; billing</h1>
        <p className="mt-1 text-sm text-stone-500">Your MerrageHall plan, usage and invoices</p>
      </div>
      <SubscriptionPanel
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
        }))}
        current={
          subscription
            ? {
                planId: subscription.planId,
                status: subscription.status,
                priceMonthly: subscription.priceMonthly,
                startedAt: subscription.startedAt.toISOString(),
              }
            : null
        }
        invoices={invoices.map((i) => ({
          id: i.id,
          amount: i.amount,
          status: i.status,
          method: i.method,
          description: i.description,
          createdAt: i.createdAt.toISOString(),
        }))}
        usage={usage}
      />
    </div>
  );
}

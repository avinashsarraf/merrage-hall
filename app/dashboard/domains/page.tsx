import { requireRole, getHallForUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { Building2 } from "lucide-react";
import { DomainsPanel } from "@/components/dashboard/domains-panel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Domains & site" };

export default async function DomainsPage() {
  const user = await requireRole(["HALL_OWNER"]);
  const hall = await getHallForUser(user);
  if (!hall) {
    return (
      <Card>
        <EmptyState icon={<Building2 className="h-6 w-6" />} title="No venue found" description="Register your venue to manage domains." />
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-stone-900">Domains &amp; venue site</h1>
        <p className="mt-1 text-sm text-stone-500">
          Your free subdomain is live — connect a custom domain for full branding
        </p>
      </div>
      <DomainsPanel
        slug={hall.slug}
        customDomain={hall.customDomain}
        domainVerified={hall.domainVerified}
        planAllowsDomain={hall.subscription?.plan.customDomain ?? false}
        planName={hall.subscription?.plan.name ?? "Starter"}
      />
    </div>
  );
}

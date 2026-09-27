import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { getHallForUser, requireUser } from "@/lib/auth";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HallOverview } from "@/components/dashboard/overview-hall";
import { CustomerHome } from "@/components/dashboard/overview-customer";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();

  if (user.role === "SUPER_ADMIN") redirect("/dashboard/admin");

  if (user.role === "CUSTOMER") {
    return <CustomerHome userId={user.id} name={user.name} />;
  }

  const hall = await getHallForUser(user);
  if (!hall) {
    return (
      <Card className="mx-auto max-w-lg p-10 text-center">
        <Building2 className="mx-auto h-10 w-10 text-brand-300" />
        <h1 className="mt-4 font-display text-xl font-bold text-stone-900">No venue linked to this account</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">
          Your staff login isn&apos;t assigned to a venue yet. Ask the venue owner to add you from their Staff
          settings page.
        </p>
        <Link href="/halls" className={`mt-6 ${buttonClasses("secondary", "md")}`}>
          Browse venues meanwhile
        </Link>
      </Card>
    );
  }

  return <HallOverview hall={hall} isStaff={user.role === "HALL_STAFF"} />;
}

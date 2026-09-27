import { requireRole, getHallForUser } from "@/lib/auth";
import { getStaffList } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { StaffManager } from "@/components/dashboard/staff-manager";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Staff" };

export default async function StaffPage() {
  const user = await requireRole(["HALL_OWNER"]);
  const hall = await getHallForUser(user);
  if (!hall) {
    return (
      <Card>
        <EmptyState icon={<Users className="h-6 w-6" />} title="No venue found" description="Register your venue first to invite staff." />
      </Card>
    );
  }
  const staff = await getStaffList(hall.id);
  const maxStaff = hall.subscription?.plan.maxStaff ?? 2;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-stone-900">Venue staff</h1>
        <p className="mt-1 text-sm text-stone-500">
          Managers and coordinators who can access bookings &amp; the calendar
        </p>
      </div>
      <StaffManager
        staff={staff.map((s) => ({ id: s.id, name: s.name, email: s.email, phone: s.phone, createdAt: s.createdAt.toISOString() }))}
        maxStaff={maxStaff}
      />
    </div>
  );
}

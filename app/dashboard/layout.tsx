import { getHallForUser, requireUser } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const hall = await getHallForUser(user);
  return (
    <DashboardShell
      user={{ name: user.name, email: user.email, role: user.role }}
      hall={hall ? { name: hall.name, slug: hall.slug, status: hall.status, city: `${hall.city || ""}`.trim() } : null}
    >
      {children}
    </DashboardShell>
  );
}

import { requireAdmin } from "@/lib/auth";
import { getAdminHalls, getPlans } from "@/lib/queries";
import { AdminHallsTable } from "@/components/dashboard/admin-halls-table";

export const dynamic = "force-dynamic";
export const metadata = { title: "Venues" };

export default async function AdminHallsPage() {
  await requireAdmin();
  const [halls, plans] = await Promise.all([getAdminHalls(), getPlans(false)]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-stone-900">Venues</h1>
        <p className="mt-1 text-sm text-stone-500">
          Approve, suspend and manage plans for every marriage hall on the platform
        </p>
      </div>
      <AdminHallsTable
        halls={halls.map((h) => ({
          id: h.hall.id,
          name: h.hall.name,
          slug: h.hall.slug,
          city: h.hall.city,
          state: h.hall.state,
          capacity: h.hall.capacity,
          image: h.hall.images[0] ?? null,
          ownerName: h.ownerName,
          ownerEmail: h.ownerEmail,
          status: h.hall.status,
          createdAt: h.hall.createdAt.toISOString(),
          planId: h.plan?.id ?? null,
          planName: h.plan?.name ?? null,
        }))}
        plans={plans.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}

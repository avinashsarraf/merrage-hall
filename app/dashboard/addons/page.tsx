import { eq } from "drizzle-orm";
import { requireHallAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { addons } from "@/lib/schema";
import { AddonManager } from "@/components/dashboard/addon-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Add-ons" };

export default async function AddonsPage() {
  const { hall } = await requireHallAccess();
  const rows = await db.select().from(addons).where(eq(addons.hallId, hall.id)).orderBy(addons.category, addons.name);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-stone-900">Add-ons</h1>
        <p className="mt-1 text-sm text-stone-500">
          Décor, lighting, entertainment and more — extras guests add while booking
        </p>
      </div>
      <AddonManager
        addons={rows.map((a) => ({
          id: a.id,
          name: a.name,
          category: a.category,
          description: a.description,
          price: a.price,
          unit: a.unit,
          isActive: a.isActive,
        }))}
      />
    </div>
  );
}

import { requireHallAccess } from "@/lib/auth";
import { getHallMenu } from "@/lib/queries";
import { MenuTabs } from "@/components/dashboard/menu-tabs";

export const dynamic = "force-dynamic";
export const metadata = { title: "Menu & Packages" };

export default async function MenuPage() {
  const { hall } = await requireHallAccess();
  const { items, packages } = await getHallMenu(hall.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-stone-900">Menu &amp; packages</h1>
        <p className="mt-1 text-sm text-stone-500">
          Your dishes and per-plate packages, published on your venue page
        </p>
      </div>
      <MenuTabs
        items={items.map((i) => ({
          id: i.id,
          name: i.name,
          category: i.category,
          dietType: i.dietType,
          pricePerPlate: i.pricePerPlate,
          description: i.description,
          isActive: i.isActive,
        }))}
        packages={packages.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          pricePerPlate: p.pricePerPlate,
          dietType: p.dietType,
          items: p.items,
          isActive: p.isActive,
        }))}
      />
    </div>
  );
}

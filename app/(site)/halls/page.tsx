import { Search, SlidersHorizontal, Building2 } from "lucide-react";
import { getCityList, getPublicHalls } from "@/lib/queries";
import { buttonClasses } from "@/components/ui/button";
import { inputClass, Select } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { HallCard } from "@/components/public/hall-card";

export const dynamic = "force-dynamic";

export const metadata = { title: "Browse marriage halls" };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function HallsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const city = typeof sp.city === "string" ? sp.city : "";
  const minCapacity = Number(sp.minCapacity ?? 0) || 0;
  const sort = typeof sp.sort === "string" ? sp.sort : "featured";

  const [halls, cities] = await Promise.all([
    getPublicHalls({ q, city, minCapacity, sort }),
    getCityList(),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            Find your perfect venue
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            {halls.length} verified venue{halls.length === 1 ? "" : "s"} · real photos, transparent per-plate pricing
          </p>
        </div>
      </div>

      {/* filters */}
      <Card className="mt-6 p-4">
        <form className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search by venue name or city…"
              className={`${inputClass} pl-10`}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-auto lg:grid-cols-3">
            <Select name="city" defaultValue={city} className="lg:w-44">
              <option value="">All cities</option>
              {cities.map((c) => (
                <option key={c.city} value={c.city}>
                  {c.city}
                </option>
              ))}
            </Select>
            <Select name="minCapacity" defaultValue={String(minCapacity || "")} className="lg:w-40">
              <option value="">Any capacity</option>
              <option value="200">200+ guests</option>
              <option value="500">500+ guests</option>
              <option value="800">800+ guests</option>
              <option value="1200">1200+ guests</option>
            </Select>
            <Select name="sort" defaultValue={sort} className="lg:w-44">
              <option value="featured">Sort: Featured</option>
              <option value="price_asc">Rent: low to high</option>
              <option value="price_desc">Rent: high to low</option>
              <option value="capacity_desc">Capacity: largest</option>
            </Select>
          </div>
          <button type="submit" className={buttonClasses("primary", "md", "lg:w-auto")}>
            <SlidersHorizontal className="h-4 w-4" />
            Apply
          </button>
        </form>
      </Card>

      {halls.length === 0 ? (
        <Card className="mt-8">
          <EmptyState
            icon={<Building2 className="h-6 w-6" />}
            title="No venues match your filters"
            description="Try widening your search — remove the city filter or lower the guest capacity."
            action={
              <a href="/halls" className={buttonClasses("secondary", "md")}>
                Clear filters
              </a>
            }
          />
        </Card>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {halls.map((hall) => (
            <HallCard key={hall.id} hall={hall} />
          ))}
        </div>
      )}
    </main>
  );
}

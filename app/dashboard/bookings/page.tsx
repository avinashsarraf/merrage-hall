import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { CalendarDays } from "lucide-react";
import { getHallForUser, requireHallAccess, requireUser } from "@/lib/auth";
import { getCustomerOverview, getHallBookings } from "@/lib/queries";
import { db } from "@/lib/db";
import { addons as addonsTable, menuPackages } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/button";
import { MyBookings } from "@/components/dashboard/my-bookings";
import { BookingsManager, type BookingRow } from "@/components/dashboard/bookings-table";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bookings" };

type SP = Promise<Record<string, string | string[] | undefined>>;

const STATUSES = [
  { id: "ALL", label: "All" },
  { id: "PENDING", label: "Pending" },
  { id: "CONFIRMED", label: "Confirmed" },
  { id: "COMPLETED", label: "Completed" },
  { id: "CANCELLED", label: "Cancelled" },
];

export default async function BookingsPage({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  if (user.role === "SUPER_ADMIN") redirect("/dashboard/admin");

  /* ----------------------------- customer view ---------------------------- */
  if (user.role === "CUSTOMER") {
    const data = await getCustomerOverview(user.id);
    const rows = data.all.map((b) => ({
      id: b.id,
      hallName: b.hall.name,
      hallCity: b.hall.city,
      hallSlug: b.hall.slug,
      hallImage: b.hall.images[0] ?? null,
      eventType: b.eventType,
      eventDate: b.eventDate,
      slot: b.slot,
      guestCount: b.guestCount,
      menuPackageName: b.menuPackageName,
      totalAmount: b.totalAmount,
      paidAmount: b.paidAmount,
      status: b.status,
    }));

    return (
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-stone-900">My bookings</h1>
            <p className="mt-1 text-sm text-stone-500">Track requests, payments and confirmations</p>
          </div>
          <Link href="/halls" className={buttonClasses("primary", "md")}>
            Book another venue
          </Link>
        </div>
        <MyBookings bookings={rows} />
      </div>
    );
  }

  /* --------------------------- owner / staff view -------------------------- */
  const { hall } = await requireHallAccess();
  const sp = await searchParams;
  const status = typeof sp.status === "string" && STATUSES.some((s) => s.id === sp.status) ? (sp.status as string) : "ALL";

  const all = await getHallBookings(hall.id);
  const counts: Record<string, number> = { ALL: all.length };
  for (const s of STATUSES) counts[s.id] = all.filter((b) => b.status === s.id).length;
  const filtered = status === "ALL" ? all : all.filter((b) => b.status === status);

  const [pkgs, adds] = await Promise.all([
    db.select().from(menuPackages).where(eq(menuPackages.hallId, hall.id)),
    db.select().from(addonsTable).where(and(eq(addonsTable.hallId, hall.id), eq(addonsTable.isActive, true))),
  ]);

  const rows: BookingRow[] = filtered.map((b) => ({
    id: b.id,
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    eventType: b.eventType,
    eventDate: b.eventDate,
    slot: b.slot,
    guestCount: b.guestCount,
    menuPackageId: b.menuPackageId,
    menuPackageName: b.menuPackageName,
    totalAmount: b.totalAmount,
    paidAmount: b.paidAmount,
    advanceAmount: b.advanceAmount,
    status: b.status,
    source: b.source,
    addons: (b.addons ?? []).map((a) => ({ id: a.id, qty: a.qty })),
    customerEmail: b.customerEmail,
    discount: b.discount,
    hallRent: b.hallRent,
    notes: b.notes,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-stone-900">Bookings</h1>
        <p className="mt-1 text-sm text-stone-500">
          Walk-in, phone and website bookings for {hall.name}
        </p>
      </div>

      {/* status filter */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <Link
            key={s.id}
            href={s.id === "ALL" ? "/dashboard/bookings" : `/dashboard/bookings?status=${s.id}`}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
              status === s.id
                ? "bg-brand-800 text-white shadow-sm"
                : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
            )}
          >
            {s.label} · {counts[s.id] ?? 0}
          </Link>
        ))}
      </div>

      {all.length === 0 ? (
        <div className="rounded-2xl bg-white px-6 py-14 text-center shadow-soft ring-1 ring-stone-200/80">
          <CalendarDays className="mx-auto h-10 w-10 text-brand-200" />
          <h3 className="mt-4 font-display text-lg font-semibold text-stone-900">No bookings yet</h3>
          <p className="mt-1.5 text-sm text-stone-500">Add your first booking or share your venue page to receive requests.</p>
        </div>
      ) : (
        <BookingsManager
          hall={{ id: hall.id, name: hall.name, baseRent: hall.baseRent, capacity: hall.capacity }}
          packages={pkgs.map((p) => ({ id: p.id, name: p.name, pricePerPlate: p.pricePerPlate }))}
          addons={adds.map((a) => ({ id: a.id, name: a.name, price: a.price, unit: a.unit }))}
          bookings={rows}
        />
      )}
    </div>
  );
}

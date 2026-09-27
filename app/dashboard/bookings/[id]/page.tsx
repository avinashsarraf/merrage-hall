import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  Phone,
  Users,
  UtensilsCrossed,
  Sparkles,
  StickyNote,
} from "lucide-react";
import { getBookingDetail, getHallMenu } from "@/lib/queries";
import { getHallForUser, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { addons as addonsTable } from "@/lib/schema";
import { SLOTS, slotMeta } from "@/lib/constants";
import { cn, dateKey, formatDate, formatINR } from "@/lib/utils";
import { parseAddonSelections } from "@/lib/pricing";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookingStatusBadge } from "@/components/dashboard/status-badge";
import { BookingActions } from "@/components/dashboard/booking-actions";

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const detail = await getBookingDetail(id);
  if (!detail) notFound();
  const { booking, hall, payments } = detail;

  const isManager =
    (user.role === "HALL_OWNER" || user.role === "HALL_STAFF") &&
    (await getHallForUser(user))?.id === booking.hallId;
  const isCustomer = booking.bookedByUserId === user.id;
  if (!isManager && !isCustomer && user.role !== "SUPER_ADMIN") notFound();

  const selectedAddons = parseAddonSelections(booking.addons);
  const balance = Math.max(0, booking.totalAmount - booking.paidAmount);
  const paidPct = booking.totalAmount > 0 ? Math.min(100, Math.round((booking.paidAmount / booking.totalAmount) * 100)) : 0;
  const todayK = dateKey(new Date());
  const canCancel =
    (isCustomer || isManager) &&
    (booking.status === "PENDING" || booking.status === "CONFIRMED") &&
    booking.eventDate >= todayK;

  const [pkgs, adds] = isManager
    ? await Promise.all([
        getHallMenu(hall.id).then((m) => m.packages),
        db.select().from(addonsTable).where(and(eq(addonsTable.hallId, hall.id), eq(addonsTable.isActive, true))),
      ])
    : [[], []];

  return (
    <div>
      {/* header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link href="/dashboard/bookings" className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-400 transition hover:text-brand-700">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to bookings
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-stone-900">
              {booking.eventType} · {booking.customerName}
            </h1>
            <BookingStatusBadge status={booking.status} />
          </div>
          <p className="mt-1.5 text-sm text-stone-500">
            Booking #{booking.id.slice(-6).toUpperCase()} ·{" "}
            <Link href={`/halls/${hall.slug}`} target="_blank" className="font-medium text-brand-700 hover:underline">
              {hall.name}
            </Link>
            {booking.source === "WEBSITE" ? (
              <Badge className="ml-2 bg-gold-50 text-gold-700 ring-1 ring-gold-200">via website</Badge>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/bookings/${booking.id}/invoice`}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-medium text-stone-700 ring-1 ring-stone-200 transition hover:bg-stone-50"
          >
            <FileText className="h-4 w-4" /> Invoice
          </Link>
          <BookingActions
            booking={{
              id: booking.id,
              customerName: booking.customerName,
              customerPhone: booking.customerPhone,
              customerEmail: booking.customerEmail,
              eventType: booking.eventType,
              eventDate: booking.eventDate,
              slot: booking.slot,
              guestCount: booking.guestCount,
              menuPackageId: booking.menuPackageId,
              hallRent: booking.hallRent,
              discount: booking.discount,
              advanceAmount: booking.advanceAmount,
              status: booking.status,
              notes: booking.notes,
              addons: selectedAddons.map((a) => ({ id: a.id, qty: a.qty })),
              totalAmount: booking.totalAmount,
              paidAmount: booking.paidAmount,
              customerNameLabel: booking.customerName,
              eventTypeLabel: booking.eventType,
            }}
            hall={{ id: hall.id, name: hall.name, baseRent: hall.baseRent, capacity: hall.capacity }}
            packages={pkgs.map((p) => ({ id: p.id, name: p.name, pricePerPlate: p.pricePerPlate }))}
            addons={adds.map((a) => ({ id: a.id, name: a.name, price: a.price, unit: a.unit }))}
            isManager={isManager}
            canCancel={canCancel}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* left column */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Event details" bordered />
            <div className="grid gap-x-6 gap-y-5 p-5 sm:grid-cols-2">
              <Detail icon={CalendarDays} label="Date">
                {formatDate(booking.eventDate)}
                <span className="ml-2 text-xs text-stone-400">{slotMeta(booking.slot).time}</span>
              </Detail>
              <Detail icon={CalendarDays} label="Slot">
                {SLOTS.find((s) => s.value === booking.slot)?.label ?? booking.slot}
              </Detail>
              <Detail icon={Users} label="Guests">{booking.guestCount.toLocaleString("en-IN")}</Detail>
              <Detail icon={UtensilsCrossed} label="Menu package">
                {booking.menuPackageName || "Venue only (no catering)"}
                {booking.platePrice > 0 ? (
                  <span className="ml-2 text-xs text-stone-400">@ {formatINR(booking.platePrice)}/plate</span>
                ) : null}
              </Detail>
            </div>
            {booking.notes ? (
              <div className="border-t border-stone-100 px-5 py-4">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-400">
                  <StickyNote className="h-3.5 w-3.5" /> Notes
                </p>
                <p className="mt-1.5 whitespace-pre-line rounded-xl bg-cream-50 px-4 py-3 text-sm leading-relaxed text-stone-600 ring-1 ring-stone-200/60">
                  {booking.notes}
                </p>
              </div>
            ) : null}
          </Card>

          <Card>
            <CardHeader title="Customer" bordered />
            <div className="grid gap-x-6 gap-y-5 p-5 sm:grid-cols-2">
              <Detail icon={Phone} label="Phone">{booking.customerPhone}</Detail>
              <Detail icon={Mail} label="Email">{booking.customerEmail || "—"}</Detail>
              <Detail icon={MapPin} label="Venue">
                {hall.name}, {hall.city}
              </Detail>
              <Detail icon={ExternalLink} label="Booked via">
                {booking.source === "WEBSITE" ? "Website (self-service)" : "Venue dashboard"}
              </Detail>
            </div>
          </Card>

          {selectedAddons.length ? (
            <Card>
              <CardHeader title="Add-ons" sub={`${selectedAddons.length} extra${selectedAddons.length === 1 ? "" : "s"} on this booking`} bordered />
              <ul className="divide-y divide-stone-50">
                {selectedAddons.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <Sparkles className="h-4 w-4 shrink-0 text-gold-500" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-stone-800">{a.name}</p>
                        <p className="text-xs text-stone-400">
                          {formatINR(a.price)} {a.unit}
                          {a.qty > 1 ? ` · qty ${a.qty}` : ""}
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-bold tabular-nums text-stone-800">{formatINR(a.price * a.qty)}</p>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>

        {/* right column */}
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-brand-800 to-brand-950 px-5 py-4 text-white">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gold-300">Total estimate</p>
              <p className="mt-1 font-display text-3xl font-bold">{formatINR(booking.totalAmount)}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
                <div className={cn("h-full rounded-full transition-all duration-500", paidPct >= 100 ? "bg-emerald-400" : "bg-gold-400")} style={{ width: `${paidPct}%` }} />
              </div>
              <p className="mt-2 text-xs text-brand-100/80">
                {formatINR(booking.paidAmount)} paid · {formatINR(balance)} balance
              </p>
            </div>
            <dl className="space-y-2 p-5 text-sm">
              <Row label="Venue rent" value={formatINR(booking.hallRent)} />
              {booking.cateringTotal > 0 ? (
                <Row label={`Catering · ${booking.guestCount.toLocaleString("en-IN")} × ${formatINR(booking.platePrice)}`} value={formatINR(booking.cateringTotal)} />
              ) : null}
              {booking.addonsTotal > 0 ? <Row label="Add-ons" value={formatINR(booking.addonsTotal)} /> : null}
              {booking.discount > 0 ? <Row label="Discount" value={`− ${formatINR(booking.discount)}`} tone="text-emerald-600" /> : null}
              <div className="flex justify-between border-t border-stone-100 pt-2.5">
                <dt className="font-display font-bold text-stone-900">Total</dt>
                <dd className="font-display text-lg font-bold text-brand-800 tabular-nums">{formatINR(booking.totalAmount)}</dd>
              </div>
              <Row label="Advance to confirm" value={formatINR(booking.advanceAmount)} />
            </dl>
          </Card>

          <Card>
            <CardHeader title="Payment history" bordered />
            {payments.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-stone-400">No payments recorded yet.</p>
            ) : (
              <ul className="divide-y divide-stone-50">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-stone-800">{p.description}</p>
                      <p className="text-xs text-stone-400">
                        {formatDate(p.createdAt)} · {p.method}
                        {p.reference ? ` · ${p.reference}` : ""}
                      </p>
                    </div>
                    <p className={cn("shrink-0 text-sm font-bold tabular-nums", p.status === "PAID" ? "text-emerald-600" : "text-amber-600")}>
                      {formatINR(p.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-400">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className="mt-1.5 text-sm font-medium text-stone-800">{children}</p>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex justify-between gap-3 text-stone-600">
      <dt className="min-w-0 truncate">{label}</dt>
      <dd className={cn("shrink-0 font-medium tabular-nums", tone)}>{value}</dd>
    </div>
  );
}

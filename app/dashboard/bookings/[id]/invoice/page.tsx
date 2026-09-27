import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { getBookingDetail } from "@/lib/queries";
import { getHallForUser, requireUser } from "@/lib/auth";
import { formatDate, formatINR } from "@/lib/utils";
import { parseAddonSelections } from "@/lib/pricing";
import { buttonClasses } from "@/components/ui/button";
import { PrintButton } from "@/components/dashboard/print-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invoice" };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const detail = await getBookingDetail(id);
  if (!detail) notFound();
  const { booking, hall, payments } = detail;

  const isManager =
    (user.role === "HALL_OWNER" || user.role === "HALL_STAFF") &&
    (await getHallForUser(user))?.id === booking.hallId;
  if (!isManager && booking.bookedByUserId !== user.id && user.role !== "SUPER_ADMIN") notFound();

  const selectedAddons = parseAddonSelections(booking.addons);
  const balance = Math.max(0, booking.totalAmount - booking.paidAmount);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print mb-5 flex items-center justify-between">
        <Link href={`/dashboard/bookings/${booking.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-400 transition hover:text-brand-700">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to booking
        </Link>
        <PrintButton />
      </div>

      <div className="print-flat rounded-2xl bg-white p-8 shadow-soft ring-1 ring-stone-200/80 sm:p-10">
        {/* header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <p className="font-display text-xl font-bold text-brand-800">{hall.name}</p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-stone-500">
              {hall.address ? `${hall.address}, ` : ""}
              {hall.city}, {hall.state} {hall.pincode}
              <br />
              {hall.contactPhone} · {hall.contactEmail}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-bold tracking-tight text-stone-900">INVOICE</p>
            <p className="mt-1 text-xs text-stone-500">
              #{booking.id.slice(-8).toUpperCase()}
              <br />
              Issued {formatDate(new Date())}
            </p>
          </div>
        </div>

        {/* bill to */}
        <div className="grid gap-6 border-b border-stone-200 py-6 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Bill to</p>
            <p className="mt-1.5 text-sm font-bold text-stone-900">{booking.customerName}</p>
            <p className="text-xs text-stone-500">
              {booking.customerPhone}
              {booking.customerEmail ? ` · ${booking.customerEmail}` : ""}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Event</p>
            <p className="mt-1.5 text-sm font-bold text-stone-900">
              {booking.eventType} · {formatDate(booking.eventDate)}
            </p>
            <p className="text-xs text-stone-500">
              {booking.guestCount.toLocaleString("en-IN")} guests · {booking.slot === "FULL_DAY" ? "Full day" : booking.slot === "LUNCH" ? "Lunch" : "Dinner"} slot
            </p>
          </div>
        </div>

        {/* line items */}
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-[10px] font-bold uppercase tracking-widest text-stone-400">
              <th className="pb-2.5">Description</th>
              <th className="pb-2.5 text-right">Qty</th>
              <th className="pb-2.5 text-right">Rate</th>
              <th className="pb-2.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            <tr>
              <td className="py-3 text-stone-700">Venue rent ({booking.slot === "FULL_DAY" ? "full day" : booking.slot.toLowerCase()} slot)</td>
              <td className="py-3 text-right tabular-nums text-stone-500">1</td>
              <td className="py-3 text-right tabular-nums text-stone-500">{formatINR(booking.hallRent)}</td>
              <td className="py-3 text-right font-semibold tabular-nums text-stone-800">{formatINR(booking.hallRent)}</td>
            </tr>
            {booking.cateringTotal > 0 ? (
              <tr>
                <td className="py-3 text-stone-700">Catering — {booking.menuPackageName} ({booking.platePrice > 0 ? `per plate ${formatINR(booking.platePrice)}` : ""})</td>
                <td className="py-3 text-right tabular-nums text-stone-500">{booking.guestCount.toLocaleString("en-IN")}</td>
                <td className="py-3 text-right tabular-nums text-stone-500">{formatINR(booking.platePrice)}</td>
                <td className="py-3 text-right font-semibold tabular-nums text-stone-800">{formatINR(booking.cateringTotal)}</td>
              </tr>
            ) : null}
            {selectedAddons.map((a) => (
              <tr key={a.id}>
                <td className="py-3 text-stone-700">Add-on — {a.name}</td>
                <td className="py-3 text-right tabular-nums text-stone-500">{a.qty}</td>
                <td className="py-3 text-right tabular-nums text-stone-500">{formatINR(a.price)}</td>
                <td className="py-3 text-right font-semibold tabular-nums text-stone-800">{formatINR(a.price * a.qty)}</td>
              </tr>
            ))}
            {booking.discount > 0 ? (
              <tr>
                <td className="py-3 text-emerald-700" colSpan={3}>Discount</td>
                <td className="py-3 text-right font-semibold tabular-nums text-emerald-700">− {formatINR(booking.discount)}</td>
              </tr>
            ) : null}
          </tbody>
        </table>

        {/* totals */}
        <div className="mt-6 ml-auto max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between text-stone-600">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatINR(booking.hallRent + booking.cateringTotal + booking.addonsTotal)}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Discount</span>
            <span className="tabular-nums">− {formatINR(booking.discount)}</span>
          </div>
          <div className="flex items-baseline justify-between border-t border-stone-200 pt-2">
            <span className="font-display text-base font-bold text-stone-900">Grand total</span>
            <span className="font-display text-xl font-bold text-brand-800 tabular-nums">{formatINR(booking.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Received</span>
            <span className="tabular-nums text-emerald-600">{formatINR(booking.paidAmount)}</span>
          </div>
          <div className="flex justify-between font-bold text-stone-900">
            <span>Balance due</span>
            <span className={balance > 0 ? "tabular-nums text-rose-600" : "tabular-nums text-emerald-600"}>{formatINR(balance)}</span>
          </div>
        </div>

        {/* payments */}
        {payments.length ? (
          <div className="mt-8 border-t border-stone-200 pt-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Payments received</p>
            <ul className="mt-2 space-y-1 text-xs text-stone-600">
              {payments.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span>
                    {formatDate(p.createdAt)} · {p.method}
                    {p.reference ? ` · ${p.reference}` : ""} — {p.description}
                  </span>
                  <span className="tabular-nums font-semibold">{formatINR(p.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* footer */}
        <div className="mt-10 border-t border-dashed border-stone-300 pt-5 text-[11px] leading-relaxed text-stone-400">
          <p>
            Thank you for choosing {hall.name}. This invoice was generated by MerrageHall — payments are
            non-refundable within 15 days of the event date unless otherwise agreed. Advance amounts adjust
            against the final bill. GST, if applicable, is charged separately as per law.
          </p>
          <div className="mt-8 flex items-end justify-between">
            <p>For {hall.name}</p>
            <div className="w-40 border-t border-stone-300 pt-1 text-center">Authorised signatory</div>
          </div>
        </div>
      </div>
    </div>
  );
}

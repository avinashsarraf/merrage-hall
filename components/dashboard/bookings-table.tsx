"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Eye,
  IndianRupee,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { deleteBooking, updateBookingStatus } from "@/lib/actions/bookings";
import { BOOKING_STATUS_META } from "@/lib/constants";
import { cn, formatDate, formatINR } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { BookingFormModal, type AddonRef, type BookingEdit, type HallRef, type PkgRef } from "./booking-form";
import { RecordPaymentModal } from "./record-payment";

export type BookingRow = {
  id: string;
  customerName: string;
  customerPhone: string;
  eventType: string;
  eventDate: string;
  slot: string;
  guestCount: number;
  menuPackageId: string | null;
  menuPackageName: string;
  totalAmount: number;
  paidAmount: number;
  advanceAmount: number;
  status: string;
  source: string;
  addons: { id: string; qty: number }[];
  customerEmail: string;
  discount: number;
  hallRent: number;
  notes: string;
};

export function BookingsManager({
  hall,
  packages,
  addons,
  bookings,
}: {
  hall: HallRef;
  packages: PkgRef[];
  addons: AddonRef[];
  bookings: BookingRow[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const [statusOverride, setStatusOverride] = useState<Record<string, string>>({});
  const [deleted, setDeleted] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<BookingRow | null>(null);
  const [paying, setPaying] = useState<BookingRow | null>(null);
  const [deleting, setDeleting] = useState<BookingRow | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const visible = bookings.filter((b) => !deleted[b.id]);

  function changeStatus(b: BookingRow, status: string) {
    setStatusOverride((s) => ({ ...s, [b.id]: status })); // optimistic
    startTransition(async () => {
      const res = await updateBookingStatus(b.id, status);
      if (res.ok) {
        toast({ title: res.message ?? "Status updated", variant: "success" });
        router.refresh();
      } else {
        setStatusOverride((s) => {
          const next = { ...s };
          delete next[b.id];
          return next;
        });
        toast({ title: "Couldn't update status", description: res.error, variant: "error" });
      }
    });
  }

  function confirmDelete() {
    if (!deleting) return;
    setDeletePending(true);
    setDeleted((s) => ({ ...s, [deleting.id]: true })); // optimistic removal
    startTransition(async () => {
      const res = await deleteBooking(deleting.id);
      setDeletePending(false);
      setDeleting(null);
      if (res.ok) {
        toast({ title: res.message ?? "Booking deleted", variant: "success" });
        router.refresh();
      } else {
        setDeleted((s) => {
          const next = { ...s };
          delete next[deleting.id];
          return next;
        });
        toast({ title: "Couldn't delete", description: res.error, variant: "error" });
      }
    });
  }

  function toEdit(b: BookingRow): BookingEdit {
    return {
      id: b.id,
      customerName: b.customerName,
      customerPhone: b.customerPhone,
      customerEmail: b.customerEmail,
      eventType: b.eventType,
      eventDate: b.eventDate,
      slot: b.slot,
      guestCount: b.guestCount,
      menuPackageId: null,
      hallRent: b.hallRent,
      discount: b.discount,
      advanceAmount: b.advanceAmount,
      status: statusOverride[b.id] ?? b.status,
      notes: b.notes,
      addons: b.addons,
    };
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-500">
          <span className="font-semibold text-stone-800">{visible.length}</span> booking{visible.length === 1 ? "" : "s"}
        </p>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New booking
        </Button>
      </div>

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Plus className="h-6 w-6" />}
            title="No bookings here yet"
            description="When a couple requests your venue or you add a walk-in booking, it will show up here."
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> Add your first booking
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          {/* desktop table */}
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    <th className="px-5 py-3">Event</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Guests</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((b) => {
                    const status = statusOverride[b.id] ?? b.status;
                    const meta = BOOKING_STATUS_META[status] ?? BOOKING_STATUS_META.PENDING;
                    return (
                      <tr key={b.id} className="border-b border-stone-50 transition hover:bg-brand-50/30">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-stone-800">{b.eventType}</p>
                          <p className="mt-0.5 text-xs text-stone-500">
                            {formatDate(b.eventDate)} · {b.slot === "FULL_DAY" ? "Full day" : b.slot === "LUNCH" ? "Lunch" : "Dinner"}
                            {b.source === "WEBSITE" ? <span className="ml-2 rounded-full bg-gold-50 px-1.5 py-0.5 text-[10px] font-semibold text-gold-700 ring-1 ring-gold-200">website</span> : null}
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-stone-700">{b.customerName}</p>
                          <p className="text-xs text-stone-400">{b.customerPhone}</p>
                        </td>
                        <td className="px-5 py-3.5 tabular-nums text-stone-600">
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-stone-300" />
                            {b.guestCount.toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold tabular-nums text-stone-800">{formatINR(b.totalAmount)}</p>
                          {b.paidAmount > 0 ? (
                            <p className={cn("text-xs tabular-nums", b.paidAmount >= b.totalAmount ? "text-emerald-600" : "text-amber-600")}>
                              {formatINR(b.paidAmount)} paid
                            </p>
                          ) : (
                            <p className="text-xs text-stone-400">unpaid</p>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="relative inline-flex">
                            <select
                              value={status}
                              onChange={(e) => changeStatus(b, e.target.value)}
                              className={cn(
                                "appearance-none rounded-full py-1 pl-3 pr-7 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-300",
                                meta.badge
                              )}
                              aria-label={`Status for ${b.customerName}`}
                            >
                              <option value="PENDING">Pending</option>
                              <option value="CONFIRMED">Confirmed</option>
                              <option value="COMPLETED">Completed</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 opacity-60" />
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/dashboard/bookings/${b.id}`}
                              className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-brand-700"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => setPaying(b)}
                              className="rounded-lg p-2 text-stone-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                              title="Record payment"
                            >
                              <IndianRupee className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditing(b)}
                              className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleting(b)}
                              className="rounded-lg p-2 text-stone-400 transition hover:bg-rose-50 hover:text-rose-600"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* mobile cards */}
          <div className="space-y-3 md:hidden">
            {visible.map((b) => {
              const status = statusOverride[b.id] ?? b.status;
              const meta = BOOKING_STATUS_META[status] ?? BOOKING_STATUS_META.PENDING;
              return (
                <Card key={b.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-stone-800">{b.eventType}</p>
                      <p className="mt-0.5 text-xs text-stone-500">{formatDate(b.eventDate)} · {b.slot.toLowerCase()}</p>
                      <p className="mt-1.5 text-sm text-stone-600">{b.customerName} · {b.customerPhone}</p>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold", meta.badge)}>{meta.label}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
                    <div>
                      <p className="font-display text-lg font-bold text-stone-900">{formatINR(b.totalAmount)}</p>
                      <p className="text-[11px] text-stone-400">
                        {b.guestCount.toLocaleString("en-IN")} guests · {b.paidAmount >= b.totalAmount && b.paidAmount > 0 ? "fully paid" : formatINR(b.paidAmount) + " paid"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link href={`/dashboard/bookings/${b.id}`} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100">
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button onClick={() => setPaying(b)} className="rounded-lg p-2 text-stone-500 hover:bg-emerald-50 hover:text-emerald-600">
                        <IndianRupee className="h-4 w-4" />
                      </button>
                      <button onClick={() => setEditing(b)} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleting(b)} className="rounded-lg p-2 text-stone-500 hover:bg-rose-50 hover:text-rose-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <BookingFormModal
        open={creating || !!editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        hall={hall}
        packages={packages}
        addons={addons}
        booking={editing ? toEdit(editing) : null}
        onSaved={() => {
          setCreating(false);
          setEditing(null);
          router.refresh();
        }}
      />

      <RecordPaymentModal
        open={!!paying}
        onClose={() => setPaying(null)}
        booking={
          paying
            ? {
                id: paying.id,
                customerName: paying.customerName,
                eventType: paying.eventType,
                totalAmount: paying.totalAmount,
                paidAmount: paying.paidAmount,
                advanceAmount: paying.advanceAmount,
              }
            : null
        }
        onSaved={() => {
          setPaying(null);
          router.refresh();
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete this booking?"
        message={
          deleting
            ? `This permanently removes the booking for ${deleting.customerName} (${formatDate(deleting.eventDate)}) along with its payment records. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete booking"
        pending={deletePending}
      />
    </>
  );
}

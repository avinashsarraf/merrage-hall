"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle2, IndianRupee, Loader2, Pencil, PartyPopper } from "lucide-react";
import { cancelMyBooking, updateBookingStatus } from "@/lib/actions/bookings";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { BookingFormModal, type AddonRef, type BookingEdit, type HallRef, type PkgRef } from "./booking-form";
import { RecordPaymentModal } from "./record-payment";

export function BookingActions({
  booking,
  hall,
  packages,
  addons,
  isManager,
  canCancel,
}: {
  booking: BookingEdit & {
    advanceAmount: number;
    totalAmount: number;
    paidAmount: number;
    customerNameLabel: string;
    eventTypeLabel: string;
  };
  hall: HallRef;
  packages: PkgRef[];
  addons: AddonRef[];
  isManager: boolean;
  canCancel: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [paying, setPaying] = useState(false);

  function setStatus(status: string, label: string) {
    setBusy(status);
    startTransition(async () => {
      const res = isManager ? await updateBookingStatus(booking.id, status) : await cancelMyBooking(booking.id);
      setBusy(null);
      if (res.ok) {
        toast({ title: label, variant: "success" });
        router.refresh();
      } else {
        toast({ title: "Action failed", description: res.error, variant: "error" });
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isManager ? (
        <>
          {booking.status === "PENDING" ? (
            <Button size="sm" disabled={busy !== null} onClick={() => setStatus("CONFIRMED", "Booking confirmed")}>
              {busy === "CONFIRMED" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Confirm
            </Button>
          ) : null}
          {booking.status === "CONFIRMED" ? (
            <Button size="sm" variant="gold" disabled={busy !== null} onClick={() => setStatus("COMPLETED", "Marked completed 🎉")}>
              {busy === "COMPLETED" ? <Loader2 className="h-4 w-4 animate-spin" /> : <PartyPopper className="h-4 w-4" />}
              Complete
            </Button>
          ) : null}
          <Button size="sm" variant="secondary" onClick={() => setPaying(true)}>
            <IndianRupee className="h-4 w-4" /> Record payment
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        </>
      ) : null}

      {canCancel ? (
        <Button
          size="sm"
          variant="ghost"
          className="text-rose-600 hover:bg-rose-50"
          disabled={busy !== null}
          onClick={() => setStatus("CANCELLED", "Booking cancelled")}
        >
          {busy === "CANCELLED" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
          Cancel booking
        </Button>
      ) : null}

      <BookingFormModal
        open={editing}
        onClose={() => setEditing(false)}
        hall={hall}
        packages={packages}
        addons={addons}
        booking={booking}
        onSaved={() => {
          setEditing(false);
          router.refresh();
        }}
      />

      <RecordPaymentModal
        open={paying}
        onClose={() => setPaying(false)}
        booking={{
          id: booking.id,
          customerName: booking.customerNameLabel,
          eventType: booking.eventTypeLabel,
          totalAmount: booking.totalAmount,
          paidAmount: booking.paidAmount,
          advanceAmount: booking.advanceAmount,
        }}
        onSaved={() => {
          setPaying(false);
          router.refresh();
        }}
      />
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ban, CalendarDays, Eye, Loader2, MapPin, Users } from "lucide-react";
import { cancelMyBooking } from "@/lib/actions/bookings";
import { cn, dateKey, formatDate, formatINR } from "@/lib/utils";
import { Photo } from "@/components/ui/photo";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "./status-badge";
import { useToast } from "@/components/ui/toast";

export type MyBooking = {
  id: string;
  hallName: string;
  hallCity: string;
  hallSlug: string;
  hallImage: string | null;
  eventType: string;
  eventDate: string;
  slot: string;
  guestCount: number;
  menuPackageName: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
};

export function MyBookings({ bookings }: { bookings: MyBooking[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const todayK = dateKey(new Date());

  function cancel(b: MyBooking) {
    setBusyId(b.id);
    setOverrides((s) => ({ ...s, [b.id]: "CANCELLED" })); // optimistic
    startTransition(async () => {
      const res = await cancelMyBooking(b.id);
      setBusyId(null);
      if (res.ok) {
        toast({ title: "Booking cancelled", description: res.message, variant: "success" });
        router.refresh();
      } else {
        setOverrides((s) => {
          const next = { ...s };
          delete next[b.id];
          return next;
        });
        toast({ title: "Couldn't cancel", description: res.error, variant: "error" });
      }
    });
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title="No bookings yet"
          description="Browse verified venues, pick a date, and your bookings will appear here."
          action={
            <Link href="/halls" className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-800 px-4 text-sm font-medium text-white transition hover:bg-brand-900">
              Browse venues
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((b) => {
        const status = overrides[b.id] ?? b.status;
        const cancellable =
          (status === "PENDING" || status === "CONFIRMED") && b.eventDate >= todayK && busyId !== b.id;
        const paidPct = b.totalAmount > 0 ? Math.min(100, Math.round((b.paidAmount / b.totalAmount) * 100)) : 0;

        return (
          <Card key={b.id} className={cn("overflow-hidden transition-opacity", status === "CANCELLED" && "opacity-60")}>
            <div className="flex flex-col sm:flex-row">
              <Photo
                src={b.hallImage}
                alt={b.hallName}
                fallbackLabel={b.hallName}
                className="h-40 w-full shrink-0 object-cover sm:h-auto sm:w-44 lg:w-52"
              />
              <div className="min-w-0 flex-1 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/halls/${b.hallSlug}`} className="font-display text-lg font-semibold text-stone-900 hover:text-brand-800">
                      {b.hallName}
                    </Link>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-500">
                      <MapPin className="h-3.5 w-3.5 text-brand-400" />
                      {b.hallCity} · <Users className="ml-1 h-3.5 w-3.5 text-stone-300" /> {b.guestCount.toLocaleString("en-IN")} guests
                    </p>
                  </div>
                  <BookingStatusBadge status={status} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 font-semibold text-brand-800 ring-1 ring-brand-100">
                    {b.eventType}
                  </span>
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 font-medium text-stone-600">
                    {formatDate(b.eventDate)} · {b.slot === "FULL_DAY" ? "Full day" : b.slot === "LUNCH" ? "Lunch" : "Dinner"}
                  </span>
                  {b.menuPackageName ? (
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 font-medium text-stone-600">{b.menuPackageName}</span>
                  ) : null}
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-display text-lg font-bold text-stone-900">{formatINR(b.totalAmount)}</span>
                    <span className={cn("text-xs font-medium tabular-nums", b.paidAmount >= b.totalAmount && b.paidAmount > 0 ? "text-emerald-600" : "text-stone-500")}>
                      {b.paidAmount > 0 ? `${formatINR(b.paidAmount)} paid` : "Awaiting confirmation"}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", paidPct >= 100 ? "bg-emerald-500" : "bg-gold-400")}
                      style={{ width: `${paidPct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <Link
                    href={`/dashboard/bookings/${b.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-50"
                  >
                    <Eye className="h-3.5 w-3.5" /> View details
                  </Link>
                  {cancellable ? (
                    <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50" onClick={() => cancel(b)}>
                      {busyId === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                      Cancel booking
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

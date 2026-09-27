"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { saveBooking } from "@/lib/actions/bookings";
import { computeTotals, type AddonSelection } from "@/lib/pricing";
import { EVENT_TYPES, SLOTS } from "@/lib/constants";
import { formatINR } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export type BookingEdit = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  eventType: string;
  eventDate: string;
  slot: string;
  guestCount: number;
  menuPackageId: string | null;
  hallRent: number;
  discount: number;
  advanceAmount: number;
  status: string;
  notes: string;
  addons: { id: string; qty: number }[];
};

export type HallRef = { id: string; name: string; baseRent: number; capacity: number };
export type PkgRef = { id: string; name: string; pricePerPlate: number };
export type AddonRef = { id: string; name: string; price: number; unit: string };

export function BookingFormModal({
  open,
  onClose,
  hall,
  packages,
  addons,
  booking,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  hall: HallRef;
  packages: PkgRef[];
  addons: AddonRef[];
  booking?: BookingEdit | null;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [eventType, setEventType] = useState("Wedding");
  const [eventDate, setEventDate] = useState("");
  const [slot, setSlot] = useState("DINNER");
  const [guests, setGuests] = useState(200);
  const [packageId, setPackageId] = useState("");
  const [hallRent, setHallRent] = useState(hall.baseRent);
  const [discount, setDiscount] = useState(0);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [status, setStatus] = useState("PENDING");
  const [notes, setNotes] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!open) return;
    if (booking) {
      setCustomerName(booking.customerName);
      setCustomerPhone(booking.customerPhone);
      setCustomerEmail(booking.customerEmail);
      setEventType(booking.eventType);
      setEventDate(booking.eventDate);
      setSlot(booking.slot);
      setGuests(booking.guestCount);
      setPackageId(booking.menuPackageId ?? "");
      setHallRent(booking.hallRent);
      setDiscount(booking.discount);
      setAdvanceAmount(booking.advanceAmount);
      setStatus(booking.status);
      setNotes(booking.notes);
      setQty(Object.fromEntries(booking.addons.map((a) => [a.id, a.qty])));
    } else {
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setEventType("Wedding");
      setEventDate("");
      setSlot("DINNER");
      setGuests(200);
      setPackageId(packages[0]?.id ?? "");
      setHallRent(hall.baseRent);
      setDiscount(0);
      setAdvanceAmount(0);
      setStatus("PENDING");
      setNotes("");
      setQty({});
    }
  }, [open, booking, hall.baseRent, packages]);

  const selectedPkg = packages.find((p) => p.id === packageId) ?? null;

  const selectedAddons: AddonSelection[] = useMemo(
    () =>
      Object.entries(qty)
        .filter(([, q]) => q > 0)
        .map(([id, q]) => {
          const a = addons.find((x) => x.id === id);
          return a ? { id: a.id, name: a.name, price: a.price, qty: q, unit: a.unit } : null;
        })
        .filter((x): x is AddonSelection => !!x),
    [qty, addons]
  );

  const totals = computeTotals({
    hallRent,
    guestCount: guests,
    platePrice: selectedPkg?.pricePerPlate ?? 0,
    addons: selectedAddons,
    discount,
  });

  function submit() {
    const fd = new FormData();
    if (booking) fd.set("id", booking.id);
    fd.set("customerName", customerName);
    fd.set("customerPhone", customerPhone);
    fd.set("customerEmail", customerEmail);
    fd.set("eventType", eventType);
    fd.set("eventDate", eventDate);
    fd.set("slot", slot);
    fd.set("guestCount", String(guests));
    fd.set("menuPackageId", packageId);
    fd.set("hallRent", String(hallRent));
    fd.set("discount", String(discount));
    fd.set("advanceAmount", String(advanceAmount));
    fd.set("status", status);
    fd.set("notes", notes);
    fd.set("addons", JSON.stringify(selectedAddons.map((a) => ({ id: a.id, qty: a.qty }))));

    startTransition(async () => {
      const res = await saveBooking(fd);
      if (res.ok) {
        toast({ title: booking ? "Booking updated" : "Booking created", description: `${customerName} · ${formatINR(totals.totalAmount)}`, variant: "success" });
        onSaved();
      } else {
        toast({ title: "Couldn't save booking", description: res.error, variant: "error" });
      }
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={booking ? "Edit booking" : "New booking"}
      description={booking ? `Update details for ${booking.customerName}` : `Add a walk-in or phone booking for ${hall.name}`}
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Customer name *">
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. Priya & Aarav" />
          </Field>
          <Field label="Phone *">
            <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+91 …" />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Email" className="sm:col-span-2">
            <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="optional" />
          </Field>
          <Field label="Event type">
            <Select value={eventType} onChange={(e) => setEventType(e.target.value)}>
              {EVENT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Event date *">
            <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          </Field>
          <Field label="Slot">
            <Select value={slot} onChange={(e) => setSlot(e.target.value)}>
              {SLOTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={`Guests (cap ${hall.capacity.toLocaleString("en-IN")})`}>
            <Input type="number" min={1} value={guests} onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 0))} />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Menu package" hint={selectedPkg ? `${formatINR(selectedPkg.pricePerPlate)} per plate` : "Venue only"}>
            <Select value={packageId} onChange={(e) => setPackageId(e.target.value)}>
              <option value="">Venue only (no catering)</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatINR(p.pricePerPlate)}/plate
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Venue rent (₹)">
            <Input type="number" min={0} value={hallRent} onChange={(e) => setHallRent(Math.max(0, Number(e.target.value) || 0))} />
          </Field>
        </div>

        {addons.length ? (
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">Add-ons</p>
            <div className="grid max-h-44 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
              {addons.map((a) => {
                const q = qty[a.id] ?? 0;
                return (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => setQty((s) => ({ ...s, [a.id]: q > 0 ? 0 : 1 }))}
                    className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition ${
                      q > 0 ? "border-brand-300 bg-brand-50" : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-stone-800">{a.name}</span>
                      <span className="block text-[11px] text-stone-400">{formatINR(a.price)}</span>
                    </span>
                    {q > 0 ? <span className="rounded-full bg-brand-700 px-2 py-0.5 text-[10px] font-bold text-white">Added</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Discount (₹)">
            <Input type="number" min={0} value={discount} onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))} />
          </Field>
          <Field label="Advance to confirm (₹)">
            <Input type="number" min={0} value={advanceAmount} onChange={(e) => setAdvanceAmount(Math.max(0, Number(e.target.value) || 0))} />
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </Field>
        </div>

        <Field label="Notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Jain counters, timing, decor requests…" className="min-h-[60px]" />
        </Field>

        {/* live estimate */}
        <div className="rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-200/70">
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between text-stone-600">
              <dt>Venue rent</dt>
              <dd className="tabular-nums">{formatINR(totals.hallRent)}</dd>
            </div>
            {selectedPkg ? (
              <div className="flex justify-between text-stone-600">
                <dt>Catering ({guests.toLocaleString("en-IN")} guests)</dt>
                <dd className="tabular-nums">{formatINR(totals.cateringTotal)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between text-stone-600">
              <dt>Add-ons</dt>
              <dd className="tabular-nums">{formatINR(totals.addonsTotal)}</dd>
            </div>
            {discount > 0 ? (
              <div className="flex justify-between text-emerald-600">
                <dt>Discount</dt>
                <dd className="tabular-nums">− {formatINR(totals.discount)}</dd>
              </div>
            ) : null}
            <div className="flex items-baseline justify-between border-t border-stone-200 pt-2">
              <dt className="font-display font-bold text-stone-900">Total</dt>
              <dd className="font-display text-lg font-bold text-brand-800 tabular-nums">{formatINR(totals.totalAmount)}</dd>
            </div>
          </dl>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : booking ? (
              "Save changes"
            ) : (
              "Create booking"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

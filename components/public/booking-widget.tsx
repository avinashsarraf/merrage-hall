"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarCheck, Loader2, LogIn, Minus, Plus, ShieldCheck } from "lucide-react";
import { checkAvailability, createWebsiteBooking } from "@/lib/actions/bookings";
import { computeTotals, type AddonSelection } from "@/lib/pricing";
import { EVENT_TYPES, SLOTS } from "@/lib/constants";
import { cn, formatINR, toDateInput } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Button, buttonClasses } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type PkgOption = { id: string; name: string; pricePerPlate: number; dietType: string; itemCount: number };
type AddonOption = { id: string; name: string; price: number; unit: string; category: string; description: string };

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
}

export function BookingWidget({
  hall,
  packages,
  addons,
  signedIn,
}: {
  hall: { id: string; slug: string; name: string; baseRent: number; capacity: number };
  packages: PkgOption[];
  addons: AddonOption[];
  signedIn: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [eventType, setEventType] = useState("Wedding");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("DINNER");
  const [guests, setGuests] = useState(Math.min(200, hall.capacity));
  const [packageId, setPackageId] = useState(packages[0]?.id ?? "");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [availability, setAvailability] = useState<{ available: boolean; checking: boolean }>({ available: true, checking: false });

  const selectedPkg = packages.find((p) => p.id === packageId) ?? null;
  const selectedAddons: AddonSelection[] = useMemo(
    () =>
      Object.entries(qty)
        .filter(([, q]) => q > 0)
        .map(([id, q]) => {
          const a = addons.find((x) => x.id === id)!;
          return { id: a.id, name: a.name, price: a.price, qty: q, unit: a.unit };
        })
        .filter((x) => x.id),
    [qty, addons]
  );

  const totals = computeTotals({
    hallRent: hall.baseRent,
    guestCount: guests,
    platePrice: selectedPkg?.pricePerPlate ?? 0,
    addons: selectedAddons,
    discount: 0,
  });
  const advance = Math.round((totals.totalAmount * 0.25) / 1000) * 1000;

  // availability check whenever date / slot changes
  useEffect(() => {
    let stale = false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    setAvailability((s) => ({ ...s, checking: true }));
    checkAvailability(hall.id, date, slot)
      .then((r) => {
        if (!stale) setAvailability({ available: r.available, checking: false });
      })
      .catch(() => {
        if (!stale) setAvailability({ available: true, checking: false });
      });
    return () => {
      stale = true;
    };
  }, [date, slot, hall.id]);

  const canSubmit = date && availability.available && !availability.checking;

  function submit() {
    if (!canSubmit) return;
    const fd = new FormData();
    fd.set("hallId", hall.id);
    fd.set("eventDate", date);
    fd.set("slot", slot);
    fd.set("guestCount", String(guests));
    fd.set("menuPackageId", packageId);
    fd.set("eventType", eventType);
    fd.set("notes", notes);
    fd.set("addons", JSON.stringify(selectedAddons.map((a) => ({ id: a.id, qty: a.qty }))));
    startTransition(async () => {
      const res = await createWebsiteBooking(fd);
      if (res.ok) {
        toast({ title: "Booking request sent!", description: res.message, variant: "success" });
        router.push("/dashboard/bookings");
      } else {
        toast({ title: "Couldn't book", description: res.error, variant: "error" });
      }
    });
  }

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-brand-800 to-brand-950 px-5 py-4 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gold-300">Check availability</p>
        <p className="mt-1 font-display text-xl font-bold">
          {formatINR(hall.baseRent)}
          <span className="text-sm font-medium text-brand-100/80"> venue rent / day</span>
        </p>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Event date">
            <Input
              type="date"
              min={localToday()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
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
        </div>

        {date ? (
          availability.checking ? (
            <p className="flex items-center gap-2 rounded-xl bg-stone-50 px-3 py-2 text-xs font-medium text-stone-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking availability…
            </p>
          ) : availability.available ? (
            <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
              <CalendarCheck className="h-3.5 w-3.5" /> Good news — this date is available!
            </p>
          ) : (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-100">
              Already booked for this date &amp; slot. Try another date or slot.
            </p>
          )
        ) : (
          <p className="rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-500">
            Pick a date to check live availability.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Event type">
            <Select value={eventType} onChange={(e) => setEventType(e.target.value)}>
              {EVENT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label={`Guests (max ${hall.capacity.toLocaleString("en-IN")})`}>
            <Input
              type="number"
              min={20}
              max={hall.capacity}
              value={guests}
              onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 0))}
            />
          </Field>
        </div>

        <Field label="Menu package" hint={selectedPkg ? `${selectedPkg.itemCount} dishes · ${selectedPkg.dietType === "VEG" ? "Vegetarian" : selectedPkg.dietType === "NON_VEG" ? "Non-veg included" : selectedPkg.dietType}` : "Venue only — no catering"}>
          <Select value={packageId} onChange={(e) => setPackageId(e.target.value)}>
            <option value="">Venue only (no catering)</option>
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {formatINR(p.pricePerPlate)}/plate
              </option>
            ))}
          </Select>
        </Field>

        {addons.length ? (
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">Add-ons (optional)</p>
            <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
              {addons.map((a) => {
                const q = qty[a.id] ?? 0;
                return (
                  <div
                    key={a.id}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-xl border px-3 py-2 transition",
                      q > 0 ? "border-brand-200 bg-brand-50/60" : "border-stone-200 bg-white"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-stone-800">{a.name}</p>
                      <p className="text-[11px] text-stone-400">{formatINR(a.price)} · {a.unit}</p>
                    </div>
                    {q > 0 ? (
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setQty((s) => ({ ...s, [a.id]: Math.max(0, q - 1) }))}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-stone-600 ring-1 ring-stone-200 transition hover:bg-stone-50"
                          aria-label={`Reduce ${a.name}`}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold tabular-nums text-brand-800">{q}</span>
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setQty((s) => ({ ...s, [a.id]: 1 }))}
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition",
                        q > 0 ? "bg-brand-700 text-white hover:bg-brand-800" : "bg-stone-100 text-stone-500 hover:bg-brand-100 hover:text-brand-700"
                      )}
                      aria-label={`Add ${a.name}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <Field label="Notes for the venue (optional)">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Jain counters, baraat timing, decor ideas…"
            className="min-h-[64px]"
          />
        </Field>

        {/* live estimate */}
        <div className="rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-200/70">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-stone-400">Live estimate</p>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between text-stone-600">
              <dt>Venue rent</dt>
              <dd className="font-medium tabular-nums">{formatINR(totals.hallRent)}</dd>
            </div>
            {selectedPkg ? (
              <div className="flex justify-between text-stone-600">
                <dt>
                  Catering · {guests.toLocaleString("en-IN")} × {formatINR(selectedPkg.pricePerPlate)}
                </dt>
                <dd className="font-medium tabular-nums">{formatINR(totals.cateringTotal)}</dd>
              </div>
            ) : null}
            {selectedAddons.map((a) => (
              <div key={a.id} className="flex justify-between text-stone-600">
                <dt className="truncate pr-2">{a.qty > 1 ? `${a.name} ×${a.qty}` : a.name}</dt>
                <dd className="font-medium tabular-nums">{formatINR(a.price * a.qty)}</dd>
              </div>
            ))}
            <div className="mt-2 flex items-baseline justify-between border-t border-stone-200 pt-2.5">
              <dt className="font-display text-sm font-bold text-stone-900">Estimated total</dt>
              <dd className="font-display text-xl font-bold text-brand-800 tabular-nums">{formatINR(totals.totalAmount)}</dd>
            </div>
            <p className="text-[11px] text-stone-400">
              Advance to confirm ≈ {formatINR(advance)} · balance on event day
            </p>
          </dl>
        </div>

        {signedIn ? (
          <Button variant="primary" size="lg" className="w-full" disabled={!canSubmit || pending} onClick={submit}>
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Sending request…
              </>
            ) : (
              <>
                <CalendarCheck className="h-4 w-4" /> Request booking
              </>
            )}
          </Button>
        ) : (
          <Link href={`/login?next=/halls/${hall.slug}`} className={buttonClasses("primary", "lg", "w-full")}>
            <LogIn className="h-4 w-4" /> Log in to request booking
          </Link>
        )}
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          Free cancellation before confirmation · no hidden charges
        </p>
      </div>
    </Card>
  );
}

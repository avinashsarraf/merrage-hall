"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { addons as addonsTable, bookings, halls, menuPackages, payments } from "@/lib/schema";
import { requireHallAccess, requireUser } from "@/lib/auth";
import { newId } from "@/lib/ids";
import { computeTotals, type AddonSelection } from "@/lib/pricing";
import { dateKey, fail, ok, type ActionResult } from "@/lib/utils";
import { getAvailability } from "@/lib/queries";
import type { BookingStatus, BookingSlot } from "@/lib/schema";

const SLOTS: BookingSlot[] = ["LUNCH", "DINNER", "FULL_DAY"];
const STATUSES: BookingStatus[] = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];

function parseAddonsFromForm(raw: FormDataEntryValue | null): { id: string; qty: number }[] {
  try {
    const arr = JSON.parse(String(raw ?? "[]"));
    if (!Array.isArray(arr)) return [];
    return arr
      .map((x: unknown) => ({ id: String((x as { id?: string })?.id ?? ""), qty: Math.max(1, Number((x as { qty?: number })?.qty ?? 1)) }))
      .filter((x) => x.id);
  } catch {
    return [];
  }
}

/** Re-price the selected addons against the venue's catalog (never trust client prices). */
async function priceAddons(hallId: string, raw: FormDataEntryValue | null): Promise<AddonSelection[]> {
  const wanted = parseAddonsFromForm(raw);
  if (!wanted.length) return [];
  const rows = await db.select().from(addonsTable).where(eq(addonsTable.hallId, hallId));
  const byId = new Map(rows.map((r) => [r.id, r]));
  return wanted
    .map((w) => {
      const a = byId.get(w.id);
      return a ? { id: a.id, name: a.name, price: a.price, qty: w.qty, unit: a.unit } : null;
    })
    .filter((x): x is AddonSelection => !!x);
}

async function slotTaken(hallId: string, date: string, slot: BookingSlot, exceptBookingId?: string) {
  const rows = await db
    .select({ slot: bookings.slot })
    .from(bookings)
    .where(
      and(
        eq(bookings.hallId, hallId),
        eq(bookings.eventDate, date),
        ne(bookings.status, "CANCELLED"),
        exceptBookingId ? ne(bookings.id, exceptBookingId) : undefined
      )
    );
  return rows.some((r) => r.slot === "FULL_DAY" || slot === "FULL_DAY" || r.slot === slot);
}

export async function saveBooking(formData: FormData): Promise<ActionResult> {
  const { hall } = await requireHallAccess();

  const id = String(formData.get("id") ?? "");
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerPhone = String(formData.get("customerPhone") ?? "").trim();
  const customerEmail = String(formData.get("customerEmail") ?? "").trim();
  const eventType = String(formData.get("eventType") ?? "Wedding");
  const eventDate = String(formData.get("eventDate") ?? "");
  const slotRaw = String(formData.get("slot") ?? "DINNER");
  const slot: BookingSlot = SLOTS.includes(slotRaw as BookingSlot) ? (slotRaw as BookingSlot) : "DINNER";
  const guestCount = Math.max(1, Number(formData.get("guestCount") ?? 100) || 100);
  const packageId = String(formData.get("menuPackageId") ?? "");
  const hallRent = Math.max(0, Number(formData.get("hallRent") ?? hall.baseRent) || 0);
  const discount = Math.max(0, Number(formData.get("discount") ?? 0) || 0);
  const advanceAmount = Math.max(0, Number(formData.get("advanceAmount") ?? 0) || 0);
  const notes = String(formData.get("notes") ?? "");
  const statusRaw = String(formData.get("status") ?? "PENDING");
  const status: BookingStatus = STATUSES.includes(statusRaw as BookingStatus) ? (statusRaw as BookingStatus) : "PENDING";

  if (!customerName || !customerPhone) return fail("Customer name and phone are required.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return fail("Pick a valid event date.");

  // package must belong to this venue
  let pkg = null as { id: string; name: string; pricePerPlate: number } | null;
  if (packageId) {
    const rows = await db
      .select()
      .from(menuPackages)
      .where(and(eq(menuPackages.id, packageId), eq(menuPackages.hallId, hall.id)))
      .limit(1);
    pkg = rows[0] ? { id: rows[0].id, name: rows[0].name, pricePerPlate: rows[0].pricePerPlate } : null;
  }

  const selectedAddons = await priceAddons(hall.id, formData.get("addons"));
  const totals = computeTotals({
    hallRent,
    guestCount,
    platePrice: pkg?.pricePerPlate ?? 0,
    addons: selectedAddons,
    discount,
  });

  if (status !== "CANCELLED" && (await slotTaken(hall.id, eventDate, slot, id || undefined))) {
    return fail("The venue is already booked for this date & slot.");
  }

  const values = {
    hallId: hall.id,
    customerName,
    customerPhone,
    customerEmail,
    eventType,
    eventDate,
    slot,
    guestCount,
    menuPackageId: pkg?.id ?? null,
    menuPackageName: pkg?.name ?? "",
    platePrice: pkg?.pricePerPlate ?? 0,
    hallRent: totals.hallRent,
    addons: selectedAddons,
    cateringTotal: totals.cateringTotal,
    addonsTotal: totals.addonsTotal,
    discount: totals.discount,
    totalAmount: totals.totalAmount,
    advanceAmount,
    status,
    notes,
    source: "DASHBOARD" as const,
    updatedAt: new Date(),
  };

  if (id) {
    const existing = await db.select().from(bookings).where(and(eq(bookings.id, id), eq(bookings.hallId, hall.id))).limit(1);
    if (!existing[0]) return fail("Booking not found.");
    const paid = existing[0].paidAmount;
    await db
      .update(bookings)
      .set({ ...values, paidAmount: Math.min(paid, totals.totalAmount) })
      .where(eq(bookings.id, id));
    revalidatePath("/dashboard/bookings");
    revalidatePath(`/dashboard/bookings/${id}`);
    revalidatePath("/dashboard/calendar");
    return ok("Booking updated.");
  }

  const bookingId = newId("bkg");
  await db.insert(bookings).values({ id: bookingId, ...values, paidAmount: 0, createdAt: new Date() });
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
  return ok("Booking created.");
}

export async function updateBookingStatus(id: string, status: string): Promise<ActionResult> {
  const { hall } = await requireHallAccess();
  if (!STATUSES.includes(status as BookingStatus)) return fail("Invalid status.");
  const rows = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, id), eq(bookings.hallId, hall.id)))
    .limit(1);
  if (!rows[0]) return fail("Booking not found.");
  await db
    .update(bookings)
    .set({ status: status as BookingStatus, updatedAt: new Date() })
    .where(eq(bookings.id, id));
  revalidatePath("/dashboard/bookings");
  revalidatePath(`/dashboard/bookings/${id}`);
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
  return ok(`Marked as ${status.toLowerCase()}.`);
}

export async function deleteBooking(id: string): Promise<ActionResult> {
  const { hall } = await requireHallAccess();
  const rows = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, id), eq(bookings.hallId, hall.id)))
    .limit(1);
  if (!rows[0]) return fail("Booking not found.");
  await db.delete(bookings).where(eq(bookings.id, id));
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
  return ok("Booking deleted.");
}

export async function recordPayment(formData: FormData): Promise<ActionResult> {
  const { hall } = await requireHallAccess();
  const bookingId = String(formData.get("bookingId") ?? "");
  const amount = Math.round(Number(formData.get("amount") ?? 0));
  const method = String(formData.get("method") ?? "UPI");
  const reference = String(formData.get("reference") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!amount || amount <= 0) return fail("Enter a valid amount.");

  const rows = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.hallId, hall.id)))
    .limit(1);
  const booking = rows[0];
  if (!booking) return fail("Booking not found.");

  await db.insert(payments).values({
    id: newId("pay"),
    hallId: hall.id,
    bookingId,
    type: "BOOKING",
    amount,
    method: (["UPI", "CASH", "BANK", "CARD"] as const).includes(method as "UPI") ? (method as "UPI") : "UPI",
    status: "PAID",
    reference,
    description: description || `Payment — ${booking.customerName}`,
  });

  // recompute paid amount from PAID payments
  const payRows = await db.select().from(payments).where(and(eq(payments.bookingId, bookingId), eq(payments.status, "PAID")));
  const paid = payRows.reduce((s, p) => s + p.amount, 0);
  const nextStatus: BookingStatus =
    booking.status === "PENDING" && paid >= booking.advanceAmount && paid > 0 ? "CONFIRMED" : booking.status;

  await db
    .update(bookings)
    .set({ paidAmount: paid, status: nextStatus, updatedAt: new Date() })
    .where(eq(bookings.id, bookingId));

  revalidatePath(`/dashboard/bookings/${bookingId}`);
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard");
  return ok("Payment recorded.");
}

/* ------------------------------ website (client) --------------------------- */

export async function createWebsiteBooking(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const hallId = String(formData.get("hallId") ?? "");
  const eventDate = String(formData.get("eventDate") ?? "");
  const slotRaw = String(formData.get("slot") ?? "DINNER");
  const slot: BookingSlot = SLOTS.includes(slotRaw as BookingSlot) ? (slotRaw as BookingSlot) : "DINNER";
  const guestCount = Math.max(1, Number(formData.get("guestCount") ?? 100) || 100);
  const packageId = String(formData.get("menuPackageId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return fail("Pick a valid event date.");
  if (eventDate < dateKey(new Date())) return fail("Pick a future date for your event.");

  const hallRows = await db.select().from(halls).where(eq(halls.id, hallId)).limit(1);
  const hall = hallRows[0];
  if (!hall || hall.status !== "ACTIVE") return fail("This venue is not accepting bookings right now.");

  const availability = await getAvailability(hall.id, eventDate, slot);
  if (!availability.available) return fail("That date & slot is already taken — please pick another.");

  let pkg = null as { id: string; name: string; pricePerPlate: number } | null;
  if (packageId) {
    const rows = await db
      .select()
      .from(menuPackages)
      .where(and(eq(menuPackages.id, packageId), eq(menuPackages.hallId, hall.id)))
      .limit(1);
    pkg = rows[0] ? { id: rows[0].id, name: rows[0].name, pricePerPlate: rows[0].pricePerPlate } : null;
  }

  const selectedAddons = await priceAddons(hall.id, formData.get("addons"));
  const totals = computeTotals({
    hallRent: hall.baseRent,
    guestCount,
    platePrice: pkg?.pricePerPlate ?? 0,
    addons: selectedAddons,
    discount: 0,
  });
  const advanceAmount = Math.round((totals.totalAmount * 0.25) / 1000) * 1000;

  const bookingId = newId("bkg");
  await db.insert(bookings).values({
    id: bookingId,
    hallId: hall.id,
    bookedByUserId: user.id,
    customerName: user.name,
    customerPhone: user.phone || "—",
    customerEmail: user.email,
    eventType: String(formData.get("eventType") ?? "Wedding"),
    eventDate,
    slot,
    guestCount,
    menuPackageId: pkg?.id ?? null,
    menuPackageName: pkg?.name ?? "",
    platePrice: pkg?.pricePerPlate ?? 0,
    hallRent: totals.hallRent,
    addons: selectedAddons,
    cateringTotal: totals.cateringTotal,
    addonsTotal: totals.addonsTotal,
    discount: 0,
    totalAmount: totals.totalAmount,
    advanceAmount,
    paidAmount: 0,
    status: "PENDING",
    notes,
    source: "WEBSITE",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard");
  return ok(`Request sent — ${hall.name} will confirm shortly. Booking #${bookingId.slice(-6).toUpperCase()}`);
}

export async function cancelMyBooking(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const rows = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  const booking = rows[0];
  if (!booking || booking.bookedByUserId !== user.id) return fail("Booking not found.");
  if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") return fail("This booking can no longer be cancelled online.");
  if (booking.eventDate < dateKey(new Date())) return fail("Past events cannot be cancelled.");
  await db.update(bookings).set({ status: "CANCELLED", updatedAt: new Date() }).where(eq(bookings.id, id));
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard");
  return ok("Booking cancelled. The venue has been notified.");
}

export async function checkAvailability(hallId: string, date: string, slot: string): Promise<{ available: boolean; taken: string[] }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { available: false, taken: [] };
  return getAvailability(hallId, date, slot);
}

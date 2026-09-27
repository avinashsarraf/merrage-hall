import { and, asc, count, desc, eq, gte, ilike, inArray, lte, ne, or, type SQL } from "drizzle-orm";
import { db } from "./db";
import {
  addons,
  bookings,
  halls,
  menuItems,
  menuPackages,
  payments,
  plans,
  platformSettings,
  subscriptions,
  users,
  type Addon,
  type Booking,
  type BookingStatus,
  type Hall,
  type MenuItem,
  type MenuPackage,
  type Payment,
  type Plan,
  type Subscription,
  type User,
} from "./schema";
import { dateKey, monthLabel } from "./utils";

export type BookingWithHall = Booking & { hall: Hall };
export type PaymentWithBooking = Payment & { booking: { customerName: string; eventType: string } | null };

const ACTIVE_BOOKING: BookingStatus[] = ["CONFIRMED", "COMPLETED"];

/* ------------------------------ public site ------------------------------- */

export async function getPublicHalls(opts: { q?: string; city?: string; minCapacity?: number; sort?: string }) {
  const conds: SQL[] = [eq(halls.status, "ACTIVE")];
  if (opts.q) {
    const like = `%${opts.q}%`;
    conds.push(or(ilike(halls.name, like), ilike(halls.city, like), ilike(halls.state, like), ilike(halls.description, like))!);
  }
  if (opts.city) conds.push(eq(halls.city, opts.city));
  if (opts.minCapacity) conds.push(gte(halls.capacity, opts.minCapacity));

  const order =
    opts.sort === "price_asc"
      ? asc(halls.baseRent)
      : opts.sort === "price_desc"
        ? desc(halls.baseRent)
        : opts.sort === "capacity_desc"
          ? desc(halls.capacity)
          : desc(halls.createdAt);

  return db.select().from(halls).where(and(...conds)).orderBy(order).limit(60);
}

export async function getCityList() {
  return db.selectDistinct({ city: halls.city }).from(halls).where(eq(halls.status, "ACTIVE")).orderBy(asc(halls.city));
}

export async function getFeaturedHalls(limit = 3) {
  return db.select().from(halls).where(eq(halls.status, "ACTIVE")).orderBy(desc(halls.capacity)).limit(limit);
}

export async function getHallBySlug(slug: string) {
  const rows = await db.select().from(halls).where(eq(halls.slug, slug)).limit(1);
  const hall = rows[0];
  if (!hall) return null;
  const [addonRows, pkgRows, itemRows] = await Promise.all([
    db.select().from(addons).where(and(eq(addons.hallId, hall.id), eq(addons.isActive, true))).orderBy(asc(addons.category), asc(addons.name)),
    db.select().from(menuPackages).where(and(eq(menuPackages.hallId, hall.id), eq(menuPackages.isActive, true))).orderBy(asc(menuPackages.pricePerPlate)),
    db.select().from(menuItems).where(and(eq(menuItems.hallId, hall.id), eq(menuItems.isActive, true))).orderBy(asc(menuItems.category), asc(menuItems.name)),
  ]);
  return { hall, addons: addonRows, packages: pkgRows, items: itemRows } as {
    hall: Hall;
    addons: Addon[];
    packages: MenuPackage[];
    items: MenuItem[];
  };
}

export async function getSimilarHalls(hall: Hall, limit = 3) {
  return db
    .select()
    .from(halls)
    .where(and(eq(halls.status, "ACTIVE"), ne(halls.id, hall.id)))
    .orderBy(desc(halls.capacity))
    .limit(limit);
}

export async function getPlans(onlyActive = true) {
  const q = db.select().from(plans).orderBy(asc(plans.sortOrder));
  const rows = await q;
  return onlyActive ? rows.filter((p) => p.isActive) : rows;
}

export async function getPlatformSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(platformSettings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

/* ------------------------------- dashboards ------------------------------- */

function monthKeys(n: number) {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}`;
    out.push({ key, label: monthLabel(d.getFullYear(), d.getMonth()) });
  }
  return out;
}

export async function getHallOverview(hallId: string) {
  const now = new Date();
  const todayK = dateKey(now);
  const from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const fromK = dateKey(from);
  const currentYM = todayK.slice(0, 7);

  const [allBookings, windowRows, upcoming, recentPayments, pendingCountRow] = await Promise.all([
    db.select({ status: bookings.status, c: count() }).from(bookings).where(eq(bookings.hallId, hallId)).groupBy(bookings.status),
    db
      .select({ eventDate: bookings.eventDate, status: bookings.status, totalAmount: bookings.totalAmount })
      .from(bookings)
      .where(and(eq(bookings.hallId, hallId), gte(bookings.eventDate, fromK))),
    db
      .select()
      .from(bookings)
      .where(and(eq(bookings.hallId, hallId), gte(bookings.eventDate, todayK), inArray(bookings.status, ["PENDING", "CONFIRMED"])))
      .orderBy(asc(bookings.eventDate))
      .limit(6),
    db.select().from(payments).where(eq(payments.hallId, hallId)).orderBy(desc(payments.createdAt)).limit(5),
    db.select({ c: count() }).from(bookings).where(and(eq(bookings.hallId, hallId), eq(bookings.status, "PENDING"))),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const r of allBookings) statusCounts[r.status] = Number(r.c);

  const months = monthKeys(6).map((m) => ({ ...m, total: 0, count: 0 }));
  for (const b of windowRows) {
    if (!ACTIVE_BOOKING.includes(b.status)) continue;
    const ym = b.eventDate.slice(0, 7);
    const m = months.find((x) => x.key === ym);
    if (m) {
      m.total += b.totalAmount;
      m.count += 1;
    }
  }

  const monthEvents = windowRows.filter((b) => b.eventDate.startsWith(currentYM) && ACTIVE_BOOKING.includes(b.status));
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const bookedDays = new Set(monthEvents.map((b) => b.eventDate)).size;
  const monthRevenue = monthEvents.reduce((s, b) => s + b.totalAmount, 0);

  return {
    statusCounts,
    months,
    upcoming,
    recentPayments,
    pendingCount: Number(pendingCountRow[0]?.c ?? 0),
    totalBookings: Object.values(statusCounts).reduce((s, n) => s + n, 0),
    monthRevenue,
    occupancyPct: Math.round((bookedDays / daysInMonth) * 100),
    upcomingCount: upcoming.length,
  };
}

export async function getCustomerOverview(userId: string) {
  const now = new Date();
  const todayK = dateKey(now);

  const rows = await db
    .select({ booking: bookings, hall: halls })
    .from(bookings)
    .innerJoin(halls, eq(bookings.hallId, halls.id))
    .where(eq(bookings.bookedByUserId, userId))
    .orderBy(desc(bookings.eventDate));

  const all: BookingWithHall[] = rows.map((r) => ({ ...r.booking, hall: r.hall }));
  const upcoming = all
    .filter((b) => b.eventDate >= todayK && (b.status === "PENDING" || b.status === "CONFIRMED"))
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  const spent = all.filter((b) => b.status !== "CANCELLED").reduce((s, b) => s + b.paidAmount, 0);

  return { all, upcoming, spent };
}

export async function getAdminOverview() {
  const now = new Date();
  const currentYM = dateKey(now).slice(0, 7);
  const from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const fromD = new Date(from.getFullYear(), from.getMonth(), 1, 0, 30);

  const [hallRows, subRows, bookingRows, paymentRows, customerCountRow, recentHalls, recentBookings] = await Promise.all([
    db.select({ id: halls.id, status: halls.status, name: halls.name, city: halls.city, slug: halls.slug, createdAt: halls.createdAt, images: halls.images, capacity: halls.capacity }).from(halls),
    db.select({ sub: subscriptions, plan: plans }).from(subscriptions).innerJoin(plans, eq(subscriptions.planId, plans.id)),
    db.select({ eventDate: bookings.eventDate, status: bookings.status, totalAmount: bookings.totalAmount }).from(bookings).where(gte(bookings.eventDate, dateKey(from))),
    db.select({ createdAt: payments.createdAt, type: payments.type, amount: payments.amount, status: payments.status }).from(payments).where(gte(payments.createdAt, fromD)),
    db.select({ c: count() }).from(users).where(eq(users.role, "CUSTOMER")),
    db.select({ hall: halls, owner: users }).from(halls).innerJoin(users, eq(halls.ownerId, users.id)).orderBy(desc(halls.createdAt)).limit(5),
    db.select({ booking: bookings, hall: halls }).from(bookings).innerJoin(halls, eq(bookings.hallId, halls.id)).orderBy(desc(bookings.createdAt)).limit(6),
  ]);

  const hallCounts: Record<string, number> = { PENDING: 0, ACTIVE: 0, SUSPENDED: 0 };
  for (const h of hallRows) hallCounts[h.status] = (hallCounts[h.status] ?? 0) + 1;

  const mrr = subRows.filter((r) => r.sub.status === "ACTIVE").reduce((s, r) => s + r.sub.priceMonthly, 0);

  const months = monthKeys(6).map((m) => ({ ...m, subscriptions: 0, commission: 0 }));
  for (const p of paymentRows) {
    if (p.status !== "PAID" || (p.type !== "SUBSCRIPTION" && p.type !== "COMMISSION")) continue;
    const ym = dateKey(p.createdAt).slice(0, 7);
    const m = months.find((x) => x.key === ym);
    if (m) m[p.type === "SUBSCRIPTION" ? "subscriptions" : "commission"] += p.amount;
  }

  const monthBookings = bookingRows.filter((b) => b.eventDate.startsWith(currentYM) && ACTIVE_BOOKING.includes(b.status));
  const gmv = monthBookings.reduce((s, b) => s + b.totalAmount, 0);
  const commissionMonth = paymentRows
    .filter((p) => p.type === "COMMISSION" && p.status === "PAID" && dateKey(p.createdAt).startsWith(currentYM))
    .reduce((s, p) => s + p.amount, 0);

  return {
    hallCounts,
    totalHalls: hallRows.length,
    mrr,
    months,
    gmv,
    commissionMonth,
    customers: Number(customerCountRow[0]?.c ?? 0),
    totalBookings: bookingRows.length,
    recentHalls: recentHalls.map((r) => ({ ...r.hall, ownerName: r.owner.name })),
    recentBookings: recentBookings.map((r) => ({ ...r.booking, hallName: r.hall.name })),
  };
}

/* -------------------------------- bookings -------------------------------- */

export async function getHallBookings(hallId: string, status?: string) {
  const conds: SQL[] = [eq(bookings.hallId, hallId)];
  if (status && status !== "ALL") conds.push(eq(bookings.status, status as BookingStatus));
  return db.select().from(bookings).where(and(...conds)).orderBy(desc(bookings.eventDate)).limit(200);
}

export async function getBookingDetail(id: string) {
  const rows = await db
    .select({ booking: bookings, hall: halls })
    .from(bookings)
    .innerJoin(halls, eq(bookings.hallId, halls.id))
    .where(eq(bookings.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const paymentRows = await db.select().from(payments).where(eq(payments.bookingId, id)).orderBy(asc(payments.createdAt));
  return { booking: row.booking, hall: row.hall, payments: paymentRows };
}

export async function getCalendarBookings(opts: { hallId?: string; userId?: string; from: string; to: string }) {
  const conds: SQL[] = [gte(bookings.eventDate, opts.from), lte(bookings.eventDate, opts.to)];
  if (opts.hallId) conds.push(eq(bookings.hallId, opts.hallId));
  if (opts.userId) conds.push(eq(bookings.bookedByUserId, opts.userId));
  return db.select().from(bookings).where(and(...conds)).orderBy(asc(bookings.eventDate));
}

export async function getAvailability(hallId: string, date: string, slot: string) {
  const rows = await db
    .select({ slot: bookings.slot, status: bookings.status })
    .from(bookings)
    .where(and(eq(bookings.hallId, hallId), eq(bookings.eventDate, date), ne(bookings.status, "CANCELLED")));
  const conflict = rows.some((r) => r.slot === "FULL_DAY" || slot === "FULL_DAY" || r.slot === slot);
  return { available: !conflict, taken: rows.map((r) => r.slot) };
}

/* ---------------------------------- staff --------------------------------- */

export async function getStaffList(hallId: string) {
  return db.select().from(users).where(and(eq(users.role, "HALL_STAFF"), eq(users.hallId, hallId))).orderBy(asc(users.createdAt));
}

/* ------------------------------ subscriptions ------------------------------ */

export async function getSubscriptionData(hallId: string) {
  const rows = await db
    .select({ sub: subscriptions, plan: plans })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(subscriptions.hallId, hallId))
    .limit(1);
  const invoices = await db
    .select()
    .from(payments)
    .where(and(eq(payments.hallId, hallId), eq(payments.type, "SUBSCRIPTION")))
    .orderBy(desc(payments.createdAt))
    .limit(12);
  return { subscription: rows[0] ? ({ ...rows[0].sub, plan: rows[0].plan } as Subscription & { plan: Plan }) : null, invoices };
}

export async function getSubscriptionUsage(hallId: string) {
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}-01`;
  const [bookingCountRow, staffCountRow] = await Promise.all([
    db.select({ c: count() }).from(bookings).where(and(eq(bookings.hallId, hallId), gte(bookings.createdAt, new Date(monthStart)))),
    db.select({ c: count() }).from(users).where(and(eq(users.role, "HALL_STAFF"), eq(users.hallId, hallId))),
  ]);
  return { bookingsThisMonth: Number(bookingCountRow[0]?.c ?? 0), staffCount: Number(staffCountRow[0]?.c ?? 0) };
}

/* ---------------------------------- admin ---------------------------------- */

export async function getAdminHalls() {
  const rows = await db
    .select({ hall: halls, owner: users, sub: subscriptions, plan: plans })
    .from(halls)
    .innerJoin(users, eq(halls.ownerId, users.id))
    .leftJoin(subscriptions, eq(subscriptions.hallId, halls.id))
    .leftJoin(plans, eq(subscriptions.planId, plans.id))
    .orderBy(desc(halls.createdAt));
  return rows.map((r) => ({
    hall: r.hall,
    ownerName: r.owner.name,
    ownerEmail: r.owner.email,
    plan: r.plan,
    subscription: r.sub,
  }));
}

export async function getAdminPayments(type?: string) {
  const base = db
    .select({ payment: payments, hall: halls, booking: bookings })
    .from(payments)
    .leftJoin(halls, eq(payments.hallId, halls.id))
    .leftJoin(bookings, eq(payments.bookingId, bookings.id));
  const rows =
    type && type !== "ALL"
      ? await base.where(eq(payments.type, type as Payment["type"])).orderBy(desc(payments.createdAt)).limit(150)
      : await base.orderBy(desc(payments.createdAt)).limit(150);
  return rows.map((r) => ({
    ...r.payment,
    hallName: r.hall?.name ?? "—",
    bookingRef: r.booking ? r.booking.customerName : null,
  }));
}

export async function getAdminSubscriptions() {
  const rows = await db
    .select({ sub: subscriptions, plan: plans, hall: halls, owner: users })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .innerJoin(halls, eq(subscriptions.hallId, halls.id))
    .innerJoin(users, eq(halls.ownerId, users.id))
    .orderBy(desc(subscriptions.startedAt));
  return rows.map((r) => ({ ...r.sub, plan: r.plan, hall: r.hall, ownerName: r.owner.name }));
}

export async function getHallPayments(hallId: string, limit = 10) {
  const rows = await db
    .select({ payment: payments, booking: bookings })
    .from(payments)
    .leftJoin(bookings, eq(payments.bookingId, bookings.id))
    .where(eq(payments.hallId, hallId))
    .orderBy(desc(payments.createdAt))
    .limit(limit);
  return rows.map((r) => ({ ...r.payment, bookingCustomer: r.booking?.customerName ?? null }));
}

/* --------------------------------- helpers -------------------------------- */

export async function getUserByEmail(email: string) {
  const rows = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return rows[0] ?? null;
}

export async function getHallMenu(hallId: string) {
  const [items, pkgs] = await Promise.all([
    db.select().from(menuItems).where(eq(menuItems.hallId, hallId)).orderBy(asc(menuItems.category), asc(menuItems.name)),
    db.select().from(menuPackages).where(eq(menuPackages.hallId, hallId)).orderBy(asc(menuPackages.pricePerPlate)),
  ]);
  return { items, packages: pkgs };
}

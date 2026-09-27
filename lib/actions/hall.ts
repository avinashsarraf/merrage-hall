"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { halls, payments, plans, subscriptions, users } from "@/lib/schema";
import { getHallForUser, requireRole, requireUser } from "@/lib/auth";
import { newId } from "@/lib/ids";
import { fail, ok, type ActionResult } from "@/lib/utils";
import { getStaffList } from "@/lib/queries";

/* ------------------------------ venue profile ------------------------------ */

export async function updateHall(formData: FormData): Promise<ActionResult> {
  const user = await requireRole(["HALL_OWNER"]);
  const hall = await getHallForUser(user);
  if (!hall) return fail("No venue found for this account.");

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const pincode = String(formData.get("pincode") ?? "").trim();
  const contactPhone = String(formData.get("contactPhone") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const capacity = Math.max(1, Number(formData.get("capacity") ?? 100) || 100);
  const hallCount = Math.max(1, Number(formData.get("hallCount") ?? 1) || 1);
  const rooms = Math.max(0, Number(formData.get("rooms") ?? 0) || 0);
  const parking = Math.max(0, Number(formData.get("parking") ?? 0) || 0);
  const baseRent = Math.max(0, Number(formData.get("baseRent") ?? 0) || 0);
  const vegPlate = Math.max(0, Number(formData.get("vegPlate") ?? 0) || 0);
  const nonvegPlate = Math.max(0, Number(formData.get("nonvegPlate") ?? 0) || 0);
  const checkIn = String(formData.get("checkIn") ?? "11:00");
  const checkOut = String(formData.get("checkOut") ?? "22:00");
  const amenities = formData.getAll("amenities").map(String).filter(Boolean);
  const images = formData
    .getAll("images")
    .map(String)
    .map((s) => s.trim())
    .filter(Boolean);

  if (!name || !city) return fail("Venue name and city are required.");

  await db
    .update(halls)
    .set({
      name,
      description,
      address,
      city,
      state,
      pincode,
      contactPhone,
      contactEmail,
      capacity,
      hallCount,
      rooms,
      parking,
      baseRent,
      vegPlate,
      nonvegPlate,
      checkIn,
      checkOut,
      amenities,
      images,
      updatedAt: new Date(),
    })
    .where(eq(halls.id, hall.id));

  revalidatePath("/dashboard/hall");
  revalidatePath(`/halls/${hall.slug}`);
  revalidatePath("/halls");
  return ok("Venue profile saved.");
}

/* ---------------------------------- staff ---------------------------------- */

export async function addStaff(formData: FormData): Promise<ActionResult> {
  const user = await requireRole(["HALL_OWNER"]);
  const hall = await getHallForUser(user);
  if (!hall) return fail("No venue found for this account.");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) return fail("Name, email and password are required.");
  if (password.length < 8) return fail("Password must be at least 8 characters.");

  const limit = hall.subscription?.plan.maxStaff ?? 2;
  if (limit !== -1) {
    const staff = await getStaffList(hall.id);
    if (staff.length >= limit) {
      return fail(`Your ${hall.subscription?.plan.name ?? "current"} plan allows ${limit} staff accounts. Upgrade to add more.`);
    }
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) return fail("An account with this email already exists.");

  await db.insert(users).values({
    id: newId("usr"),
    name,
    email,
    phone,
    passwordHash: bcrypt.hashSync(password, 10),
    role: "HALL_STAFF",
    hallId: hall.id,
  });
  revalidatePath("/dashboard/staff");
  return ok(`${name} can now log in as venue staff.`);
}

export async function removeStaff(userId: string): Promise<ActionResult> {
  const user = await requireRole(["HALL_OWNER"]);
  const hall = await getHallForUser(user);
  if (!hall) return fail("No venue found for this account.");
  if (userId === user.id) return fail("You cannot remove yourself.");

  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), eq(users.hallId, hall.id), eq(users.role, "HALL_STAFF")))
    .limit(1);
  if (!rows[0]) return fail("Staff member not found.");
  await db.delete(users).where(eq(users.id, userId));
  revalidatePath("/dashboard/staff");
  return ok("Staff member removed.");
}

/* ------------------------------ custom domains ----------------------------- */

export async function addCustomDomain(formData: FormData): Promise<ActionResult> {
  const user = await requireRole(["HALL_OWNER"]);
  const hall = await getHallForUser(user);
  if (!hall) return fail("No venue found for this account.");

  if (!hall.subscription?.plan.customDomain) {
    return fail("Custom domains are available on Growth & Premium plans.");
  }
  const domain = String(formData.get("domain") ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  if (!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(domain)) return fail("Enter a valid domain, e.g. bookings.yourvenue.com");

  await db.update(halls).set({ customDomain: domain, domainVerified: false, updatedAt: new Date() }).where(eq(halls.id, hall.id));
  revalidatePath("/dashboard/domains");
  return ok(`${domain} added — point your DNS to MerrageHall, then verify.`);
}

export async function verifyCustomDomain(): Promise<ActionResult> {
  const user = await requireRole(["HALL_OWNER"]);
  const hall = await getHallForUser(user);
  if (!hall || !hall.customDomain) return fail("Add a domain first.");

  // simulated DNS check — in production this would query DNS records
  await new Promise((r) => setTimeout(r, 1200));
  await db.update(halls).set({ domainVerified: true, updatedAt: new Date() }).where(eq(halls.id, hall.id));
  revalidatePath("/dashboard/domains");
  return ok(`${hall.customDomain} verified — your venue site is live on it.`);
}

export async function removeCustomDomain(): Promise<ActionResult> {
  const user = await requireRole(["HALL_OWNER"]);
  const hall = await getHallForUser(user);
  if (!hall) return fail("No venue found for this account.");
  await db.update(halls).set({ customDomain: null, domainVerified: false, updatedAt: new Date() }).where(eq(halls.id, hall.id));
  revalidatePath("/dashboard/domains");
  return ok("Custom domain removed.");
}

/* ------------------------------- subscription ------------------------------ */

export async function changePlan(planId: string): Promise<ActionResult> {
  const user = await requireRole(["HALL_OWNER"]);
  const hall = await getHallForUser(user);
  if (!hall) return fail("No venue found for this account.");

  const rows = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
  const plan = rows[0];
  if (!plan || !plan.isActive) return fail("Plan not available.");

  const existing = await db.select().from(subscriptions).where(eq(subscriptions.hallId, hall.id)).limit(1);
  if (existing[0]) {
    await db
      .update(subscriptions)
      .set({ planId: plan.id, priceMonthly: plan.priceMonthly, status: "ACTIVE", startedAt: new Date() })
      .where(eq(subscriptions.id, existing[0].id));
  } else {
    await db.insert(subscriptions).values({
      id: newId("sub"),
      hallId: hall.id,
      planId: plan.id,
      status: "ACTIVE",
      priceMonthly: plan.priceMonthly,
    });
  }

  await db.insert(payments).values({
    id: newId("pay"),
    hallId: hall.id,
    type: "SUBSCRIPTION",
    amount: plan.priceMonthly,
    method: "UPI",
    status: "PAID",
    description: `${plan.name} plan subscription`,
  });

  revalidatePath("/dashboard/subscription");
  revalidatePath("/dashboard");
  return ok(`You're now on the ${plan.name} plan.`);
}

/* --------------------------------- profile --------------------------------- */

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");

  if (!name) return fail("Name cannot be empty.");

  const update: Record<string, unknown> = { name, phone, updatedAt: new Date() };

  if (newPassword) {
    if (newPassword.length < 8) return fail("New password must be at least 8 characters.");
    if (!bcrypt.compareSync(currentPassword, user.passwordHash)) return fail("Current password is incorrect.");
    update.passwordHash = bcrypt.hashSync(newPassword, 10);
  }

  await db.update(users).set(update).where(eq(users.id, user.id));
  revalidatePath("/dashboard/profile");
  return ok("Profile updated.");
}


"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { halls, plans, subscriptions, users } from "@/lib/schema";
import { createSession, destroySession } from "@/lib/auth";
import { getUserByEmail } from "@/lib/queries";
import { newId } from "@/lib/ids";
import { slugify, type ActionResult } from "@/lib/utils";

export async function login(formData: FormData): Promise<ActionResult & { role?: string }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { ok: false, error: "Enter your email and password." };

  const user = await getUserByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return { ok: false, error: "Invalid email or password. Try a demo account below." };
  }
  await createSession(user.id);
  return { ok: true, role: user.role };
}

export async function registerClient(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) return { ok: false, error: "Please fill in all required fields." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };

  const existing = await getUserByEmail(email);
  if (existing) return { ok: false, error: "An account with this email already exists. Try logging in." };

  const id = newId("usr");
  await db.insert(users).values({
    id,
    name,
    email,
    phone,
    passwordHash: bcrypt.hashSync(password, 10),
    role: "CUSTOMER",
  });
  await createSession(id);
  return { ok: true, message: "Welcome to MerrageHall!" };
}

export async function registerOwner(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const venueName = String(formData.get("venueName") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const capacity = Number(formData.get("capacity") ?? 500) || 500;

  if (!name || !email || !password || !venueName || !city) {
    return { ok: false, error: "Please fill in all required fields." };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };

  const existing = await getUserByEmail(email);
  if (existing) return { ok: false, error: "An account with this email already exists. Try logging in." };

  // unique slug
  const existingSlugs = new Set((await db.select({ slug: halls.slug }).from(halls)).map((h) => h.slug));
  let slug = slugify(venueName) || `venue-${Date.now()}`;
  let candidate = slug;
  let i = 2;
  while (existingSlugs.has(candidate)) candidate = `${slug}-${i++}`;
  slug = candidate;

  const userId = newId("usr");
  await db.insert(users).values({
    id: userId,
    name,
    email,
    phone,
    passwordHash: bcrypt.hashSync(password, 10),
    role: "HALL_OWNER",
  });

  const hallId = newId("hall");
  await db.insert(halls).values({
    id: hallId,
    ownerId: userId,
    name: venueName,
    slug,
    status: "PENDING",
    city,
    state,
    capacity,
    contactPhone: phone,
    contactEmail: email,
    description: "",
  });

  // Start every new venue on a trialing Starter plan
  const starter = await db.select().from(plans).where(eq(plans.slug, "starter")).limit(1);
  if (starter[0]) {
    await db.insert(subscriptions).values({
      id: newId("sub"),
      hallId,
      planId: starter[0].id,
      status: "TRIALING",
      priceMonthly: starter[0].priceMonthly,
    });
  }

  await createSession(userId);
  return { ok: true, message: "Venue registered — we'll review it shortly." };
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

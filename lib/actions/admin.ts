"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { halls, plans, platformSettings, subscriptions } from "@/lib/schema";
import { requireAdmin } from "@/lib/auth";
import { newId } from "@/lib/ids";
import { fail, ok, type ActionResult } from "@/lib/utils";
import type { HallStatus, SubscriptionStatus } from "@/lib/schema";

const HALL_STATUSES: HallStatus[] = ["PENDING", "ACTIVE", "SUSPENDED"];
const SUB_STATUSES: SubscriptionStatus[] = ["TRIALING", "ACTIVE", "PAST_DUE", "CANCELLED"];

function touchAll() {
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/halls");
  revalidatePath("/dashboard/admin/subscriptions");
  revalidatePath("/dashboard/admin/plans");
  revalidatePath("/dashboard/admin/payments");
  revalidatePath("/halls");
  revalidatePath("/");
}

export async function setHallStatus(hallId: string, status: string): Promise<ActionResult> {
  await requireAdmin();
  if (!HALL_STATUSES.includes(status as HallStatus)) return fail("Invalid status.");
  const rows = await db.select().from(halls).where(eq(halls.id, hallId)).limit(1);
  if (!rows[0]) return fail("Venue not found.");
  await db.update(halls).set({ status: status as HallStatus, updatedAt: new Date() }).where(eq(halls.id, hallId));
  if (status === "SUSPENDED") {
    await db.update(subscriptions).set({ status: "PAST_DUE" }).where(eq(subscriptions.hallId, hallId));
  } else if (status === "ACTIVE") {
    await db.update(subscriptions).set({ status: "ACTIVE" }).where(eq(subscriptions.hallId, hallId));
  }
  touchAll();
  const label = status === "ACTIVE" ? "approved & live" : status === "SUSPENDED" ? "suspended" : "set to pending review";
  return ok(`${rows[0].name} ${label}.`);
}

export async function setHallPlan(hallId: string, planId: string): Promise<ActionResult> {
  await requireAdmin();
  const planRows = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
  const plan = planRows[0];
  if (!plan) return fail("Plan not found.");
  const hallRows = await db.select().from(halls).where(eq(halls.id, hallId)).limit(1);
  if (!hallRows[0]) return fail("Venue not found.");

  const existing = await db.select().from(subscriptions).where(eq(subscriptions.hallId, hallId)).limit(1);
  if (existing[0]) {
    await db
      .update(subscriptions)
      .set({ planId: plan.id, priceMonthly: plan.priceMonthly })
      .where(eq(subscriptions.id, existing[0].id));
  } else {
    await db.insert(subscriptions).values({
      id: newId("sub"),
      hallId,
      planId: plan.id,
      status: "ACTIVE",
      priceMonthly: plan.priceMonthly,
    });
  }
  touchAll();
  return ok(`${hallRows[0].name} moved to ${plan.name}.`);
}

export async function setSubscriptionStatus(hallId: string, status: string): Promise<ActionResult> {
  await requireAdmin();
  if (!SUB_STATUSES.includes(status as SubscriptionStatus)) return fail("Invalid status.");
  await db.update(subscriptions).set({ status: status as SubscriptionStatus }).where(eq(subscriptions.hallId, hallId));
  touchAll();
  return ok(`Subscription marked ${status.toLowerCase()}.`);
}

export async function savePlan(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const priceMonthly = Math.max(0, Number(formData.get("priceMonthly") ?? 0) || 0);
  const maxStaff = Math.max(-1, Number(formData.get("maxStaff") ?? 2) || 0);
  const maxBookings = Math.max(-1, Number(formData.get("maxBookings") ?? 50) || 0);
  const commissionPct = Math.max(0, Number(formData.get("commissionPct") ?? 5) || 0);
  const customDomain = formData.get("customDomain") === "on" || formData.get("customDomain") === "true";
  const isActive = formData.get("isActive") === "on" || formData.get("isActive") === "true";
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;
  const features = String(formData.get("features") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (!name) return fail("Plan name is required.");
  if (features.length === 0) return fail("Add at least one feature line.");

  const values = { name, tagline, priceMonthly, maxStaff, maxBookings, commissionPct, customDomain, isActive, sortOrder, features };

  if (id) {
    const existing = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
    if (!existing[0]) return fail("Plan not found.");
    await db.update(plans).set(values).where(eq(plans.id, id));
    touchAll();
    return ok("Plan updated.");
  }

  const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `plan-${Date.now()}`;
  const all = await db.select({ slug: plans.slug }).from(plans);
  const taken = new Set(all.map((p) => p.slug));
  let slug = slugBase;
  let i = 2;
  while (taken.has(slug)) slug = `${slugBase}-${i++}`;

  await db.insert(plans).values({ id: newId("plan"), slug, ...values });
  touchAll();
  return ok("Plan created.");
}

export async function deletePlan(id: string): Promise<ActionResult> {
  await requireAdmin();
  const subs = await db.select().from(subscriptions).where(eq(subscriptions.planId, id)).limit(1);
  if (subs[0]) return fail("Venues are subscribed to this plan — move them to another plan first.");
  await db.delete(plans).where(eq(plans.id, id));
  touchAll();
  return ok("Plan deleted.");
}

export async function togglePlan(id: string, active: boolean): Promise<ActionResult> {
  await requireAdmin();
  await db.update(plans).set({ isActive: active }).where(eq(plans.id, id));
  touchAll();
  return ok(active ? "Plan is live." : "Plan hidden.");
}

export async function savePlatformSettings(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const siteName = String(formData.get("siteName") ?? "").trim() || "MerrageHall";
  const commissionPct = String(Math.max(0, Number(formData.get("commissionPct") ?? 5)));
  const supportEmail = String(formData.get("supportEmail") ?? "").trim() || "support@merragehall.com";

  for (const [key, value] of Object.entries({ siteName, commissionPct, supportEmail })) {
    await db
      .insert(platformSettings)
      .values({ key, value })
      .onConflictDoUpdate({ target: platformSettings.key, set: { value } });
  }
  revalidatePath("/dashboard/admin/settings");
  revalidatePath("/");
  return ok("Platform settings saved.");
}

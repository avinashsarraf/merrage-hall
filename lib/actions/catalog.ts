"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { addons, menuItems, menuPackages } from "@/lib/schema";
import { requireHallAccess } from "@/lib/auth";
import { newId } from "@/lib/ids";
import { fail, ok, type ActionResult } from "@/lib/utils";
import { ADDON_CATEGORIES, DIET_TYPES, MENU_CATEGORIES } from "@/lib/constants";
import type { AddonCategory, DietType, MenuCategory } from "@/lib/schema";

function touch(hallSlug: string) {
  revalidatePath("/dashboard/menu");
  revalidatePath("/dashboard/addons");
  revalidatePath(`/halls/${hallSlug}`);
}

/* -------------------------------- menu items ------------------------------- */

export async function saveMenuItem(formData: FormData): Promise<ActionResult> {
  const { hall } = await requireHallAccess();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const categoryRaw = String(formData.get("category") ?? "MAIN_COURSE");
  const dietRaw = String(formData.get("dietType") ?? "VEG");
  const pricePerPlate = Math.max(0, Number(formData.get("pricePerPlate") ?? 0) || 0);
  const description = String(formData.get("description") ?? "").trim();
  const isActive = formData.get("isActive") === "on" || formData.get("isActive") === "true";

  if (!name) return fail("Give the dish a name.");
  const category = (MENU_CATEGORIES.find((c) => c.value === categoryRaw)?.value ?? "MAIN_COURSE") as MenuCategory;
  const dietType = (DIET_TYPES.find((d) => d.value === dietRaw)?.value ?? "VEG") as DietType;

  const values = { name, category, dietType, pricePerPlate, description, isActive };

  if (id) {
    const existing = await db.select().from(menuItems).where(and(eq(menuItems.id, id), eq(menuItems.hallId, hall.id))).limit(1);
    if (!existing[0]) return fail("Menu item not found.");
    await db.update(menuItems).set(values).where(eq(menuItems.id, id));
    touch(hall.slug);
    return ok("Menu item updated.");
  }
  await db.insert(menuItems).values({ id: newId("mi"), hallId: hall.id, ...values });
  touch(hall.slug);
  return ok("Menu item added.");
}

export async function toggleMenuItem(id: string, active: boolean): Promise<ActionResult> {
  const { hall } = await requireHallAccess();
  const existing = await db.select().from(menuItems).where(and(eq(menuItems.id, id), eq(menuItems.hallId, hall.id))).limit(1);
  if (!existing[0]) return fail("Menu item not found.");
  await db.update(menuItems).set({ isActive: active }).where(eq(menuItems.id, id));
  touch(hall.slug);
  return ok(active ? "Item is live." : "Item hidden.");
}

export async function deleteMenuItem(id: string): Promise<ActionResult> {
  const { hall } = await requireHallAccess();
  const existing = await db.select().from(menuItems).where(and(eq(menuItems.id, id), eq(menuItems.hallId, hall.id))).limit(1);
  if (!existing[0]) return fail("Menu item not found.");
  await db.delete(menuItems).where(eq(menuItems.id, id));
  // remove it from any packages that reference it
  await db
    .update(menuPackages)
    .set({ items: sql`array_remove(${menuPackages.items}, ${id})` })
    .where(eq(menuPackages.hallId, hall.id));
  touch(hall.slug);
  return ok("Menu item deleted.");
}

/* ------------------------------ menu packages ------------------------------ */

export async function savePackage(formData: FormData): Promise<ActionResult> {
  const { hall } = await requireHallAccess();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const pricePerPlate = Math.max(0, Number(formData.get("pricePerPlate") ?? 0) || 0);
  const dietRaw = String(formData.get("dietType") ?? "VEG");
  const items = formData.getAll("items").map(String).filter(Boolean);
  const isActive = formData.get("isActive") === "on" || formData.get("isActive") === "true";

  if (!name) return fail("Give the package a name.");
  if (pricePerPlate <= 0) return fail("Set a per-plate price.");
  const dietType = (DIET_TYPES.find((d) => d.value === dietRaw)?.value ?? "VEG") as DietType;

  const values = { name, description, pricePerPlate, dietType, items, isActive };

  if (id) {
    const existing = await db.select().from(menuPackages).where(and(eq(menuPackages.id, id), eq(menuPackages.hallId, hall.id))).limit(1);
    if (!existing[0]) return fail("Package not found.");
    await db.update(menuPackages).set(values).where(eq(menuPackages.id, id));
    touch(hall.slug);
    return ok("Package updated.");
  }
  await db.insert(menuPackages).values({ id: newId("pkg"), hallId: hall.id, ...values });
  touch(hall.slug);
  return ok("Package created.");
}

export async function togglePackage(id: string, active: boolean): Promise<ActionResult> {
  const { hall } = await requireHallAccess();
  const existing = await db.select().from(menuPackages).where(and(eq(menuPackages.id, id), eq(menuPackages.hallId, hall.id))).limit(1);
  if (!existing[0]) return fail("Package not found.");
  await db.update(menuPackages).set({ isActive: active }).where(eq(menuPackages.id, id));
  touch(hall.slug);
  return ok(active ? "Package is live." : "Package hidden.");
}

export async function deletePackage(id: string): Promise<ActionResult> {
  const { hall } = await requireHallAccess();
  const existing = await db.select().from(menuPackages).where(and(eq(menuPackages.id, id), eq(menuPackages.hallId, hall.id))).limit(1);
  if (!existing[0]) return fail("Package not found.");
  await db.delete(menuPackages).where(eq(menuPackages.id, id));
  touch(hall.slug);
  return ok("Package deleted.");
}

/* ---------------------------------- addons --------------------------------- */

export async function saveAddon(formData: FormData): Promise<ActionResult> {
  const { hall } = await requireHallAccess();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const categoryRaw = String(formData.get("category") ?? "DECOR");
  const price = Math.max(0, Number(formData.get("price") ?? 0) || 0);
  const unit = String(formData.get("unit") ?? "per event").trim() || "per event";
  const description = String(formData.get("description") ?? "").trim();
  const isActive = formData.get("isActive") === "on" || formData.get("isActive") === "true";

  if (!name) return fail("Give the add-on a name.");
  if (price <= 0) return fail("Set a price.");
  const category = (ADDON_CATEGORIES.find((c) => c.value === categoryRaw)?.value ?? "DECOR") as AddonCategory;

  const values = { name, category, price, unit, description, isActive };

  if (id) {
    const existing = await db.select().from(addons).where(and(eq(addons.id, id), eq(addons.hallId, hall.id))).limit(1);
    if (!existing[0]) return fail("Add-on not found.");
    await db.update(addons).set(values).where(eq(addons.id, id));
    touch(hall.slug);
    return ok("Add-on updated.");
  }
  await db.insert(addons).values({ id: newId("add"), hallId: hall.id, ...values });
  touch(hall.slug);
  return ok("Add-on created.");
}

export async function toggleAddon(id: string, active: boolean): Promise<ActionResult> {
  const { hall } = await requireHallAccess();
  const existing = await db.select().from(addons).where(and(eq(addons.id, id), eq(addons.hallId, hall.id))).limit(1);
  if (!existing[0]) return fail("Add-on not found.");
  await db.update(addons).set({ isActive: active }).where(eq(addons.id, id));
  touch(hall.slug);
  return ok(active ? "Add-on is live." : "Add-on hidden.");
}

export async function deleteAddon(id: string): Promise<ActionResult> {
  const { hall } = await requireHallAccess();
  const existing = await db.select().from(addons).where(and(eq(addons.id, id), eq(addons.hallId, hall.id))).limit(1);
  if (!existing[0]) return fail("Add-on not found.");
  await db.delete(addons).where(eq(addons.id, id));
  touch(hall.slug);
  return ok("Add-on deleted.");
}

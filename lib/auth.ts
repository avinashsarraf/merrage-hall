import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "./db";
import {
  halls,
  plans,
  sessions,
  subscriptions,
  users,
  type Hall,
  type Plan,
  type Role,
  type Subscription,
  type User,
} from "./schema";

export const SESSION_COOKIE = "mh_session";
const SESSION_DAYS = 30;

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ id: `ses_${randomBytes(9).toString("hex")}`, userId, token, expiresAt });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token))
    .limit(1);
  const row = rows[0];
  if (!row || row.expiresAt < new Date()) return null;
  return row.user;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  store.delete(SESSION_COOKIE);
}

export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(roles: Role[]): Promise<User> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}

export type HallWithPlan = Hall & {
  subscription: (Subscription & { plan: Plan }) | null;
};

async function hydrateHall(hall: Hall): Promise<HallWithPlan> {
  const rows = await db
    .select({ sub: subscriptions, plan: plans })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(subscriptions.hallId, hall.id))
    .limit(1);
  const row = rows[0];
  return {
    ...hall,
    subscription: row ? { ...row.sub, plan: row.plan } : null,
  };
}

/** The hall this user manages (owner via ownership, staff via assignment). */
export async function getHallForUser(user: User): Promise<HallWithPlan | null> {
  if (user.role === "HALL_OWNER") {
    const rows = await db.select().from(halls).where(eq(halls.ownerId, user.id)).limit(1);
    return rows[0] ? hydrateHall(rows[0]) : null;
  }
  if (user.role === "HALL_STAFF" && user.hallId) {
    const rows = await db.select().from(halls).where(eq(halls.id, user.hallId)).limit(1);
    return rows[0] ? hydrateHall(rows[0]) : null;
  }
  return null;
}

export async function requireHallAccess(): Promise<{ user: User; hall: HallWithPlan }> {
  const user = await requireUser();
  if (user.role !== "HALL_OWNER" && user.role !== "HALL_STAFF") redirect("/dashboard");
  const hall = await getHallForUser(user);
  if (!hall) redirect("/dashboard");
  return { user, hall };
}

export async function requireAdmin(): Promise<User> {
  return requireRole(["SUPER_ADMIN"]);
}

export function dashboardHomeFor(role: string) {
  if (role === "SUPER_ADMIN") return "/dashboard/admin";
  return "/dashboard";
}

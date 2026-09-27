import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import type { AddonSelection } from "./pricing.ts";

/* ---------------------------------- enums --------------------------------- */

export const roleEnum = pgEnum("role", ["SUPER_ADMIN", "HALL_OWNER", "HALL_STAFF", "CUSTOMER"]);
export const hallStatusEnum = pgEnum("hall_status", ["PENDING", "ACTIVE", "SUSPENDED"]);
export const bookingStatusEnum = pgEnum("booking_status", ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]);
export const bookingSlotEnum = pgEnum("booking_slot", ["LUNCH", "DINNER", "FULL_DAY"]);
export const bookingSourceEnum = pgEnum("booking_source", ["WEBSITE", "DASHBOARD"]);
export const addonCategoryEnum = pgEnum("addon_category", [
  "DECOR",
  "LIGHTING",
  "SOUND",
  "STAGE",
  "FURNITURE",
  "PHOTOGRAPHY",
  "VEHICLE",
  "ENTERTAINMENT",
  "OTHER",
]);
export const menuCategoryEnum = pgEnum("menu_category", [
  "STARTER",
  "SOUP",
  "SALAD",
  "MAIN_COURSE",
  "BREAD",
  "RICE",
  "DESSERT",
  "DRINKS",
  "LIVE_COUNTER",
]);
export const dietTypeEnum = pgEnum("diet_type", ["VEG", "NON_VEG", "VEGAN", "JAIN"]);
export const paymentTypeEnum = pgEnum("payment_type", ["BOOKING", "SUBSCRIPTION", "COMMISSION"]);
export const paymentMethodEnum = pgEnum("payment_method", ["CASH", "UPI", "BANK", "CARD"]);
export const paymentStatusEnum = pgEnum("payment_status", ["PAID", "PENDING", "REFUNDED"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "CANCELLED",
]);

/* --------------------------------- tables --------------------------------- */

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().default(""),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("CUSTOMER"),
  hallId: text("hall_id").references((): AnyPgColumn => halls.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const plans = pgTable("plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  tagline: text("tagline").notNull().default(""),
  priceMonthly: integer("price_monthly").notNull().default(0),
  features: text("features").array().notNull().default(sql`'{}'::text[]`),
  maxStaff: integer("max_staff").notNull().default(2),
  maxBookings: integer("max_bookings").notNull().default(50), // -1 = unlimited
  customDomain: boolean("custom_domain").notNull().default(false),
  commissionPct: real("commission_pct").notNull().default(5),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const halls = pgTable("halls", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references((): AnyPgColumn => users.id, { onDelete: "cascade" })
    .unique(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  customDomain: text("custom_domain"),
  domainVerified: boolean("domain_verified").notNull().default(false),
  status: hallStatusEnum("status").notNull().default("PENDING"),
  description: text("description").notNull().default(""),
  address: text("address").notNull().default(""),
  city: text("city").notNull().default(""),
  state: text("state").notNull().default(""),
  pincode: text("pincode").notNull().default(""),
  capacity: integer("capacity").notNull().default(500),
  hallCount: integer("hall_count").notNull().default(1),
  rooms: integer("rooms").notNull().default(4),
  parking: integer("parking").notNull().default(50),
  baseRent: integer("base_rent").notNull().default(50000),
  vegPlate: integer("veg_plate").notNull().default(599),
  nonvegPlate: integer("nonveg_plate").notNull().default(849),
  amenities: text("amenities").array().notNull().default(sql`'{}'::text[]`),
  images: text("images").array().notNull().default(sql`'{}'::text[]`),
  checkIn: text("check_in").notNull().default("11:00"),
  checkOut: text("check_out").notNull().default("22:00"),
  contactPhone: text("contact_phone").notNull().default(""),
  contactEmail: text("contact_email").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const addons = pgTable("addons", {
  id: text("id").primaryKey(),
  hallId: text("hall_id")
    .notNull()
    .references(() => halls.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: addonCategoryEnum("category").notNull().default("DECOR"),
  description: text("description").notNull().default(""),
  price: integer("price").notNull().default(0),
  unit: text("unit").notNull().default("per event"),
  image: text("image").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
});

export const menuItems = pgTable("menu_items", {
  id: text("id").primaryKey(),
  hallId: text("hall_id")
    .notNull()
    .references(() => halls.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: menuCategoryEnum("category").notNull().default("MAIN_COURSE"),
  dietType: dietTypeEnum("diet_type").notNull().default("VEG"),
  description: text("description").notNull().default(""),
  pricePerPlate: integer("price_per_plate").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const menuPackages = pgTable("menu_packages", {
  id: text("id").primaryKey(),
  hallId: text("hall_id")
    .notNull()
    .references(() => halls.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  pricePerPlate: integer("price_per_plate").notNull().default(599),
  dietType: dietTypeEnum("diet_type").notNull().default("VEG"),
  items: text("items").array().notNull().default(sql`'{}'::text[]`),
  image: text("image").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
});

export const bookings = pgTable(
  "bookings",
  {
    id: text("id").primaryKey(),
    hallId: text("hall_id")
      .notNull()
      .references(() => halls.id, { onDelete: "cascade" }),
    bookedByUserId: text("booked_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerEmail: text("customer_email").notNull().default(""),
    eventType: text("event_type").notNull().default("Wedding"),
    eventDate: date("event_date", { mode: "string" }).notNull(),
    slot: bookingSlotEnum("slot").notNull().default("DINNER"),
    guestCount: integer("guest_count").notNull().default(100),
    menuPackageId: text("menu_package_id"),
    menuPackageName: text("menu_package_name").notNull().default(""),
    platePrice: integer("plate_price").notNull().default(0),
    hallRent: integer("hall_rent").notNull().default(0),
    addons: jsonb("addons").$type<AddonSelection[]>().notNull().default([]),
    cateringTotal: integer("catering_total").notNull().default(0),
    addonsTotal: integer("addons_total").notNull().default(0),
    discount: integer("discount").notNull().default(0),
    totalAmount: integer("total_amount").notNull().default(0),
    advanceAmount: integer("advance_amount").notNull().default(0),
    paidAmount: integer("paid_amount").notNull().default(0),
    status: bookingStatusEnum("status").notNull().default("PENDING"),
    notes: text("notes").notNull().default(""),
    source: bookingSourceEnum("source").notNull().default("DASHBOARD"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("bookings_hall_date_idx").on(t.hallId, t.eventDate),
    index("bookings_date_idx").on(t.eventDate),
  ]
);

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  hallId: text("hall_id")
    .notNull()
    .references(() => halls.id, { onDelete: "cascade" })
    .unique(),
  planId: text("plan_id")
    .notNull()
    .references(() => plans.id),
  status: subscriptionStatusEnum("status").notNull().default("TRIALING"),
  priceMonthly: integer("price_monthly").notNull().default(0),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endsAt: timestamp("ends_at"),
});

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  hallId: text("hall_id").references(() => halls.id, { onDelete: "cascade" }),
  bookingId: text("booking_id").references(() => bookings.id, { onDelete: "cascade" }),
  type: paymentTypeEnum("type").notNull().default("BOOKING"),
  amount: integer("amount").notNull().default(0),
  method: paymentMethodEnum("method").notNull().default("UPI"),
  status: paymentStatusEnum("status").notNull().default("PAID"),
  reference: text("reference").notNull().default(""),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const platformSettings = pgTable("platform_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

/* ------------------------------ inferred types ----------------------------- */

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type Hall = typeof halls.$inferSelect;
export type Addon = typeof addons.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
export type MenuPackage = typeof menuPackages.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Payment = typeof payments.$inferSelect;

export type Role = (typeof roleEnum.enumValues)[number];
export type HallStatus = (typeof hallStatusEnum.enumValues)[number];
export type BookingStatus = (typeof bookingStatusEnum.enumValues)[number];
export type BookingSlot = (typeof bookingSlotEnum.enumValues)[number];
export type BookingSource = (typeof bookingSourceEnum.enumValues)[number];
export type AddonCategory = (typeof addonCategoryEnum.enumValues)[number];
export type MenuCategory = (typeof menuCategoryEnum.enumValues)[number];
export type DietType = (typeof dietTypeEnum.enumValues)[number];
export type PaymentType = (typeof paymentTypeEnum.enumValues)[number];
export type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number];
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];
export type SubscriptionStatus = (typeof subscriptionStatusEnum.enumValues)[number];

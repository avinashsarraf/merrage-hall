-- ═══════════════════════════════════════════════════════════════════════════
-- MerrageHall — master setup (schema + demo data)
--
-- Recreates the complete MerrageHall database on any PostgreSQL 14+
-- instance. Designed for a FRESH Supabase project:
--
--   Supabase Dashboard → SQL Editor → New query → paste this file → Run
--
-- Safe to re-run: existing objects are kept (IF NOT EXISTS) and data
-- sections start with TRUNCATE … CASCADE.
--
-- Demo logins:
--   admin@merragehall.com / Admin@123        (SaaS owner)
--   vikram@rajwada.in    / Owner@123         (hall owner)
--   arjun@rajwada.in     / Staff@123         (hall staff)
--   priya.k@gmail.com    / Client@123        (booking client)
--
-- Generated 2026-09-27T16:28:02.995Z · plans: 3, users: 16, halls: 6, subscriptions: 6, addons: 37, menu_items: 120, menu_packages: 19, bookings: 30, payments: 63, platform_settings: 4
-- ═══════════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════ PART 1: SCHEMA
DO $$ BEGIN
  CREATE TYPE "public"."addon_category" AS ENUM('DECOR', 'LIGHTING', 'SOUND', 'STAGE', 'FURNITURE', 'PHOTOGRAPHY', 'VEHICLE', 'ENTERTAINMENT', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "public"."booking_slot" AS ENUM('LUNCH', 'DINNER', 'FULL_DAY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "public"."booking_source" AS ENUM('WEBSITE', 'DASHBOARD');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "public"."booking_status" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "public"."diet_type" AS ENUM('VEG', 'NON_VEG', 'VEGAN', 'JAIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "public"."hall_status" AS ENUM('PENDING', 'ACTIVE', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "public"."menu_category" AS ENUM('STARTER', 'SOUP', 'SALAD', 'MAIN_COURSE', 'BREAD', 'RICE', 'DESSERT', 'DRINKS', 'LIVE_COUNTER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "public"."payment_method" AS ENUM('CASH', 'UPI', 'BANK', 'CARD');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "public"."payment_status" AS ENUM('PAID', 'PENDING', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "public"."payment_type" AS ENUM('BOOKING', 'SUBSCRIPTION', 'COMMISSION');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "public"."role" AS ENUM('SUPER_ADMIN', 'HALL_OWNER', 'HALL_STAFF', 'CUSTOMER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "public"."subscription_status" AS ENUM('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE TABLE IF NOT EXISTS "addons" (
	"id" text PRIMARY KEY NOT NULL,
	"hall_id" text NOT NULL,
	"name" text NOT NULL,
	"category" "addon_category" DEFAULT 'DECOR' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"unit" text DEFAULT 'per event' NOT NULL,
	"image" text DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS "bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"hall_id" text NOT NULL,
	"booked_by_user_id" text,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"customer_email" text DEFAULT '' NOT NULL,
	"event_type" text DEFAULT 'Wedding' NOT NULL,
	"event_date" date NOT NULL,
	"slot" "booking_slot" DEFAULT 'DINNER' NOT NULL,
	"guest_count" integer DEFAULT 100 NOT NULL,
	"menu_package_id" text,
	"menu_package_name" text DEFAULT '' NOT NULL,
	"plate_price" integer DEFAULT 0 NOT NULL,
	"hall_rent" integer DEFAULT 0 NOT NULL,
	"addons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"catering_total" integer DEFAULT 0 NOT NULL,
	"addons_total" integer DEFAULT 0 NOT NULL,
	"discount" integer DEFAULT 0 NOT NULL,
	"total_amount" integer DEFAULT 0 NOT NULL,
	"advance_amount" integer DEFAULT 0 NOT NULL,
	"paid_amount" integer DEFAULT 0 NOT NULL,
	"status" "booking_status" DEFAULT 'PENDING' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"source" "booking_source" DEFAULT 'DASHBOARD' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "halls" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"custom_domain" text,
	"domain_verified" boolean DEFAULT false NOT NULL,
	"status" "hall_status" DEFAULT 'PENDING' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"state" text DEFAULT '' NOT NULL,
	"pincode" text DEFAULT '' NOT NULL,
	"capacity" integer DEFAULT 500 NOT NULL,
	"hall_count" integer DEFAULT 1 NOT NULL,
	"rooms" integer DEFAULT 4 NOT NULL,
	"parking" integer DEFAULT 50 NOT NULL,
	"base_rent" integer DEFAULT 50000 NOT NULL,
	"veg_plate" integer DEFAULT 599 NOT NULL,
	"nonveg_plate" integer DEFAULT 849 NOT NULL,
	"amenities" text[] DEFAULT '{}'::text[] NOT NULL,
	"images" text[] DEFAULT '{}'::text[] NOT NULL,
	"check_in" text DEFAULT '11:00' NOT NULL,
	"check_out" text DEFAULT '22:00' NOT NULL,
	"contact_phone" text DEFAULT '' NOT NULL,
	"contact_email" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "halls_owner_id_unique" UNIQUE("owner_id"),
	CONSTRAINT "halls_slug_unique" UNIQUE("slug")
);

CREATE TABLE IF NOT EXISTS "menu_items" (
	"id" text PRIMARY KEY NOT NULL,
	"hall_id" text NOT NULL,
	"name" text NOT NULL,
	"category" "menu_category" DEFAULT 'MAIN_COURSE' NOT NULL,
	"diet_type" "diet_type" DEFAULT 'VEG' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price_per_plate" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS "menu_packages" (
	"id" text PRIMARY KEY NOT NULL,
	"hall_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price_per_plate" integer DEFAULT 599 NOT NULL,
	"diet_type" "diet_type" DEFAULT 'VEG' NOT NULL,
	"items" text[] DEFAULT '{}'::text[] NOT NULL,
	"image" text DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"hall_id" text,
	"booking_id" text,
	"type" "payment_type" DEFAULT 'BOOKING' NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"method" "payment_method" DEFAULT 'UPI' NOT NULL,
	"status" "payment_status" DEFAULT 'PAID' NOT NULL,
	"reference" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "plans" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"tagline" text DEFAULT '' NOT NULL,
	"price_monthly" integer DEFAULT 0 NOT NULL,
	"features" text[] DEFAULT '{}'::text[] NOT NULL,
	"max_staff" integer DEFAULT 2 NOT NULL,
	"max_bookings" integer DEFAULT 50 NOT NULL,
	"custom_domain" boolean DEFAULT false NOT NULL,
	"commission_pct" real DEFAULT 5 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "plans_slug_unique" UNIQUE("slug")
);

CREATE TABLE IF NOT EXISTS "platform_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);

CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"hall_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"status" "subscription_status" DEFAULT 'TRIALING' NOT NULL,
	"price_monthly" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ends_at" timestamp,
	CONSTRAINT "subscriptions_hall_id_unique" UNIQUE("hall_id")
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'CUSTOMER' NOT NULL,
	"hall_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

DO $$ BEGIN
  ALTER TABLE "addons" ADD CONSTRAINT "addons_hall_id_halls_id_fk" FOREIGN KEY ("hall_id") REFERENCES "public"."halls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "bookings" ADD CONSTRAINT "bookings_hall_id_halls_id_fk" FOREIGN KEY ("hall_id") REFERENCES "public"."halls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "bookings" ADD CONSTRAINT "bookings_booked_by_user_id_users_id_fk" FOREIGN KEY ("booked_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "halls" ADD CONSTRAINT "halls_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_hall_id_halls_id_fk" FOREIGN KEY ("hall_id") REFERENCES "public"."halls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "menu_packages" ADD CONSTRAINT "menu_packages_hall_id_halls_id_fk" FOREIGN KEY ("hall_id") REFERENCES "public"."halls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "payments" ADD CONSTRAINT "payments_hall_id_halls_id_fk" FOREIGN KEY ("hall_id") REFERENCES "public"."halls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_hall_id_halls_id_fk" FOREIGN KEY ("hall_id") REFERENCES "public"."halls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_hall_id_halls_id_fk" FOREIGN KEY ("hall_id") REFERENCES "public"."halls"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS "bookings_hall_date_idx" ON "bookings" USING btree ("hall_id","event_date");
CREATE INDEX IF NOT EXISTS "bookings_date_idx" ON "bookings" USING btree ("event_date");

-- ═════════════════════════════════════════════════════════════ PART 2: DATA
TRUNCATE "payments", "bookings", "menu_packages", "menu_items", "addons",
         "subscriptions", "sessions", "halls", "users", "plans",
         "platform_settings" RESTART IDENTITY CASCADE;

-- ── plans ─────────────────────────────────────────────
INSERT INTO "plans" ("id", "name", "slug", "tagline", "price_monthly", "features", "max_staff", "max_bookings", "custom_domain", "commission_pct", "is_active", "sort_order") VALUES
  ('plan_0468835ad386782c3435674a', 'Starter', 'starter', 'Get your venue discovered online', '2499', '{"Beautiful venue page on MerrageHall","Up to 40 bookings / month","Menu, packages & add-ons catalog","Free subdomain — yourvenue.merragehall.app","2 staff accounts","Email support"}', '2', '40', 'false', '7', 'true', '1'),
  ('plan_d1996860c3d76974a907d7eb', 'Growth', 'growth', 'For venues ready to scale bookings', '5999', '{"Everything in Starter","Unlimited bookings","6 staff accounts","Custom domain support","Priority marketplace placement","Revenue & occupancy analytics","Shared booking calendar"}', '6', '-1', 'true', '5', 'true', '2'),
  ('plan_5c80f35960e07f4007b13c6c', 'Premium', 'premium', 'Full power, white-glove support', '11999', '{"Everything in Growth","Unlimited staff accounts","Featured marketplace placement","Dedicated account manager","Commission reduced to 2%","API access & webhooks","Multi-venue management"}', '-1', '-1', 'true', '2', 'true', '3');

-- ── users ─────────────────────────────────────────────
INSERT INTO "users" ("id", "name", "email", "phone", "password_hash", "role", "hall_id", "created_at", "updated_at") VALUES
  ('usr_3ab4e58038385fb292911951', 'Avinash Sarraf', 'admin@merragehall.com', '+91 98765 43210', '$2a$10$2ErF/94N0LqaXC2HN2JKKexXL9RgakinNSooEVaxWlHLQqO02otnC', 'SUPER_ADMIN', NULL, '2026-09-27 16:25:15.261461', '2026-09-27 16:25:15.261461'),
  ('usr_46a83ba708c50444380600e2', 'Priya Kapoor', 'priya.k@gmail.com', '+91 98111 20007', '$2a$10$lH4wlRcMH.ZVwJndrotAP.638Tpzbpnv/DGHuhYjimA0al7ofJiVa', 'CUSTOMER', NULL, '2026-09-27 16:25:15.397272', '2026-09-27 16:25:15.397272'),
  ('usr_46a8ebe02d8f46021b703586', 'Rahul Verma', 'rahul.verma@gmail.com', '+91 97660 60002', '$2a$10$A4biNCRerIG/Q4.b5o9n.eHSAhOB3sN5xlVuvwO/eFzt02FWWEZkm', 'CUSTOMER', NULL, '2026-09-27 16:25:15.522828', '2026-09-27 16:25:15.522828'),
  ('usr_0fdd79823d201466320e1082', 'Ananya Iyer', 'ananya.iyer@gmail.com', '+91 99590 30005', '$2a$10$5ZsuZk.H.nUjNT1mZNR6pebiwKfNC9m/ID32XWcrkGyALswGtzdIG', 'CUSTOMER', NULL, '2026-09-27 16:25:15.634954', '2026-09-27 16:25:15.634954'),
  ('usr_0f52cc2150fa0b3e74dd66b9', 'Karan Malhotra', 'karan.m@gmail.com', '+91 94150 40006', '$2a$10$zY7/pDL.jctvOWsqFOt42u5jQXBwrKgde.GAlNPS4sPVofHhTW//W', 'CUSTOMER', NULL, '2026-09-27 16:25:15.726002', '2026-09-27 16:25:15.726002'),
  ('usr_08368ad605833ef2ae1a63a3', 'Fatima Sheikh', 'fatima.s@gmail.com', '+91 94150 40003', '$2a$10$Au9z0tJ6zetY8tQCGAfP9eLUA.Q64n8j.3p.vWQfzKw9GECUi3JTa', 'CUSTOMER', NULL, '2026-09-27 16:25:15.814087', '2026-09-27 16:25:15.814087'),
  ('usr_ef417511af41fa448f785d78', 'Rohan Gupta', 'rohan.g@gmail.com', '+91 98111 20009', '$2a$10$DYBB4aZ/jm8f1zjyP9MfF.RQcJVOTnciadWK4ZMrOUnDlKu1vwvXm', 'CUSTOMER', NULL, '2026-09-27 16:25:15.908444', '2026-09-27 16:25:15.908444'),
  ('usr_71bedde60bb46ddcd6100f6d', 'Vikram Singh Rathore', 'vikram@rajwada.in', '+91 98290 11223', '$2a$10$0kQLa5DgwcHlH87WdvgW3eZPDhKx96HvK.k2XhQ7lJkk6A/Y1rA4y', 'HALL_OWNER', NULL, '2026-09-27 16:25:16.035566', '2026-09-27 16:25:16.035566'),
  ('usr_69ef6c1620a2ed7814a7ec05', 'Arjun Mehta', 'arjun@rajwada.in', '+91 98290 44556', '$2a$10$U/b0HSkZ6ddVjuLuu1e8Eect5no.DZN45KOlvDu3T1UhPEErkzZW.', 'HALL_STAFF', NULL, '2026-09-27 16:25:16.128523', '2026-09-27 16:25:16.128523'),
  ('usr_30ae6a47fb2a947978c52638', 'Sana Khan', 'sana@rajwada.in', '+91 98290 77889', '$2a$10$CbEfm3ZU4X3LUnu/koGaVeL4gAmYI.MZjdvvXK00ocMquyQo7FYDq', 'HALL_STAFF', NULL, '2026-09-27 16:25:16.220211', '2026-09-27 16:25:16.220211'),
  ('usr_dc4305b5febecd1747a0e326', 'Meera Reddy', 'meera@emeraldlawns.in', '+91 99590 22113', '$2a$10$f.etOoODfS2RM9hUAULaVOc/VN9RqQMUI7otkV49ps6BgkPjvUlVy', 'HALL_OWNER', NULL, '2026-09-27 16:25:16.318379', '2026-09-27 16:25:16.318379'),
  ('usr_a3fbdccbbb7cc7e58e55396f', 'Ravi Teja', 'ravi@emeraldlawns.in', '+91 99590 66778', '$2a$10$Ke6LOqPaBzmuIy8nR8TuBuTXURqHVmjRdM07N0WU2yUpWzaXVF21u', 'HALL_STAFF', NULL, '2026-09-27 16:25:16.411234', '2026-09-27 16:25:16.411234'),
  ('usr_47e6bf2b320bbbf51d0529da', 'Anil Srivastava', 'anil@shagunpalace.in', '+91 94150 33224', '$2a$10$pCM6fRdrFV16UgJPQtKW6usABf/mfUd9X4J/2i10gWB0JcQJIR9gy', 'HALL_OWNER', NULL, '2026-09-27 16:25:16.513323', '2026-09-27 16:25:16.513323'),
  ('usr_6fb2abf50952eeb805610265', 'Lakshmi Iyer', 'lakshmi@kalyanimahal.in', '+91 98410 55337', '$2a$10$EcWhdKsTfEckx.NeJJQNHu8fe.SRN4.zolU9t2v2Ud1olYkQdktna', 'HALL_OWNER', NULL, '2026-09-27 16:25:16.613249', '2026-09-27 16:25:16.613249'),
  ('usr_1532d05f33636d02dd6f8a95', 'Farhan Qureshi', 'farhan@amaragardens.in', '+91 98450 77441', '$2a$10$2AeP8h2Ebf/0zsOtr0t/BeVfq8FBJ/a4o3KW1Y.s/c27Oo7al5QFS', 'HALL_OWNER', NULL, '2026-09-27 16:25:16.712324', '2026-09-27 16:25:16.712324'),
  ('usr_44f73328e649457c892976a0', 'Zoya Khan', 'zoya@noorbanquets.in', '+91 97660 88552', '$2a$10$LJbE2LdvReuLymVU9nXDCuxlR70.8UcBYOXEt4taX1yd4SFLGID3C', 'HALL_OWNER', NULL, '2026-09-27 16:25:16.817124', '2026-09-27 16:25:16.817124');

-- ── halls ─────────────────────────────────────────────
INSERT INTO "halls" ("id", "owner_id", "name", "slug", "custom_domain", "domain_verified", "status", "description", "address", "city", "state", "pincode", "capacity", "hall_count", "rooms", "parking", "base_rent", "veg_plate", "nonveg_plate", "amenities", "images", "check_in", "check_out", "contact_phone", "contact_email", "created_at", "updated_at") VALUES
  ('hall_73d60ffef2698f81c5636a7f', 'usr_71bedde60bb46ddcd6100f6d', 'Rajwada Grand Palace', 'rajwada-grand-palace', 'book.rajwada.in', 'true', 'ACTIVE', 'A heritage-style palace venue in the heart of Jaipur. The Grand Durbar Hall pairs carved jharokhas with modern comforts, while the Rajputana Lawn hosts open-air ceremonies under the stars. Two decades of shaadi expertise, one unforgettable venue.', '12, Jai Singh Highway, Bani Park', 'Jaipur', 'Rajasthan', '302016', '1200', '2', '14', '250', '150000', '649', '899', '{"Central AC","Bridal Suite","Groom Room","Power Backup","Valet Parking","In-house Catering","Mandap Décor","DJ & Sound Allowed","Lawn + Banquet Hall","Guest Rooms","Security Staff","Bridal Entry Porch"}', '{https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1600&auto=format&fit=crop,https://images.unsplash.com/photo-1544124499-58912cbddaad?q=80&w=1600&auto=format&fit=crop,https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=1600&auto=format&fit=crop,https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1600&auto=format&fit=crop}', '11:00', '22:00', '+91 141 402 8899', 'bookings@rajwada.in', '2025-12-05 11:24:00', '2025-12-05 11:24:00'),
  ('hall_7cab4e6cf83da04b19106f2d', 'usr_dc4305b5febecd1747a0e326', 'The Emerald Lawns', 'emerald-lawns', NULL, 'false', 'ACTIVE', 'Three acres of manicured lawns beside a glasshouse banquet pavilion in Secunderabad. Garden ceremonies at sunset, Deccan-inspired catering, and a dedicated team that has staged 900+ celebrations.', 'Plot 8, Emerald Enclave, Bowenpally', 'Hyderabad', 'Telangana', '500011', '800', '2', '6', '120', '95000', '599', '849', '{"Bridal Suite","Groom Room","Power Backup","Valet Parking","In-house Catering","DJ & Sound Allowed","Lawn + Banquet Hall","Haldi & Mehndi Lawn","Guest Rooms","Wheelchair Friendly","Kids Play Corner"}', '{https://images.unsplash.com/photo-1478146896981-b80fe463b330?q=80&w=1600&auto=format&fit=crop,https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1600&auto=format&fit=crop,https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1600&auto=format&fit=crop}', '11:00', '22:00', '+91 40 665 2211', 'hello@emeraldlawns.in', '2025-12-16 11:24:00', '2025-12-16 11:24:00'),
  ('hall_267e67d2b3976b10ecee0cfa', 'usr_47e6bf2b320bbbf51d0529da', 'Shagun Palace', 'shagun-palace', NULL, 'false', 'ACTIVE', 'Nawabi grandeur on Sitapur Road — chandeliered halls, a grand staircase for couple entries, and Awadhi cuisine from our in-house kiOM chefs. Lucknow''s favourite venue for winter weddings.', '7, Sitapur Road, Near Butterfly Park', 'Lucknow', 'Uttar Pradesh', '226020', '1500', '3', '18', '300', '180000', '699', '949', '{"Central AC","Bridal Suite","Groom Room","Power Backup","Valet Parking","In-house Catering","Mandap Décor","DJ & Sound Allowed","Lawn + Banquet Hall","Guest Rooms","Elevator Access","Security Staff"}', '{https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=1600&auto=format&fit=crop,https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1600&auto=format&fit=crop,https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1600&auto=format&fit=crop}', '11:00', '22:00', '+91 522 711 3344', 'events@shagunpalace.in', '2025-12-29 11:24:00', '2025-12-29 11:24:00'),
  ('hall_4f766bef78b614f55a55721c', 'usr_6fb2abf50952eeb805610265', 'Kalyani Mahal', 'kalyani-mahal', NULL, 'false', 'PENDING', 'A modern kalyana mandapam in Anna Nagar with a pillared marriage hall, stainless kitchen and air-conditioned dining for 600. Traditionally South Indian, happily contemporary.', '45, 3rd Avenue, Anna Nagar East', 'Chennai', 'Tamil Nadu', '600102', '600', '1', '5', '60', '70000', '549', '799', '{"Central AC","Bridal Suite","Power Backup","In-house Catering","Kitchen & Cold Storage","Guest Rooms","Elevator Access","Wheelchair Friendly"}', '{https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=1600&auto=format&fit=crop,https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=1600&auto=format&fit=crop}', '11:00', '22:00', '+91 44 262 11778', 'kalyanimahal@gmail.com', '2026-01-28 11:24:00', '2026-01-28 11:24:00'),
  ('hall_7458d7142ede56e3013363e1', 'usr_1532d05f33636d02dd6f8a95', 'Amara Gardens', 'amara-gardens', NULL, 'false', 'ACTIVE', 'A boutique garden venue off Sarjapur Road — jacaranda courtyards, a glasshouse dining pavilion and a young team that loves intimate weddings, mehndis and baby showers alike.', '22/3, Dommasandra Circle, Sarjapur Road', 'Bengaluru', 'Karnataka', '562125', '900', '2', '8', '90', '110000', '599', '849', '{"Bridal Suite","Groom Room","Power Backup","Valet Parking","Outside Catering Allowed","DJ & Sound Allowed","Rooftop Terrace","Guest Rooms","Kids Play Corner"}', '{https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1600&auto=format&fit=crop,https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=1600&auto=format&fit=crop,https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1600&auto=format&fit=crop}', '11:00', '22:00', '+91 80 778 9922', 'hi@amaragardens.in', '2026-01-30 11:24:00', '2026-01-30 11:24:00'),
  ('hall_1ef2949ac6388b32d7241db8', 'usr_44f73328e649457c892976a0', 'Noor Banquets', 'noor-banquets', NULL, 'false', 'SUSPENDED', 'Two elegant banquet halls on Nagar Road — crystal chandeliers, Mughlai catering and a grand reception foyer. Kalyan Nagar''s go-to for nikah ceremonies and receptions.', 'Noor House, Nagar Road, Yerawada', 'Pune', 'Maharashtra', '411014', '450', '2', '4', '70', '60000', '499', '749', '{"Central AC","Bridal Suite","Power Backup","In-house Catering","DJ & Sound Allowed","Guest Rooms","Elevator Access"}', '{https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1600&auto=format&fit=crop,https://images.unsplash.com/photo-1544124499-58912cbddaad?q=80&w=1600&auto=format&fit=crop}', '11:00', '22:00', '+91 20 664 7788', 'noorbanquets@gmail.com', '2026-01-19 11:24:00', '2026-01-19 11:24:00');

-- ── subscriptions ─────────────────────────────────────────────
INSERT INTO "subscriptions" ("id", "hall_id", "plan_id", "status", "price_monthly", "started_at", "ends_at") VALUES
  ('sub_3db2e14d6e38e8cf50ded6e2', 'hall_73d60ffef2698f81c5636a7f', 'plan_d1996860c3d76974a907d7eb', 'ACTIVE', '5999', '2026-01-30 11:24:00', NULL),
  ('sub_095a525eda52603f133e3f46', 'hall_7cab4e6cf83da04b19106f2d', 'plan_5c80f35960e07f4007b13c6c', 'ACTIVE', '11999', '2026-01-30 11:24:00', NULL),
  ('sub_bbe7971750595a4cbfc2a95a', 'hall_267e67d2b3976b10ecee0cfa', 'plan_d1996860c3d76974a907d7eb', 'ACTIVE', '5999', '2026-01-30 11:24:00', NULL),
  ('sub_348db2d040ac898689f56e92', 'hall_4f766bef78b614f55a55721c', 'plan_0468835ad386782c3435674a', 'TRIALING', '2499', '2026-09-22 11:24:00', NULL),
  ('sub_296cb91f9c31b5e458d4e71f', 'hall_7458d7142ede56e3013363e1', 'plan_0468835ad386782c3435674a', 'ACTIVE', '2499', '2026-01-30 11:24:00', NULL),
  ('sub_d74580d1317719a78b12bcfb', 'hall_1ef2949ac6388b32d7241db8', 'plan_d1996860c3d76974a907d7eb', 'PAST_DUE', '5999', '2026-01-30 11:24:00', NULL);

-- ── addons ─────────────────────────────────────────────
INSERT INTO "addons" ("id", "hall_id", "name", "category", "description", "price", "unit", "image", "is_active") VALUES
  ('add_51ffcaebfc2a2169ed445bd3', 'hall_73d60ffef2698f81c5636a7f', 'Royal Floral Mandap', 'STAGE', 'Fresh marigold & rose mandap with draped pillars', '55000', 'per event', '', 'true'),
  ('add_3b107210cdadb76ac05a3af9', 'hall_73d60ffef2698f81c5636a7f', 'Fresh Flower Stage Décor', 'STAGE', 'Stage redesigned with seasonal flowers', '28000', 'per event', '', 'true'),
  ('add_482790c18f8c6734e3124b48', 'hall_73d60ffef2698f81c5636a7f', 'Fairy Lighting & Drapes', 'LIGHTING', 'Warm fairy lights with ceiling drapes', '18000', 'per event', '', 'true'),
  ('add_a69b7a12ee11d24a52852950', 'hall_73d60ffef2698f81c5636a7f', 'DJ, Sound & Dance Floor', 'SOUND', '4-hour DJ set, PA system, LED dance floor', '22000', 'per event', '', 'true'),
  ('add_465f089ea340fc4b8045414b', 'hall_73d60ffef2698f81c5636a7f', 'Cold Pyro Sparklers (Entry)', 'ENTERTAINMENT', 'Grand couple entry with indoor sparklers', '7500', 'per event', '', 'true'),
  ('add_6c169730a2fd46e92dc1af3d', 'hall_73d60ffef2698f81c5636a7f', 'Vintage Car Baraat Entry', 'VEHICLE', 'Restored 1962 Ambassador for the groom', '15000', 'per event', '', 'true'),
  ('add_8f693afb293df7bab6bec9ef', 'hall_73d60ffef2698f81c5636a7f', 'LED Wall (20 ft)', 'LIGHTING', 'Giant LED backdrop for stage & selfies', '35000', 'per event', '', 'true'),
  ('add_d5382fdf585253d9b3d89713', 'hall_73d60ffef2698f81c5636a7f', 'Premium Sofa & Lounge Set', 'FURNITURE', '12 royal sofa sets with cushions', '12000', 'per event', '', 'true'),
  ('add_df37b8e1c8385c5ca7a3b353', 'hall_7cab4e6cf83da04b19106f2d', 'Garden Mandap with Arch', 'STAGE', 'Floral arch mandap on the central lawn', '42000', 'per event', '', 'true'),
  ('add_da0a33974bdcf9ad6c7d7d54', 'hall_7cab4e6cf83da04b19106f2d', 'Festoon & Bollard Lighting', 'LIGHTING', 'Warm garden lighting across all lawns', '16000', 'per event', '', 'true'),
  ('add_df094fc7d6b1fa46ff45d35f', 'hall_7cab4e6cf83da04b19106f2d', 'DJ & Sound System', 'SOUND', '5-hour set with wireless mics', '18000', 'per event', '', 'true'),
  ('add_a927f8fb49438f1c1a8dcca2', 'hall_7cab4e6cf83da04b19106f2d', 'Sparkler Tunnel Entry', 'ENTERTAINMENT', 'Couple walks a tunnel of cold sparklers', '8500', 'per event', '', 'true'),
  ('add_8d3a9b9e4c29e0db9c3daf2c', 'hall_7cab4e6cf83da04b19106f2d', 'Haldi & Mehndi Corner', 'DECOR', 'Themed corner with drapes, swings & props', '20000', 'per event', '', 'true'),
  ('add_b1202b2f439bb45a376ef13d', 'hall_7cab4e6cf83da04b19106f2d', 'Couple Photoshoot Corner', 'PHOTOGRAPHY', 'Styled nook with props & ring light', '8500', 'per event', '', 'true'),
  ('add_9eb925ef3455ad6da3370c2a', 'hall_7cab4e6cf83da04b19106f2d', 'Horse Baraat Entry', 'VEHICLE', 'Decorated ghodi with dhol players', '12000', 'per event', '', 'true'),
  ('add_e10787fe09c9069b5c12c042', 'hall_267e67d2b3976b10ecee0cfa', 'Crystal Grand Mandap', 'STAGE', 'Crystal curtains, chandeliers & fresh flowers', '48000', 'per event', '', 'true'),
  ('add_9d3c6580b688d0f75c94be8b', 'hall_267e67d2b3976b10ecee0cfa', 'Chandelier Aisle Setup', 'DECOR', 'Aisle lined with chandeliers & petals', '22000', 'per event', '', 'true'),
  ('add_e4ce2d48f0659e7c56e7d434', 'hall_267e67d2b3976b10ecee0cfa', 'Sufi Qawwali Evening (2 hrs)', 'ENTERTAINMENT', 'Live qawwali troupe for the sangeet', '25000', 'per event', '', 'true'),
  ('add_3d8995ba3708b65275b2216a', 'hall_267e67d2b3976b10ecee0cfa', 'DJ, Sound & Dance Floor', 'SOUND', '6-hour DJ set with laser lights', '20000', 'per event', '', 'true'),
  ('add_7d7a08caace6a8877b24066d', 'hall_267e67d2b3976b10ecee0cfa', 'Doli & Palki Entry', 'VEHICLE', 'Traditional doli for the bride''s farewell', '18000', 'per event', '', 'true'),
  ('add_2f487e6a33f71a1a7b1db22f', 'hall_267e67d2b3976b10ecee0cfa', 'Maharaja Sofa Sets', 'FURNITURE', '10 carved sofa sets for the stage', '13000', 'per event', '', 'true'),
  ('add_7f6088c55fdb609d0a611d92', 'hall_4f766bef78b614f55a55721c', 'Nadaswaram Team (3 hrs)', 'ENTERTAINMENT', 'Classic nadaswaram & thavil for the muhurtham', '9000', 'per event', '', 'true'),
  ('add_5b6dc978d0acbb8541855a78', 'hall_4f766bef78b614f55a55721c', 'Floral Kolam & Mandap', 'STAGE', 'Traditional decor with jasmine & marigold', '30000', 'per event', '', 'true'),
  ('add_70358d6bcf934f0f7f6c7378', 'hall_4f766bef78b614f55a55721c', 'Photo & Video Coverage', 'PHOTOGRAPHY', '2 photographers + highlight reel', '35000', 'per event', '', 'true'),
  ('add_0b91f47daf465703c944ab93', 'hall_4f766bef78b614f55a55721c', 'Dining Leaf Service', 'FURNITURE', 'Traditional banana-leaf dining service', '8000', 'per event', '', 'true'),
  ('add_11d324e3e26601df7bc800f1', 'hall_4f766bef78b614f55a55721c', 'AC Guest Rooms (2)', 'FURNITURE', 'Two AC rooms for the families', '6000', 'per event', '', 'true'),
  ('add_4b92ee815f9f3fda914fb25e', 'hall_7458d7142ede56e3013363e1', 'Jasmine Pergola Mandap', 'STAGE', 'Living jasmine pergola with cane seating', '38000', 'per event', '', 'true'),
  ('add_afb3ad4554a7cabd41af5296', 'hall_7458d7142ede56e3013363e1', 'Bistro String Lighting', 'LIGHTING', 'Café-style string lights across the courtyard', '14000', 'per event', '', 'true'),
  ('add_403afa55ce49ba014e070241', 'hall_7458d7142ede56e3013363e1', 'Acoustic Live Band (2 hrs)', 'SOUND', 'Unplugged set during dinner', '16000', 'per event', '', 'true'),
  ('add_d1e4e9b06f565a673a2fc558', 'hall_7458d7142ede56e3013363e1', 'Brunch & Bubbles Counter', 'OTHER', 'Morning-after brunch counter for close family', '11000', 'per event', '', 'true'),
  ('add_edf8a6df3f709f079b630f06', 'hall_7458d7142ede56e3013363e1', 'Open Vintage Photo Booth', 'PHOTOGRAPHY', 'Instant-print booth with props', '7500', 'per event', '', 'true'),
  ('add_34ab04e00c1df6ce8ff1cf4b', 'hall_7458d7142ede56e3013363e1', 'E-rickshaw Venue Shuttle', 'VEHICLE', 'Guest shuttle from the main gate', '9000', 'per event', '', 'true'),
  ('add_ce6442d841ecd3528d6e4e92', 'hall_1ef2949ac6388b32d7241db8', 'Nikah Stage &Backdrop', 'STAGE', 'Elegant stage with cream drapes & florals', '26000', 'per event', '', 'true'),
  ('add_d70e61a33b1ff638538e6038', 'hall_1ef2949ac6388b32d7241db8', 'Golden Uplighting', 'LIGHTING', 'Warm uplighting across both halls', '12000', 'per event', '', 'true'),
  ('add_8e40b506fecf66f9d4a88dee', 'hall_1ef2949ac6388b32d7241db8', 'DJ & Sound (4 hrs)', 'SOUND', 'DJ set with subwoofer arrays', '15000', 'per event', '', 'true'),
  ('add_0396ba65ade7f7e200efc909', 'hall_1ef2949ac6388b32d7241db8', 'Dhol Party (1 hr)', 'ENTERTAINMENT', 'Dhol players for the baraat', '8000', 'per event', '', 'true'),
  ('add_fd013ac38d73cabe668b8924', 'hall_1ef2949ac6388b32d7241db8', 'Luxury Sedan Transfer', 'VEHICLE', 'Chauffeured sedan for the couple', '10000', 'per event', '', 'true');

-- ── menu_items ─────────────────────────────────────────────
INSERT INTO "menu_items" ("id", "hall_id", "name", "category", "diet_type", "description", "price_per_plate", "is_active") VALUES
  ('mi_6070d61d1140aaf66ba7b4f6', 'hall_73d60ffef2698f81c5636a7f', 'Paneer Tikka Angara', 'STARTER', 'VEG', '', '95', 'true'),
  ('mi_d218684182c7b9cdb3f7dded', 'hall_73d60ffef2698f81c5636a7f', 'Hara Bhara Kebab', 'STARTER', 'VEG', '', '75', 'true'),
  ('mi_1fdd07199a0a73ebce22e6a4', 'hall_73d60ffef2698f81c5636a7f', 'Dahi ke Kebab', 'STARTER', 'VEG', '', '85', 'true'),
  ('mi_a97ea33899150874a6a46144', 'hall_73d60ffef2698f81c5636a7f', 'Chicken Tikka Achari', 'STARTER', 'NON_VEG', '', '115', 'true'),
  ('mi_4962f5f2d8c86e9b97917fd4', 'hall_73d60ffef2698f81c5636a7f', 'Tandoori Chicken (Half)', 'STARTER', 'NON_VEG', '', '135', 'true'),
  ('mi_b2bacd8c241efb20a1c11d03', 'hall_73d60ffef2698f81c5636a7f', 'Tomato Dhaniya Shorba', 'SOUP', 'VEG', '', '45', 'true'),
  ('mi_5bbbcaed6a2a26ef4c505af8', 'hall_73d60ffef2698f81c5636a7f', 'Kachumber & Sprout Chaat', 'SALAD', 'VEG', '', '40', 'true'),
  ('mi_2ad3ab6d6975428ead438468', 'hall_73d60ffef2698f81c5636a7f', 'Dal Makhani', 'MAIN_COURSE', 'VEG', '', '85', 'true'),
  ('mi_d55864a0784f83f91a6d7600', 'hall_73d60ffef2698f81c5636a7f', 'Paneer Lababdar', 'MAIN_COURSE', 'VEG', '', '95', 'true'),
  ('mi_6862771eeaafec5fb369c50b', 'hall_73d60ffef2698f81c5636a7f', 'Veg Kolhapuri', 'MAIN_COURSE', 'VEG', '', '80', 'true'),
  ('mi_b278f4340a5e62fc87a54e73', 'hall_73d60ffef2698f81c5636a7f', 'Butter Chicken', 'MAIN_COURSE', 'NON_VEG', '', '145', 'true'),
  ('mi_1712eba14db08313cc77a9b0', 'hall_73d60ffef2698f81c5636a7f', 'Mutton Rogan Josh', 'MAIN_COURSE', 'NON_VEG', '', '175', 'true'),
  ('mi_10a75336a859e50b23530718', 'hall_73d60ffef2698f81c5636a7f', 'Butter Naan', 'BREAD', 'VEG', '', '25', 'true'),
  ('mi_8e5b357031888a537f5a3b8e', 'hall_73d60ffef2698f81c5636a7f', 'Lachha Paratha', 'BREAD', 'VEG', '', '30', 'true'),
  ('mi_c410085ad58af470652f66b0', 'hall_73d60ffef2698f81c5636a7f', 'Veg Dum Biryani', 'RICE', 'VEG', '', '90', 'true'),
  ('mi_439fa81cfb509eb5c6c4d1bb', 'hall_73d60ffef2698f81c5636a7f', 'Chicken Dum Biryani', 'RICE', 'NON_VEG', '', '135', 'true'),
  ('mi_799254a1e8994893076cd084', 'hall_73d60ffef2698f81c5636a7f', 'Gulab Jamun (2 pc)', 'DESSERT', 'VEG', '', '45', 'true'),
  ('mi_81c17c6e9f2540596de6a1db', 'hall_73d60ffef2698f81c5636a7f', 'Rasmalai (2 pc)', 'DESSERT', 'VEG', '', '55', 'true'),
  ('mi_f4ee09fa0f355521c6b01c27', 'hall_73d60ffef2698f81c5636a7f', 'Rose Sherbet / Fresh Lime', 'DRINKS', 'VEG', '', '35', 'true'),
  ('mi_096ce07fbe6befd57f0f9143', 'hall_73d60ffef2698f81c5636a7f', 'Chaat Live Counter', 'LIVE_COUNTER', 'VEG', '', '60', 'true'),
  ('mi_d6f5ed9f97ae0aa5d3adf52e', 'hall_7cab4e6cf83da04b19106f2d', 'Paneer Tikka Angara', 'STARTER', 'VEG', '', '95', 'true'),
  ('mi_845e280873cddbc55a9188e9', 'hall_7cab4e6cf83da04b19106f2d', 'Hara Bhara Kebab', 'STARTER', 'VEG', '', '75', 'true'),
  ('mi_4d75f4ee9b9bf084f33f82ea', 'hall_7cab4e6cf83da04b19106f2d', 'Dahi ke Kebab', 'STARTER', 'VEG', '', '85', 'true'),
  ('mi_d50cff39e70efc20af96324d', 'hall_7cab4e6cf83da04b19106f2d', 'Chicken Tikka Achari', 'STARTER', 'NON_VEG', '', '115', 'true'),
  ('mi_e75f8a974d2bc9c6540da523', 'hall_7cab4e6cf83da04b19106f2d', 'Tandoori Chicken (Half)', 'STARTER', 'NON_VEG', '', '135', 'true'),
  ('mi_f45551c6c3ead3e9040f457f', 'hall_7cab4e6cf83da04b19106f2d', 'Tomato Dhaniya Shorba', 'SOUP', 'VEG', '', '45', 'true'),
  ('mi_5d9457ee8f5761819f29c261', 'hall_7cab4e6cf83da04b19106f2d', 'Kachumber & Sprout Chaat', 'SALAD', 'VEG', '', '40', 'true'),
  ('mi_0afa6e062501d01a752641ba', 'hall_7cab4e6cf83da04b19106f2d', 'Dal Makhani', 'MAIN_COURSE', 'VEG', '', '85', 'true'),
  ('mi_ca806cf5e00b72a65b916560', 'hall_7cab4e6cf83da04b19106f2d', 'Paneer Lababdar', 'MAIN_COURSE', 'VEG', '', '95', 'true'),
  ('mi_b2de3fb549e5222c7ec3bb52', 'hall_7cab4e6cf83da04b19106f2d', 'Veg Kolhapuri', 'MAIN_COURSE', 'VEG', '', '80', 'true'),
  ('mi_9e0f74829ff3d669e413f8cf', 'hall_7cab4e6cf83da04b19106f2d', 'Butter Chicken', 'MAIN_COURSE', 'NON_VEG', '', '145', 'true'),
  ('mi_a87c3dfed5ae3a52dd7a3d4b', 'hall_7cab4e6cf83da04b19106f2d', 'Mutton Rogan Josh', 'MAIN_COURSE', 'NON_VEG', '', '175', 'true'),
  ('mi_82b1197b8bf82e367ef810b6', 'hall_7cab4e6cf83da04b19106f2d', 'Butter Naan', 'BREAD', 'VEG', '', '25', 'true'),
  ('mi_eddee15b7ff14c7cef9af0ce', 'hall_7cab4e6cf83da04b19106f2d', 'Lachha Paratha', 'BREAD', 'VEG', '', '30', 'true'),
  ('mi_f9e25b8f4bdebd0f94b57ec7', 'hall_7cab4e6cf83da04b19106f2d', 'Veg Dum Biryani', 'RICE', 'VEG', '', '90', 'true'),
  ('mi_d6f8cb0f672ae8a915ab08d1', 'hall_7cab4e6cf83da04b19106f2d', 'Chicken Dum Biryani', 'RICE', 'NON_VEG', '', '135', 'true'),
  ('mi_7f287d9775c93e6dbbe2811a', 'hall_7cab4e6cf83da04b19106f2d', 'Gulab Jamun (2 pc)', 'DESSERT', 'VEG', '', '45', 'true'),
  ('mi_b157d5b63a1e0139835b85e1', 'hall_7cab4e6cf83da04b19106f2d', 'Rasmalai (2 pc)', 'DESSERT', 'VEG', '', '55', 'true'),
  ('mi_c47ae3e1afbc7f39582a56f5', 'hall_7cab4e6cf83da04b19106f2d', 'Rose Sherbet / Fresh Lime', 'DRINKS', 'VEG', '', '35', 'true'),
  ('mi_9425a7febc2c8165379be57c', 'hall_7cab4e6cf83da04b19106f2d', 'Chaat Live Counter', 'LIVE_COUNTER', 'VEG', '', '60', 'true'),
  ('mi_c0fcb2124948290d4410a0f3', 'hall_267e67d2b3976b10ecee0cfa', 'Paneer Tikka Angara', 'STARTER', 'VEG', '', '95', 'true'),
  ('mi_7e4791f2ac7f92786f51daac', 'hall_267e67d2b3976b10ecee0cfa', 'Hara Bhara Kebab', 'STARTER', 'VEG', '', '75', 'true'),
  ('mi_0b69ad7bfbadaa2f92cc70e5', 'hall_267e67d2b3976b10ecee0cfa', 'Dahi ke Kebab', 'STARTER', 'VEG', '', '85', 'true'),
  ('mi_627ca8f74c112b2f5d7f9df3', 'hall_267e67d2b3976b10ecee0cfa', 'Chicken Tikka Achari', 'STARTER', 'NON_VEG', '', '115', 'true'),
  ('mi_a816b281190a0a5623ae6931', 'hall_267e67d2b3976b10ecee0cfa', 'Tandoori Chicken (Half)', 'STARTER', 'NON_VEG', '', '135', 'true'),
  ('mi_15ccf60a06f1b38ee293bfe4', 'hall_267e67d2b3976b10ecee0cfa', 'Tomato Dhaniya Shorba', 'SOUP', 'VEG', '', '45', 'true'),
  ('mi_c4225b37d3d7139bb2506f5c', 'hall_267e67d2b3976b10ecee0cfa', 'Kachumber & Sprout Chaat', 'SALAD', 'VEG', '', '40', 'true'),
  ('mi_c2de93e2851a9ec1896d992d', 'hall_267e67d2b3976b10ecee0cfa', 'Dal Makhani', 'MAIN_COURSE', 'VEG', '', '85', 'true'),
  ('mi_d98359f3fde29a34fe560b7e', 'hall_267e67d2b3976b10ecee0cfa', 'Paneer Lababdar', 'MAIN_COURSE', 'VEG', '', '95', 'true'),
  ('mi_59db7ea687c9edf169af93f2', 'hall_267e67d2b3976b10ecee0cfa', 'Veg Kolhapuri', 'MAIN_COURSE', 'VEG', '', '80', 'true'),
  ('mi_5613721ea3b48b14c9a5c766', 'hall_267e67d2b3976b10ecee0cfa', 'Butter Chicken', 'MAIN_COURSE', 'NON_VEG', '', '145', 'true'),
  ('mi_2b8e9be1c3f7d2d336ee94fb', 'hall_267e67d2b3976b10ecee0cfa', 'Mutton Rogan Josh', 'MAIN_COURSE', 'NON_VEG', '', '175', 'true'),
  ('mi_5d283cb664dd67608e474858', 'hall_267e67d2b3976b10ecee0cfa', 'Butter Naan', 'BREAD', 'VEG', '', '25', 'true'),
  ('mi_6c4309a2523591309ee8403a', 'hall_267e67d2b3976b10ecee0cfa', 'Lachha Paratha', 'BREAD', 'VEG', '', '30', 'true'),
  ('mi_1c4ba6003b14967f1becac15', 'hall_267e67d2b3976b10ecee0cfa', 'Veg Dum Biryani', 'RICE', 'VEG', '', '90', 'true'),
  ('mi_30930250091d99555fd21971', 'hall_267e67d2b3976b10ecee0cfa', 'Chicken Dum Biryani', 'RICE', 'NON_VEG', '', '135', 'true'),
  ('mi_6dc821dad0e6827027926c68', 'hall_267e67d2b3976b10ecee0cfa', 'Gulab Jamun (2 pc)', 'DESSERT', 'VEG', '', '45', 'true'),
  ('mi_4ec29512cbd46513500a3afc', 'hall_267e67d2b3976b10ecee0cfa', 'Rasmalai (2 pc)', 'DESSERT', 'VEG', '', '55', 'true'),
  ('mi_68bf4bc68559d24da906f628', 'hall_267e67d2b3976b10ecee0cfa', 'Rose Sherbet / Fresh Lime', 'DRINKS', 'VEG', '', '35', 'true'),
  ('mi_ec6cb1415ed58461d35e17de', 'hall_267e67d2b3976b10ecee0cfa', 'Chaat Live Counter', 'LIVE_COUNTER', 'VEG', '', '60', 'true'),
  ('mi_20aa8fe1ebabd18f9e4381ef', 'hall_4f766bef78b614f55a55721c', 'Paneer Tikka Angara', 'STARTER', 'VEG', '', '95', 'true'),
  ('mi_fdd86a204b4b10ef8a93708d', 'hall_4f766bef78b614f55a55721c', 'Hara Bhara Kebab', 'STARTER', 'VEG', '', '75', 'true'),
  ('mi_12fd1c91e65b57410e177354', 'hall_4f766bef78b614f55a55721c', 'Dahi ke Kebab', 'STARTER', 'VEG', '', '85', 'true'),
  ('mi_e77b7b920d90ed4278f8ee86', 'hall_4f766bef78b614f55a55721c', 'Chicken Tikka Achari', 'STARTER', 'NON_VEG', '', '115', 'true'),
  ('mi_055d0c007509bc353a550320', 'hall_4f766bef78b614f55a55721c', 'Tandoori Chicken (Half)', 'STARTER', 'NON_VEG', '', '135', 'true'),
  ('mi_985524ab23ca8c0d6d632f69', 'hall_4f766bef78b614f55a55721c', 'Tomato Dhaniya Shorba', 'SOUP', 'VEG', '', '45', 'true'),
  ('mi_6c7c581eaf2eaefe98467dfa', 'hall_4f766bef78b614f55a55721c', 'Kachumber & Sprout Chaat', 'SALAD', 'VEG', '', '40', 'true'),
  ('mi_a9b96db69276333b011d6d65', 'hall_4f766bef78b614f55a55721c', 'Dal Makhani', 'MAIN_COURSE', 'VEG', '', '85', 'true'),
  ('mi_8540129460825ca7109c25dc', 'hall_4f766bef78b614f55a55721c', 'Paneer Lababdar', 'MAIN_COURSE', 'VEG', '', '95', 'true'),
  ('mi_803169117acc73eca3db83b4', 'hall_4f766bef78b614f55a55721c', 'Veg Kolhapuri', 'MAIN_COURSE', 'VEG', '', '80', 'true'),
  ('mi_73c1fdb64874c967329e8926', 'hall_4f766bef78b614f55a55721c', 'Butter Chicken', 'MAIN_COURSE', 'NON_VEG', '', '145', 'true'),
  ('mi_bd1bdc6f1a7698eda7ad2ca3', 'hall_4f766bef78b614f55a55721c', 'Mutton Rogan Josh', 'MAIN_COURSE', 'NON_VEG', '', '175', 'true'),
  ('mi_35fee6e5853b51528b124913', 'hall_4f766bef78b614f55a55721c', 'Butter Naan', 'BREAD', 'VEG', '', '25', 'true'),
  ('mi_aab3f32b5eb2402dfd13189e', 'hall_4f766bef78b614f55a55721c', 'Lachha Paratha', 'BREAD', 'VEG', '', '30', 'true'),
  ('mi_f7e3b9b2495eab4fc880d3ec', 'hall_4f766bef78b614f55a55721c', 'Veg Dum Biryani', 'RICE', 'VEG', '', '90', 'true'),
  ('mi_09b862b8012d7771328ddd9f', 'hall_4f766bef78b614f55a55721c', 'Chicken Dum Biryani', 'RICE', 'NON_VEG', '', '135', 'true'),
  ('mi_858f397038932eb2dd87a79e', 'hall_4f766bef78b614f55a55721c', 'Gulab Jamun (2 pc)', 'DESSERT', 'VEG', '', '45', 'true'),
  ('mi_206735073361ff8eb4802eed', 'hall_4f766bef78b614f55a55721c', 'Rasmalai (2 pc)', 'DESSERT', 'VEG', '', '55', 'true'),
  ('mi_eb824bb7075635cb31e5901c', 'hall_4f766bef78b614f55a55721c', 'Rose Sherbet / Fresh Lime', 'DRINKS', 'VEG', '', '35', 'true'),
  ('mi_abe2a2afc85e93b4d349221f', 'hall_4f766bef78b614f55a55721c', 'Chaat Live Counter', 'LIVE_COUNTER', 'VEG', '', '60', 'true'),
  ('mi_76d77bdea821c908204ecacc', 'hall_7458d7142ede56e3013363e1', 'Paneer Tikka Angara', 'STARTER', 'VEG', '', '95', 'true'),
  ('mi_26832f1d1241742e086a275e', 'hall_7458d7142ede56e3013363e1', 'Hara Bhara Kebab', 'STARTER', 'VEG', '', '75', 'true'),
  ('mi_78e7e43ee8ed6f4181d0cdac', 'hall_7458d7142ede56e3013363e1', 'Dahi ke Kebab', 'STARTER', 'VEG', '', '85', 'true'),
  ('mi_3c72c1b8707ee3f31bbd705e', 'hall_7458d7142ede56e3013363e1', 'Chicken Tikka Achari', 'STARTER', 'NON_VEG', '', '115', 'true'),
  ('mi_2edf28b1701ee4cf7d774ba4', 'hall_7458d7142ede56e3013363e1', 'Tandoori Chicken (Half)', 'STARTER', 'NON_VEG', '', '135', 'true'),
  ('mi_d84d637a9ad3020bf70efcbc', 'hall_7458d7142ede56e3013363e1', 'Tomato Dhaniya Shorba', 'SOUP', 'VEG', '', '45', 'true'),
  ('mi_a1c8867e9850b1358604fc9b', 'hall_7458d7142ede56e3013363e1', 'Kachumber & Sprout Chaat', 'SALAD', 'VEG', '', '40', 'true'),
  ('mi_c1b2363b3cfad93fa922ca1c', 'hall_7458d7142ede56e3013363e1', 'Dal Makhani', 'MAIN_COURSE', 'VEG', '', '85', 'true'),
  ('mi_5eb233ec841548970629f4fb', 'hall_7458d7142ede56e3013363e1', 'Paneer Lababdar', 'MAIN_COURSE', 'VEG', '', '95', 'true'),
  ('mi_3fc4201d9e0828c2f72d271e', 'hall_7458d7142ede56e3013363e1', 'Veg Kolhapuri', 'MAIN_COURSE', 'VEG', '', '80', 'true'),
  ('mi_59a4c324aef7d539264c7702', 'hall_7458d7142ede56e3013363e1', 'Butter Chicken', 'MAIN_COURSE', 'NON_VEG', '', '145', 'true'),
  ('mi_6e28124dc7e98649569d935a', 'hall_7458d7142ede56e3013363e1', 'Mutton Rogan Josh', 'MAIN_COURSE', 'NON_VEG', '', '175', 'true'),
  ('mi_b48758d31feccfe3da865a8d', 'hall_7458d7142ede56e3013363e1', 'Butter Naan', 'BREAD', 'VEG', '', '25', 'true'),
  ('mi_d7d1ae4e947624fb5b262871', 'hall_7458d7142ede56e3013363e1', 'Lachha Paratha', 'BREAD', 'VEG', '', '30', 'true'),
  ('mi_31fa6db384d84b37054a0c6b', 'hall_7458d7142ede56e3013363e1', 'Veg Dum Biryani', 'RICE', 'VEG', '', '90', 'true'),
  ('mi_a855f707246aba5c94d4e7bc', 'hall_7458d7142ede56e3013363e1', 'Chicken Dum Biryani', 'RICE', 'NON_VEG', '', '135', 'true'),
  ('mi_ed5ddcc3c703b2b920c35a6b', 'hall_7458d7142ede56e3013363e1', 'Gulab Jamun (2 pc)', 'DESSERT', 'VEG', '', '45', 'true'),
  ('mi_068030d03b16a67b40a90cc1', 'hall_7458d7142ede56e3013363e1', 'Rasmalai (2 pc)', 'DESSERT', 'VEG', '', '55', 'true'),
  ('mi_06922d5942da06af48c108af', 'hall_7458d7142ede56e3013363e1', 'Rose Sherbet / Fresh Lime', 'DRINKS', 'VEG', '', '35', 'true'),
  ('mi_7b695aecc4083cb5a1ccfda7', 'hall_7458d7142ede56e3013363e1', 'Chaat Live Counter', 'LIVE_COUNTER', 'VEG', '', '60', 'true'),
  ('mi_d10302e1a18c11f6333c13c8', 'hall_1ef2949ac6388b32d7241db8', 'Paneer Tikka Angara', 'STARTER', 'VEG', '', '95', 'true'),
  ('mi_61a99701f84075315f2844fb', 'hall_1ef2949ac6388b32d7241db8', 'Hara Bhara Kebab', 'STARTER', 'VEG', '', '75', 'true'),
  ('mi_dc862b44bcdde1f4a600f343', 'hall_1ef2949ac6388b32d7241db8', 'Dahi ke Kebab', 'STARTER', 'VEG', '', '85', 'true'),
  ('mi_12551026c34ac1fe17bb7255', 'hall_1ef2949ac6388b32d7241db8', 'Chicken Tikka Achari', 'STARTER', 'NON_VEG', '', '115', 'true'),
  ('mi_54b8a7ca499949f9369e4ee5', 'hall_1ef2949ac6388b32d7241db8', 'Tandoori Chicken (Half)', 'STARTER', 'NON_VEG', '', '135', 'true'),
  ('mi_67540d812975a0c22c628b63', 'hall_1ef2949ac6388b32d7241db8', 'Tomato Dhaniya Shorba', 'SOUP', 'VEG', '', '45', 'true'),
  ('mi_9b7405191c7bf53940a29848', 'hall_1ef2949ac6388b32d7241db8', 'Kachumber & Sprout Chaat', 'SALAD', 'VEG', '', '40', 'true'),
  ('mi_6d9291fe60fca23bf2a5c0e8', 'hall_1ef2949ac6388b32d7241db8', 'Dal Makhani', 'MAIN_COURSE', 'VEG', '', '85', 'true'),
  ('mi_d0333f9cfcc1009d4b57ad99', 'hall_1ef2949ac6388b32d7241db8', 'Paneer Lababdar', 'MAIN_COURSE', 'VEG', '', '95', 'true'),
  ('mi_90caade9798d236783910a89', 'hall_1ef2949ac6388b32d7241db8', 'Veg Kolhapuri', 'MAIN_COURSE', 'VEG', '', '80', 'true'),
  ('mi_f9e6663edc79315231f93835', 'hall_1ef2949ac6388b32d7241db8', 'Butter Chicken', 'MAIN_COURSE', 'NON_VEG', '', '145', 'true'),
  ('mi_848cd3e7b33adf26edb88846', 'hall_1ef2949ac6388b32d7241db8', 'Mutton Rogan Josh', 'MAIN_COURSE', 'NON_VEG', '', '175', 'true'),
  ('mi_71f43dcf3feca16d77aaf54b', 'hall_1ef2949ac6388b32d7241db8', 'Butter Naan', 'BREAD', 'VEG', '', '25', 'true'),
  ('mi_934459a1139db1e8649cdca3', 'hall_1ef2949ac6388b32d7241db8', 'Lachha Paratha', 'BREAD', 'VEG', '', '30', 'true'),
  ('mi_929bca17d75ecf0dee219281', 'hall_1ef2949ac6388b32d7241db8', 'Veg Dum Biryani', 'RICE', 'VEG', '', '90', 'true'),
  ('mi_dca35f57a58b31591b50d59b', 'hall_1ef2949ac6388b32d7241db8', 'Chicken Dum Biryani', 'RICE', 'NON_VEG', '', '135', 'true'),
  ('mi_ce0eb89a2267abe3242752b7', 'hall_1ef2949ac6388b32d7241db8', 'Gulab Jamun (2 pc)', 'DESSERT', 'VEG', '', '45', 'true'),
  ('mi_80ae4df247346f9db67d1aa8', 'hall_1ef2949ac6388b32d7241db8', 'Rasmalai (2 pc)', 'DESSERT', 'VEG', '', '55', 'true'),
  ('mi_c63ef6d71d0ee39c86c32885', 'hall_1ef2949ac6388b32d7241db8', 'Rose Sherbet / Fresh Lime', 'DRINKS', 'VEG', '', '35', 'true'),
  ('mi_5a4610c2f0cb513f20972bd1', 'hall_1ef2949ac6388b32d7241db8', 'Chaat Live Counter', 'LIVE_COUNTER', 'VEG', '', '60', 'true');

-- ── menu_packages ─────────────────────────────────────────────
INSERT INTO "menu_packages" ("id", "hall_id", "name", "description", "price_per_plate", "diet_type", "items", "image", "is_active") VALUES
  ('pkg_9075929d9951519150541d69', 'hall_73d60ffef2698f81c5636a7f', 'Silver Jubilee Veg', 'Classic vegetarian spread with 12 curated dishes', '649', 'VEG', '{mi_6070d61d1140aaf66ba7b4f6,mi_d218684182c7b9cdb3f7dded,mi_1fdd07199a0a73ebce22e6a4,mi_a97ea33899150874a6a46144,mi_4962f5f2d8c86e9b97917fd4,mi_b2bacd8c241efb20a1c11d03,mi_5bbbcaed6a2a26ef4c505af8,mi_2ad3ab6d6975428ead438468}', '', 'true'),
  ('pkg_b80c6a15c177e1daa695b681', 'hall_73d60ffef2698f81c5636a7f', 'Golden Veg Celebration', 'Premium vegetarian feast with live counters', '849', 'VEG', '{mi_6070d61d1140aaf66ba7b4f6,mi_d218684182c7b9cdb3f7dded,mi_1fdd07199a0a73ebce22e6a4,mi_a97ea33899150874a6a46144,mi_4962f5f2d8c86e9b97917fd4,mi_b2bacd8c241efb20a1c11d03,mi_5bbbcaed6a2a26ef4c505af8,mi_2ad3ab6d6975428ead438468,mi_d55864a0784f83f91a6d7600,mi_6862771eeaafec5fb369c50b,mi_b278f4340a5e62fc87a54e73}', '', 'true'),
  ('pkg_ed3b8a23ce0d388bc4c40ab6', 'hall_73d60ffef2698f81c5636a7f', 'Shahi Non-Veg Royal', 'Royal Rajputana menu with signature kebabs', '1099', 'NON_VEG', '{mi_6070d61d1140aaf66ba7b4f6,mi_d218684182c7b9cdb3f7dded,mi_1fdd07199a0a73ebce22e6a4,mi_a97ea33899150874a6a46144,mi_4962f5f2d8c86e9b97917fd4,mi_b2bacd8c241efb20a1c11d03,mi_5bbbcaed6a2a26ef4c505af8,mi_2ad3ab6d6975428ead438468,mi_d55864a0784f83f91a6d7600,mi_6862771eeaafec5fb369c50b,mi_b278f4340a5e62fc87a54e73,mi_1712eba14db08313cc77a9b0}', '', 'true'),
  ('pkg_9281ea8c7df8a5dffd25e0e1', 'hall_73d60ffef2698f81c5636a7f', 'Maharaja Grand Buffet', 'The works — 18 dishes, 3 live counters, dessert bar', '1299', 'NON_VEG', '{mi_6070d61d1140aaf66ba7b4f6,mi_d218684182c7b9cdb3f7dded,mi_1fdd07199a0a73ebce22e6a4,mi_a97ea33899150874a6a46144,mi_4962f5f2d8c86e9b97917fd4,mi_b2bacd8c241efb20a1c11d03,mi_5bbbcaed6a2a26ef4c505af8,mi_2ad3ab6d6975428ead438468,mi_d55864a0784f83f91a6d7600,mi_6862771eeaafec5fb369c50b,mi_b278f4340a5e62fc87a54e73,mi_1712eba14db08313cc77a9b0,mi_10a75336a859e50b23530718,mi_8e5b357031888a537f5a3b8e,mi_c410085ad58af470652f66b0,mi_439fa81cfb509eb5c6c4d1bb}', '', 'true'),
  ('pkg_b07b61bedf4606b315df5edf', 'hall_7cab4e6cf83da04b19106f2d', 'Garden Veg Delight', 'Garden-fresh vegetarian menu, 11 dishes', '599', 'VEG', '{mi_d6f5ed9f97ae0aa5d3adf52e,mi_845e280873cddbc55a9188e9,mi_4d75f4ee9b9bf084f33f82ea,mi_d50cff39e70efc20af96324d,mi_e75f8a974d2bc9c6540da523,mi_f45551c6c3ead3e9040f457f,mi_5d9457ee8f5761819f29c261,mi_0afa6e062501d01a752641ba}', '', 'true'),
  ('pkg_13b50bbc818541c059bda5c8', 'hall_7cab4e6cf83da04b19106f2d', 'Emerald Veg Signature', 'Signature vegetarian spread with Hyderabadi twists', '799', 'VEG', '{mi_d6f5ed9f97ae0aa5d3adf52e,mi_845e280873cddbc55a9188e9,mi_4d75f4ee9b9bf084f33f82ea,mi_d50cff39e70efc20af96324d,mi_e75f8a974d2bc9c6540da523,mi_f45551c6c3ead3e9040f457f,mi_5d9457ee8f5761819f29c261,mi_0afa6e062501d01a752641ba,mi_ca806cf5e00b72a65b916560,mi_b2de3fb549e5222c7ec3bb52,mi_9e0f74829ff3d669e413f8cf}', '', 'true'),
  ('pkg_915b54cf243add63bb4bfa7a', 'hall_7cab4e6cf83da04b19106f2d', 'Nizam''s Non-Veg Feast', 'Deccan royal menu with dum biryani & haleem', '1049', 'NON_VEG', '{mi_d6f5ed9f97ae0aa5d3adf52e,mi_845e280873cddbc55a9188e9,mi_4d75f4ee9b9bf084f33f82ea,mi_d50cff39e70efc20af96324d,mi_e75f8a974d2bc9c6540da523,mi_f45551c6c3ead3e9040f457f,mi_5d9457ee8f5761819f29c261,mi_0afa6e062501d01a752641ba,mi_ca806cf5e00b72a65b916560,mi_b2de3fb549e5222c7ec3bb52,mi_9e0f74829ff3d669e413f8cf,mi_a87c3dfed5ae3a52dd7a3d4b}', '', 'true'),
  ('pkg_07f4039ab5aa43d30c74dcea', 'hall_267e67d2b3976b10ecee0cfa', 'Shagun Veg Shringar', 'Awadhi vegetarian menu, 12 dishes', '699', 'VEG', '{mi_c0fcb2124948290d4410a0f3,mi_7e4791f2ac7f92786f51daac,mi_0b69ad7bfbadaa2f92cc70e5,mi_627ca8f74c112b2f5d7f9df3,mi_a816b281190a0a5623ae6931,mi_15ccf60a06f1b38ee293bfe4,mi_c4225b37d3d7139bb2506f5c,mi_c2de93e2851a9ec1896d992d,mi_d98359f3fde29a34fe560b7e}', '', 'true'),
  ('pkg_0a2b5ac83bab90de37ba4724', 'hall_267e67d2b3976b10ecee0cfa', 'Nawab veg Darbar', 'Elaborate vegetarian darbar menu', '899', 'VEG', '{mi_c0fcb2124948290d4410a0f3,mi_7e4791f2ac7f92786f51daac,mi_0b69ad7bfbadaa2f92cc70e5,mi_627ca8f74c112b2f5d7f9df3,mi_a816b281190a0a5623ae6931,mi_15ccf60a06f1b38ee293bfe4,mi_c4225b37d3d7139bb2506f5c,mi_c2de93e2851a9ec1896d992d,mi_d98359f3fde29a34fe560b7e,mi_59db7ea687c9edf169af93f2,mi_5613721ea3b48b14c9a5c766,mi_2b8e9be1c3f7d2d336ee94fb}', '', 'true'),
  ('pkg_45428a2b70c9fbbf0390fbac', 'hall_267e67d2b3976b10ecee0cfa', 'Awadhi Shahi Non-Veg', 'Galouti, biryani & kormas from our master chefs', '1149', 'NON_VEG', '{mi_c0fcb2124948290d4410a0f3,mi_7e4791f2ac7f92786f51daac,mi_0b69ad7bfbadaa2f92cc70e5,mi_627ca8f74c112b2f5d7f9df3,mi_a816b281190a0a5623ae6931,mi_15ccf60a06f1b38ee293bfe4,mi_c4225b37d3d7139bb2506f5c,mi_c2de93e2851a9ec1896d992d,mi_d98359f3fde29a34fe560b7e,mi_59db7ea687c9edf169af93f2,mi_5613721ea3b48b14c9a5c766,mi_2b8e9be1c3f7d2d336ee94fb,mi_5d283cb664dd67608e474858}', '', 'true'),
  ('pkg_efbcd9cce9bcfb11a9e60af8', 'hall_4f766bef78b614f55a55721c', 'Muhurtham Veg Menu', 'Traditional 10-dish vegetarian muhurtham lunch', '549', 'VEG', '{mi_20aa8fe1ebabd18f9e4381ef,mi_fdd86a204b4b10ef8a93708d,mi_12fd1c91e65b57410e177354,mi_e77b7b920d90ed4278f8ee86,mi_055d0c007509bc353a550320,mi_985524ab23ca8c0d6d632f69,mi_6c7c581eaf2eaefe98467dfa,mi_a9b96db69276333b011d6d65}', '', 'true'),
  ('pkg_099687b8d4c299f4b9e95238', 'hall_4f766bef78b614f55a55721c', 'Kalyani Veg Grand', 'Grand vegetarian banquet with payasam bar', '749', 'VEG', '{mi_20aa8fe1ebabd18f9e4381ef,mi_fdd86a204b4b10ef8a93708d,mi_12fd1c91e65b57410e177354,mi_e77b7b920d90ed4278f8ee86,mi_055d0c007509bc353a550320,mi_985524ab23ca8c0d6d632f69,mi_6c7c581eaf2eaefe98467dfa,mi_a9b96db69276333b011d6d65,mi_8540129460825ca7109c25dc,mi_803169117acc73eca3db83b4,mi_73c1fdb64874c967329e8926}', '', 'true'),
  ('pkg_33d51099963c75d151b6fa3e', 'hall_4f766bef78b614f55a55721c', 'Chettinad Non-Veg Special', 'Chettinad classics — kara kozhambut to kuzhi paniyaram', '949', 'NON_VEG', '{mi_20aa8fe1ebabd18f9e4381ef,mi_fdd86a204b4b10ef8a93708d,mi_12fd1c91e65b57410e177354,mi_e77b7b920d90ed4278f8ee86,mi_055d0c007509bc353a550320,mi_985524ab23ca8c0d6d632f69,mi_6c7c581eaf2eaefe98467dfa,mi_a9b96db69276333b011d6d65,mi_8540129460825ca7109c25dc,mi_803169117acc73eca3db83b4,mi_73c1fdb64874c967329e8926,mi_bd1bdc6f1a7698eda7ad2ca3}', '', 'true'),
  ('pkg_cd84ab97ae6bd012066e4f41', 'hall_7458d7142ede56e3013363e1', 'Garden Veg Soirée', 'Farm-fresh vegetarian menu, 11 dishes', '599', 'VEG', '{mi_76d77bdea821c908204ecacc,mi_26832f1d1241742e086a275e,mi_78e7e43ee8ed6f4181d0cdac,mi_3c72c1b8707ee3f31bbd705e,mi_2edf28b1701ee4cf7d774ba4,mi_d84d637a9ad3020bf70efcbc,mi_a1c8867e9850b1358604fc9b,mi_c1b2363b3cfad93fa922ca1c}', '', 'true'),
  ('pkg_f0d7e211c3ee6b7da15a0f0d', 'hall_7458d7142ede56e3013363e1', 'Amara Veg Reserve', 'Reserve vegetarian menu with artisanal desserts', '799', 'VEG', '{mi_76d77bdea821c908204ecacc,mi_26832f1d1241742e086a275e,mi_78e7e43ee8ed6f4181d0cdac,mi_3c72c1b8707ee3f31bbd705e,mi_2edf28b1701ee4cf7d774ba4,mi_d84d637a9ad3020bf70efcbc,mi_a1c8867e9850b1358604fc9b,mi_c1b2363b3cfad93fa922ca1c,mi_5eb233ec841548970629f4fb,mi_3fc4201d9e0828c2f72d271e,mi_59a4c324aef7d539264c7702}', '', 'true'),
  ('pkg_c0d1bae220ecf668c25b0ed2', 'hall_7458d7142ede56e3013363e1', 'Coastal Non-Veg Trawler', 'Mangalorean coastal spread with seafood counters', '999', 'NON_VEG', '{mi_76d77bdea821c908204ecacc,mi_26832f1d1241742e086a275e,mi_78e7e43ee8ed6f4181d0cdac,mi_3c72c1b8707ee3f31bbd705e,mi_2edf28b1701ee4cf7d774ba4,mi_d84d637a9ad3020bf70efcbc,mi_a1c8867e9850b1358604fc9b,mi_c1b2363b3cfad93fa922ca1c,mi_5eb233ec841548970629f4fb,mi_3fc4201d9e0828c2f72d271e,mi_59a4c324aef7d539264c7702,mi_6e28124dc7e98649569d935a}', '', 'true'),
  ('pkg_c8d489a50027b0ee32d80712', 'hall_1ef2949ac6388b32d7241db8', 'Noor Veg Dawat', 'Hearty vegetarian dawat, 10 dishes', '499', 'VEG', '{mi_d10302e1a18c11f6333c13c8,mi_61a99701f84075315f2844fb,mi_dc862b44bcdde1f4a600f343,mi_12551026c34ac1fe17bb7255,mi_54b8a7ca499949f9369e4ee5,mi_67540d812975a0c22c628b63,mi_9b7405191c7bf53940a29848,mi_6d9291fe60fca23bf2a5c0e8}', '', 'true'),
  ('pkg_dd8623d7657e69f83fb94756', 'hall_1ef2949ac6388b32d7241db8', 'Shahi Veg Bada Khana', 'Grand vegetarian bada khana', '699', 'VEG', '{mi_d10302e1a18c11f6333c13c8,mi_61a99701f84075315f2844fb,mi_dc862b44bcdde1f4a600f343,mi_12551026c34ac1fe17bb7255,mi_54b8a7ca499949f9369e4ee5,mi_67540d812975a0c22c628b63,mi_9b7405191c7bf53940a29848,mi_6d9291fe60fca23bf2a5c0e8,mi_d0333f9cfcc1009d4b57ad99,mi_90caade9798d236783910a89,mi_f9e6663edc79315231f93835}', '', 'true'),
  ('pkg_bbe25a77ecfb8f2fca62fb4c', 'hall_1ef2949ac6388b32d7241db8', 'Mughlai Non-Veg Bada Khana', 'Mughlai classics — kebabs, biryani & sheermal', '949', 'NON_VEG', '{mi_d10302e1a18c11f6333c13c8,mi_61a99701f84075315f2844fb,mi_dc862b44bcdde1f4a600f343,mi_12551026c34ac1fe17bb7255,mi_54b8a7ca499949f9369e4ee5,mi_67540d812975a0c22c628b63,mi_9b7405191c7bf53940a29848,mi_6d9291fe60fca23bf2a5c0e8,mi_d0333f9cfcc1009d4b57ad99,mi_90caade9798d236783910a89,mi_f9e6663edc79315231f93835,mi_848cd3e7b33adf26edb88846}', '', 'true');

-- ── bookings ─────────────────────────────────────────────
INSERT INTO "bookings" ("id", "hall_id", "booked_by_user_id", "customer_name", "customer_phone", "customer_email", "event_type", "event_date", "slot", "guest_count", "menu_package_id", "menu_package_name", "plate_price", "hall_rent", "addons", "catering_total", "addons_total", "discount", "total_amount", "advance_amount", "paid_amount", "status", "notes", "source", "created_at", "updated_at") VALUES
  ('bkg_8e2806028a2c1fb55b4753d0', 'hall_73d60ffef2698f81c5636a7f', NULL, 'Kavita & Rohit Sharma', '+91 98111 20001', 'kavita.sharma@gmail.com', 'Wedding', '2026-05-05', 'DINNER', '700', 'pkg_ed3b8a23ce0d388bc4c40ab6', 'Shahi Non-Veg Royal', '1099', '150000', '[{"id": "add_51ffcaebfc2a2169ed445bd3", "qty": 1, "name": "Royal Floral Mandap", "unit": "per event", "price": 55000}, {"id": "add_a69b7a12ee11d24a52852950", "qty": 1, "name": "DJ, Sound & Dance Floor", "unit": "per event", "price": 22000}]', '769300', '77000', '0', '996300', '249000', '996300', 'COMPLETED', '', 'DASHBOARD', '2026-04-14 11:24:00', '2026-05-05 11:24:00'),
  ('bkg_a9b3f45a18962c0cd22aff0d', 'hall_73d60ffef2698f81c5636a7f', NULL, 'The Bhandari Family', '+91 98111 20002', 'bhandari.ujwal@gmail.com', 'Reception', '2026-06-01', 'DINNER', '450', 'pkg_b80c6a15c177e1daa695b681', 'Golden Veg Celebration', '849', '150000', '[{"id": "add_482790c18f8c6734e3124b48", "qty": 1, "name": "Fairy Lighting & Drapes", "unit": "per event", "price": 18000}]', '382050', '18000', '5000', '545050', '136000', '545050', 'COMPLETED', '', 'DASHBOARD', '2026-05-11 11:24:00', '2026-06-01 11:24:00'),
  ('bkg_120d4276194795e450211f05', 'hall_73d60ffef2698f81c5636a7f', NULL, 'Aditi & Siddharth Jain', '+91 98111 20003', 'aditi.jain@gmail.com', 'Wedding', '2026-07-01', 'FULL_DAY', '850', 'pkg_9281ea8c7df8a5dffd25e0e1', 'Maharaja Grand Buffet', '1299', '150000', '[{"id": "add_51ffcaebfc2a2169ed445bd3", "qty": 1, "name": "Royal Floral Mandap", "unit": "per event", "price": 55000}, {"id": "add_465f089ea340fc4b8045414b", "qty": 1, "name": "Cold Pyro Sparklers (Entry)", "unit": "per event", "price": 7500}, {"id": "add_8f693afb293df7bab6bec9ef", "qty": 1, "name": "LED Wall (20 ft)", "unit": "per event", "price": 35000}]', '1104150', '97500', '0', '1351650', '338000', '1351650', 'COMPLETED', 'Jain counters x2, separate cooking area requested.', 'DASHBOARD', '2026-06-10 11:24:00', '2026-07-01 11:24:00'),
  ('bkg_fc034ffb1f41de82e60fa592', 'hall_73d60ffef2698f81c5636a7f', NULL, 'Mehta Family (Sangeet)', '+91 98111 20004', 'nikhil.mehta@gmail.com', 'Sangeet', '2026-08-11', 'DINNER', '300', 'pkg_9075929d9951519150541d69', 'Silver Jubilee Veg', '649', '150000', '[{"id": "add_a69b7a12ee11d24a52852950", "qty": 1, "name": "DJ, Sound & Dance Floor", "unit": "per event", "price": 22000}, {"id": "add_d5382fdf585253d9b3d89713", "qty": 1, "name": "Premium Sofa & Lounge Set", "unit": "per event", "price": 12000}]', '194700', '34000', '10000', '368700', '92000', '368700', 'COMPLETED', '', 'DASHBOARD', '2026-07-21 11:24:00', '2026-08-11 11:24:00'),
  ('bkg_278e54b47906d4cff1397451', 'hall_73d60ffef2698f81c5636a7f', NULL, 'Ritika & Aakash Tomar', '+91 98111 20005', 'ritika.tomar@gmail.com', 'Engagement', '2026-09-15', 'LUNCH', '220', 'pkg_b80c6a15c177e1daa695b681', 'Golden Veg Celebration', '849', '150000', '[]', '186780', '0', '0', '336780', '84000', '336780', 'COMPLETED', '', 'DASHBOARD', '2026-08-25 11:24:00', '2026-09-15 11:24:00'),
  ('bkg_5fcfa5ea62be0c1117474dff', 'hall_73d60ffef2698f81c5636a7f', NULL, 'Devansh & Family', '+91 98111 20006', 'devansh.agarwal@gmail.com', 'Haldi / Mehndi', '2026-07-29', 'LUNCH', '150', NULL, '', '0', '150000', '[]', '0', '0', '0', '150000', '0', '0', 'CANCELLED', 'Cancelled — family opted for a farmhouse instead.', 'DASHBOARD', '2026-07-08 11:24:00', '2026-07-29 11:24:00'),
  ('bkg_6dfb3b029a55b198972388e2', 'hall_73d60ffef2698f81c5636a7f', 'usr_46a83ba708c50444380600e2', 'Priya Kapoor & Aarav Nair', '+91 98111 20007', 'priya.k@gmail.com', 'Wedding', '2026-10-01', 'DINNER', '650', 'pkg_9281ea8c7df8a5dffd25e0e1', 'Maharaja Grand Buffet', '1299', '150000', '[{"id": "add_51ffcaebfc2a2169ed445bd3", "qty": 1, "name": "Royal Floral Mandap", "unit": "per event", "price": 55000}, {"id": "add_465f089ea340fc4b8045414b", "qty": 1, "name": "Cold Pyro Sparklers (Entry)", "unit": "per event", "price": 7500}, {"id": "add_6c169730a2fd46e92dc1af3d", "qty": 1, "name": "Vintage Car Baraat Entry", "unit": "per event", "price": 15000}]', '844350', '77500', '15000', '1056850', '264000', '264000', 'CONFIRMED', 'Baraat arrives 6 PM. Two Jain food counters required.', 'WEBSITE', '2026-09-10 11:24:00', '2026-09-26 11:24:00'),
  ('bkg_34614c7b593bbdf5563640a9', 'hall_73d60ffef2698f81c5636a7f', NULL, 'The Khetan Family', '+91 98111 20008', 'sumit.khetan@gmail.com', 'Reception', '2026-10-15', 'DINNER', '500', 'pkg_ed3b8a23ce0d388bc4c40ab6', 'Shahi Non-Veg Royal', '1099', '150000', '[{"id": "add_8f693afb293df7bab6bec9ef", "qty": 1, "name": "LED Wall (20 ft)", "unit": "per event", "price": 35000}, {"id": "add_a69b7a12ee11d24a52852950", "qty": 1, "name": "DJ, Sound & Dance Floor", "unit": "per event", "price": 22000}]', '549500', '57000', '0', '756500', '189000', '189000', 'CONFIRMED', '', 'DASHBOARD', '2026-09-24 11:24:00', '2026-09-26 11:24:00'),
  ('bkg_7dc00b4afed822fb9a96df4c', 'hall_73d60ffef2698f81c5636a7f', 'usr_ef417511af41fa448f785d78', 'Rohan Gupta', '+91 98111 20009', 'rohan.g@gmail.com', 'Sangeet', '2026-10-28', 'DINNER', '280', 'pkg_b80c6a15c177e1daa695b681', 'Golden Veg Celebration', '849', '150000', '[{"id": "add_a69b7a12ee11d24a52852950", "qty": 1, "name": "DJ, Sound & Dance Floor", "unit": "per event", "price": 22000}]', '237720', '22000', '0', '409720', '102000', '0', 'PENDING', 'Wants a mocktail-only bar and karaoke setup.', 'WEBSITE', '2026-10-07 11:24:00', '2026-09-26 11:24:00'),
  ('bkg_b90eadd2709e3d56f449714a', 'hall_73d60ffef2698f81c5636a7f', NULL, 'Anaya Bhandari', '+91 98111 20010', 'anaya.b@gmail.com', 'Baby Shower', '2026-11-18', 'LUNCH', '120', 'pkg_9075929d9951519150541d69', 'Silver Jubilee Veg', '649', '150000', '[]', '77880', '0', '0', '227880', '57000', '0', 'PENDING', '', 'DASHBOARD', '2026-10-28 11:24:00', '2026-09-26 11:24:00'),
  ('bkg_39b839d5dac899f04ee1ef28', 'hall_7cab4e6cf83da04b19106f2d', NULL, 'Sirisha & Vikas Reddy', '+91 99590 30001', 'sirisha.r@gmail.com', 'Wedding', '2026-05-18', 'FULL_DAY', '600', 'pkg_915b54cf243add63bb4bfa7a', 'Nizam''s Non-Veg Feast', '1049', '95000', '[{"id": "add_df37b8e1c8385c5ca7a3b353", "qty": 1, "name": "Garden Mandap with Arch", "unit": "per event", "price": 42000}, {"id": "add_a927f8fb49438f1c1a8dcca2", "qty": 1, "name": "Sparkler Tunnel Entry", "unit": "per event", "price": 8500}]', '629400', '50500', '0', '774900', '194000', '774900', 'COMPLETED', '', 'DASHBOARD', '2026-04-27 11:24:00', '2026-05-18 11:24:00'),
  ('bkg_62ab288dbac638e19af40c9e', 'hall_7cab4e6cf83da04b19106f2d', NULL, 'The Muppalla Family', '+91 99590 30002', 'kiran.muppalla@gmail.com', 'Reception', '2026-07-14', 'DINNER', '380', 'pkg_13b50bbc818541c059bda5c8', 'Emerald Veg Signature', '799', '95000', '[{"id": "add_da0a33974bdcf9ad6c7d7d54", "qty": 1, "name": "Festoon & Bollard Lighting", "unit": "per event", "price": 16000}]', '303620', '16000', '0', '414620', '104000', '414620', 'COMPLETED', '', 'DASHBOARD', '2026-06-23 11:24:00', '2026-07-14 11:24:00'),
  ('bkg_cc6df3c7372108300b5fc5f4', 'hall_7cab4e6cf83da04b19106f2d', NULL, 'Divya & Arjun Pellikuthuru', '+91 99590 30003', 'divya.p@gmail.com', 'Haldi / Mehndi', '2026-09-07', 'LUNCH', '180', 'pkg_b07b61bedf4606b315df5edf', 'Garden Veg Delight', '599', '95000', '[{"id": "add_8d3a9b9e4c29e0db9c3daf2c", "qty": 1, "name": "Haldi & Mehndi Corner", "unit": "per event", "price": 20000}]', '107820', '20000', '3000', '219820', '55000', '219820', 'COMPLETED', '', 'DASHBOARD', '2026-08-17 11:24:00', '2026-09-07 11:24:00'),
  ('bkg_e8b1be2997e87e0e08f8f495', 'hall_7cab4e6cf83da04b19106f2d', NULL, 'Ishaan & Tara Verma', '+91 99590 30004', 'tara.verma@gmail.com', 'Wedding', '2026-08-25', 'FULL_DAY', '520', 'pkg_915b54cf243add63bb4bfa7a', 'Nizam''s Non-Veg Feast', '1049', '95000', '[{"id": "add_df37b8e1c8385c5ca7a3b353", "qty": 1, "name": "Garden Mandap with Arch", "unit": "per event", "price": 42000}, {"id": "add_9eb925ef3455ad6da3370c2a", "qty": 1, "name": "Horse Baraat Entry", "unit": "per event", "price": 12000}]', '545480', '54000', '0', '694480', '0', '0', 'CANCELLED', 'Cancelled due to a family emergency — advance refunded.', 'DASHBOARD', '2026-08-04 11:24:00', '2026-08-25 11:24:00'),
  ('bkg_307e5acb0ee6a56b73b98e40', 'hall_1ef2949ac6388b32d7241db8', 'usr_46a8ebe02d8f46021b703586', 'Rahul Verma', '+91 97660 60002', 'rahul.verma@gmail.com', 'Reception', '2026-10-17', 'DINNER', '240', 'pkg_c8d489a50027b0ee32d80712', 'Noor Veg Dawat', '499', '60000', '[{"id": "add_d70e61a33b1ff638538e6038", "qty": 1, "name": "Golden Uplighting", "unit": "per event", "price": 12000}]', '119760', '12000', '0', '191760', '48000', '0', 'PENDING', 'Wants to visit the venue before confirming.', 'WEBSITE', '2026-09-26 11:24:00', '2026-09-26 11:24:00'),
  ('bkg_f6bbb0ad067ad8a991c5f104', 'hall_7cab4e6cf83da04b19106f2d', 'usr_0fdd79823d201466320e1082', 'Ananya Iyer & Nikhil Rao', '+91 99590 30005', 'ananya.iyer@gmail.com', 'Wedding', '2026-10-08', 'FULL_DAY', '550', 'pkg_13b50bbc818541c059bda5c8', 'Emerald Veg Signature', '799', '95000', '[{"id": "add_df37b8e1c8385c5ca7a3b353", "qty": 1, "name": "Garden Mandap with Arch", "unit": "per event", "price": 42000}, {"id": "add_da0a33974bdcf9ad6c7d7d54", "qty": 1, "name": "Festoon & Bollard Lighting", "unit": "per event", "price": 16000}, {"id": "add_b1202b2f439bb45a376ef13d", "qty": 1, "name": "Couple Photoshoot Corner", "unit": "per event", "price": 8500}]', '439450', '66500', '0', '600950', '150000', '150000', 'CONFIRMED', 'Muhurtham at 7:10 AM — early access requested from 5 AM.', 'WEBSITE', '2026-09-17 11:24:00', '2026-09-26 11:24:00'),
  ('bkg_55077b2f5c70d6920aafcef8', 'hall_7cab4e6cf83da04b19106f2d', NULL, 'The Grandhi Family', '+91 99590 30006', 'grandhi.s@gmail.com', 'Anniversary', '2026-10-23', 'LUNCH', '140', 'pkg_b07b61bedf4606b315df5edf', 'Garden Veg Delight', '599', '95000', '[]', '83860', '0', '0', '178860', '45000', '0', 'PENDING', '', 'DASHBOARD', '2026-10-02 11:24:00', '2026-09-26 11:24:00'),
  ('bkg_eade19ff87ab649bbedbeae9', 'hall_267e67d2b3976b10ecee0cfa', NULL, 'Sneha & Vaibhav Dixit', '+91 94150 40001', 'sneha.dixit@gmail.com', 'Wedding', '2026-04-20', 'DINNER', '1000', 'pkg_45428a2b70c9fbbf0390fbac', 'Awadhi Shahi Non-Veg', '1149', '180000', '[{"id": "add_e10787fe09c9069b5c12c042", "qty": 1, "name": "Crystal Grand Mandap", "unit": "per event", "price": 48000}, {"id": "add_e4ce2d48f0659e7c56e7d434", "qty": 1, "name": "Sufi Qawwali Evening (2 hrs)", "unit": "per event", "price": 25000}]', '1149000', '73000', '0', '1402000', '351000', '1402000', 'COMPLETED', '', 'DASHBOARD', '2026-03-30 11:24:00', '2026-04-20 11:24:00'),
  ('bkg_e9280678e2d05d3321a55e80', 'hall_267e67d2b3976b10ecee0cfa', NULL, 'The Kapoor Family', '+91 94150 40002', 'raj.kapoor@gmail.com', 'Reception', '2026-06-24', 'DINNER', '750', 'pkg_0a2b5ac83bab90de37ba4724', 'Nawab veg Darbar', '899', '180000', '[{"id": "add_9d3c6580b688d0f75c94be8b", "qty": 1, "name": "Chandelier Aisle Setup", "unit": "per event", "price": 22000}, {"id": "add_2f487e6a33f71a1a7b1db22f", "qty": 1, "name": "Maharaja Sofa Sets", "unit": "per event", "price": 13000}]', '674250', '35000', '20000', '869250', '217000', '869250', 'COMPLETED', '', 'DASHBOARD', '2026-06-03 11:24:00', '2026-06-24 11:24:00'),
  ('bkg_f6fb0fbfaa0b334b98745929', 'hall_267e67d2b3976b10ecee0cfa', 'usr_08368ad605833ef2ae1a63a3', 'Fatima Sheikh & Imran Ali', '+91 94150 40003', 'fatima.s@gmail.com', 'Wedding', '2026-08-03', 'FULL_DAY', '900', 'pkg_45428a2b70c9fbbf0390fbac', 'Awadhi Shahi Non-Veg', '1149', '180000', '[{"id": "add_e10787fe09c9069b5c12c042", "qty": 1, "name": "Crystal Grand Mandap", "unit": "per event", "price": 48000}, {"id": "add_3d8995ba3708b65275b2216a", "qty": 1, "name": "DJ, Sound & Dance Floor", "unit": "per event", "price": 20000}, {"id": "add_7d7a08caace6a8877b24066d", "qty": 1, "name": "Doli & Palki Entry", "unit": "per event", "price": 18000}]', '1034100', '86000', '0', '1300100', '325000', '1300100', 'COMPLETED', '', 'WEBSITE', '2026-07-13 11:24:00', '2026-08-03 11:24:00'),
  ('bkg_49423d4c159f49894bfb6cb5', 'hall_267e67d2b3976b10ecee0cfa', NULL, 'Yash & Nidhi Srivastava', '+91 94150 40004', 'yash.sriv@gmail.com', 'Engagement', '2026-10-06', 'DINNER', '320', 'pkg_07f4039ab5aa43d30c74dcea', 'Shagun Veg Shringar', '699', '180000', '[{"id": "add_9d3c6580b688d0f75c94be8b", "qty": 1, "name": "Chandelier Aisle Setup", "unit": "per event", "price": 22000}]', '223680', '22000', '0', '425680', '106000', '106000', 'CONFIRMED', '', 'DASHBOARD', '2026-09-15 11:24:00', '2026-09-26 11:24:00'),
  ('bkg_06e94cb717e3d0330b83f1a8', 'hall_267e67d2b3976b10ecee0cfa', NULL, 'The Tandon Family', '+91 94150 40005', 'tandon.house@gmail.com', 'Wedding', '2026-11-06', 'FULL_DAY', '1100', 'pkg_45428a2b70c9fbbf0390fbac', 'Awadhi Shahi Non-Veg', '1149', '180000', '[{"id": "add_e10787fe09c9069b5c12c042", "qty": 1, "name": "Crystal Grand Mandap", "unit": "per event", "price": 48000}, {"id": "add_e4ce2d48f0659e7c56e7d434", "qty": 1, "name": "Sufi Qawwali Evening (2 hrs)", "unit": "per event", "price": 25000}, {"id": "add_7d7a08caace6a8877b24066d", "qty": 1, "name": "Doli & Palki Entry", "unit": "per event", "price": 18000}]', '1263900', '91000', '25000', '1509900', '377000', '377000', 'CONFIRMED', '', 'DASHBOARD', '2026-10-16 11:24:00', '2026-09-26 11:24:00'),
  ('bkg_793706192f0e5e5735118076', 'hall_267e67d2b3976b10ecee0cfa', 'usr_0f52cc2150fa0b3e74dd66b9', 'Karan Malhotra', '+91 94150 40006', 'karan.m@gmail.com', 'Sangeet', '2026-10-21', 'DINNER', '260', 'pkg_0a2b5ac83bab90de37ba4724', 'Nawab veg Darbar', '899', '180000', '[{"id": "add_3d8995ba3708b65275b2216a", "qty": 1, "name": "DJ, Sound & Dance Floor", "unit": "per event", "price": 20000}]', '233740', '20000', '0', '433740', '108000', '0', 'PENDING', 'Wants to confirm a choreographer green room.', 'WEBSITE', '2026-09-30 11:24:00', '2026-09-26 11:24:00'),
  ('bkg_c1019a5de5e0a5fe5a64aaed', 'hall_7458d7142ede56e3013363e1', NULL, 'Meghana & Prithvi Shetty', '+91 98450 50001', 'meghana.s@gmail.com', 'Wedding', '2026-06-09', 'FULL_DAY', '420', 'pkg_c0d1bae220ecf668c25b0ed2', 'Coastal Non-Veg Trawler', '999', '110000', '[{"id": "add_4b92ee815f9f3fda914fb25e", "qty": 1, "name": "Jasmine Pergola Mandap", "unit": "per event", "price": 38000}, {"id": "add_403afa55ce49ba014e070241", "qty": 1, "name": "Acoustic Live Band (2 hrs)", "unit": "per event", "price": 16000}]', '419580', '54000', '0', '583580', '146000', '583580', 'COMPLETED', '', 'DASHBOARD', '2026-05-19 11:24:00', '2026-06-09 11:24:00'),
  ('bkg_2cec6cf9a0ad6d554a4f701b', 'hall_7458d7142ede56e3013363e1', NULL, 'The Fernandes Family', '+91 98450 50002', 'maria.fernandes@gmail.com', 'Birthday', '2026-08-16', 'LUNCH', '130', 'pkg_cd84ab97ae6bd012066e4f41', 'Garden Veg Soirée', '599', '110000', '[{"id": "add_afb3ad4554a7cabd41af5296", "qty": 1, "name": "Bistro String Lighting", "unit": "per event", "price": 14000}, {"id": "add_edf8a6df3f709f079b630f06", "qty": 1, "name": "Open Vintage Photo Booth", "unit": "per event", "price": 7500}]', '77870', '21500', '0', '209370', '52000', '209370', 'COMPLETED', '', 'DASHBOARD', '2026-07-26 11:24:00', '2026-08-16 11:24:00'),
  ('bkg_9ab2b028c4a34c976dec74a2', 'hall_7458d7142ede56e3013363e1', NULL, 'Ayesha & Rehan Qadri', '+91 98450 50003', 'ayesha.q@gmail.com', 'Reception', '2026-10-13', 'DINNER', '300', 'pkg_f0d7e211c3ee6b7da15a0f0d', 'Amara Veg Reserve', '799', '110000', '[{"id": "add_afb3ad4554a7cabd41af5296", "qty": 1, "name": "Bistro String Lighting", "unit": "per event", "price": 14000}, {"id": "add_403afa55ce49ba014e070241", "qty": 1, "name": "Acoustic Live Band (2 hrs)", "unit": "per event", "price": 16000}]', '239700', '30000', '0', '379700', '95000', '95000', 'CONFIRMED', '', 'DASHBOARD', '2026-09-22 11:24:00', '2026-09-26 11:24:00'),
  ('bkg_50f8c3c9f5b7240aeb0b022b', 'hall_7458d7142ede56e3013363e1', 'usr_0fdd79823d201466320e1082', 'Nisha & Karthik Iyengar', '+91 98450 50004', 'nisha.iyengar@gmail.com', 'Baby Shower', '2026-10-04', 'LUNCH', '90', 'pkg_cd84ab97ae6bd012066e4f41', 'Garden Veg Soirée', '599', '110000', '[{"id": "add_d1e4e9b06f565a673a2fc558", "qty": 1, "name": "Brunch & Bubbles Counter", "unit": "per event", "price": 11000}]', '53910', '11000', '0', '174910', '44000', '0', 'PENDING', '', 'WEBSITE', '2026-09-13 11:24:00', '2026-09-26 11:24:00'),
  ('bkg_cfd0f1e3b4d17d8dcdac5c11', 'hall_7458d7142ede56e3013363e1', NULL, 'The Dixits (Mehndi)', '+91 98450 50005', 'aditi.dixit@gmail.com', 'Haldi / Mehndi', '2026-11-26', 'LUNCH', '110', NULL, '', '0', '110000', '[]', '0', '0', '0', '110000', '28000', '0', 'PENDING', '', 'DASHBOARD', '2026-11-05 11:24:00', '2026-09-26 11:24:00'),
  ('bkg_f45a21fe7fb38a4a17e0fe46', 'hall_1ef2949ac6388b32d7241db8', NULL, 'Zainab & Faiz Ahmed', '+91 97660 60001', 'zainab.a@gmail.com', 'Wedding', '2026-07-19', 'DINNER', '380', 'pkg_bbe25a77ecfb8f2fca62fb4c', 'Mughlai Non-Veg Bada Khana', '949', '60000', '[{"id": "add_ce6442d841ecd3528d6e4e92", "qty": 1, "name": "Nikah Stage &Backdrop", "unit": "per event", "price": 26000}, {"id": "add_0396ba65ade7f7e200efc909", "qty": 1, "name": "Dhol Party (1 hr)", "unit": "per event", "price": 8000}]', '360620', '34000', '0', '454620', '114000', '454620', 'COMPLETED', '', 'DASHBOARD', '2026-06-28 11:24:00', '2026-07-19 11:24:00'),
  ('bkg_789ee6fd5d571900e9caa537', 'hall_4f766bef78b614f55a55721c', NULL, 'Deepika & Surya Prakash', '+91 98410 70001', 'deepika.p@gmail.com', 'Wedding', '2026-11-01', 'LUNCH', '500', 'pkg_099687b8d4c299f4b9e95238', 'Kalyani Veg Grand', '749', '70000', '[{"id": "add_7f6088c55fdb609d0a611d92", "qty": 1, "name": "Nadaswaram Team (3 hrs)", "unit": "per event", "price": 9000}, {"id": "add_5b6dc978d0acbb8541855a78", "qty": 1, "name": "Floral Kolam & Mandap", "unit": "per event", "price": 30000}]', '374500', '39000', '0', '483500', '121000', '0', 'PENDING', '', 'DASHBOARD', '2026-10-11 11:24:00', '2026-09-26 11:24:00');

-- ── payments ─────────────────────────────────────────────
INSERT INTO "payments" ("id", "hall_id", "booking_id", "type", "amount", "method", "status", "reference", "description", "created_at") VALUES
  ('pay_c8719427995afc33920fa369', 'hall_73d60ffef2698f81c5636a7f', 'bkg_8e2806028a2c1fb55b4753d0', 'BOOKING', '249000', 'UPI', 'PAID', 'ADV-4753D0', 'Advance — Kavita & Rohit Sharma', '2026-04-15 11:24:00'),
  ('pay_81e8a92882f18c32dc55ed27', 'hall_73d60ffef2698f81c5636a7f', 'bkg_8e2806028a2c1fb55b4753d0', 'BOOKING', '747300', 'CASH', 'PAID', 'FIN-4753D0', 'Final settlement — Kavita & Rohit Sharma', '2026-05-06 11:24:00'),
  ('pay_a7847272d19f076e0f0b2c0d', 'hall_73d60ffef2698f81c5636a7f', 'bkg_8e2806028a2c1fb55b4753d0', 'COMMISSION', '49815', 'BANK', 'PAID', '', 'Platform commission (5%) — Kavita & Rohit Sharma', '2026-05-07 11:24:00'),
  ('pay_ef9436ec145939f3d8054e87', 'hall_73d60ffef2698f81c5636a7f', 'bkg_a9b3f45a18962c0cd22aff0d', 'BOOKING', '136000', 'UPI', 'PAID', 'ADV-2AFF0D', 'Advance — The Bhandari Family', '2026-05-12 11:24:00'),
  ('pay_b41538cea85a4099ec7e4886', 'hall_73d60ffef2698f81c5636a7f', 'bkg_a9b3f45a18962c0cd22aff0d', 'BOOKING', '409050', 'CASH', 'PAID', 'FIN-2AFF0D', 'Final settlement — The Bhandari Family', '2026-06-02 11:24:00'),
  ('pay_1dc5e2ae6ec71870b5823c4b', 'hall_73d60ffef2698f81c5636a7f', 'bkg_a9b3f45a18962c0cd22aff0d', 'COMMISSION', '27253', 'BANK', 'PAID', '', 'Platform commission (5%) — The Bhandari Family', '2026-06-03 11:24:00'),
  ('pay_62ad96598940251de3328298', 'hall_73d60ffef2698f81c5636a7f', 'bkg_120d4276194795e450211f05', 'BOOKING', '338000', 'UPI', 'PAID', 'ADV-211F05', 'Advance — Aditi & Siddharth Jain', '2026-06-11 11:24:00'),
  ('pay_ad44088b9a63d8231905f5c6', 'hall_73d60ffef2698f81c5636a7f', 'bkg_120d4276194795e450211f05', 'BOOKING', '1013650', 'CASH', 'PAID', 'FIN-211F05', 'Final settlement — Aditi & Siddharth Jain', '2026-07-02 11:24:00'),
  ('pay_b39ecd6e96463f099afcd753', 'hall_73d60ffef2698f81c5636a7f', 'bkg_120d4276194795e450211f05', 'COMMISSION', '67583', 'BANK', 'PAID', '', 'Platform commission (5%) — Aditi & Siddharth Jain', '2026-07-03 11:24:00'),
  ('pay_344ccbfe53dcae876b527d23', 'hall_73d60ffef2698f81c5636a7f', 'bkg_fc034ffb1f41de82e60fa592', 'BOOKING', '92000', 'UPI', 'PAID', 'ADV-0FA592', 'Advance — Mehta Family (Sangeet)', '2026-07-22 11:24:00'),
  ('pay_a3c8f2e064e92419315e8e8d', 'hall_73d60ffef2698f81c5636a7f', 'bkg_fc034ffb1f41de82e60fa592', 'BOOKING', '276700', 'CASH', 'PAID', 'FIN-0FA592', 'Final settlement — Mehta Family (Sangeet)', '2026-08-12 11:24:00'),
  ('pay_9da3fa6cea77dc4b9190239d', 'hall_73d60ffef2698f81c5636a7f', 'bkg_fc034ffb1f41de82e60fa592', 'COMMISSION', '18435', 'BANK', 'PAID', '', 'Platform commission (5%) — Mehta Family (Sangeet)', '2026-08-13 11:24:00'),
  ('pay_864b283bcccdd9c70d4422b5', 'hall_73d60ffef2698f81c5636a7f', 'bkg_278e54b47906d4cff1397451', 'BOOKING', '84000', 'UPI', 'PAID', 'ADV-397451', 'Advance — Ritika & Aakash Tomar', '2026-08-26 11:24:00'),
  ('pay_4ccf8c2e895ee0c154ba7d0f', 'hall_73d60ffef2698f81c5636a7f', 'bkg_278e54b47906d4cff1397451', 'BOOKING', '252780', 'BANK', 'PAID', 'FIN-397451', 'Final settlement — Ritika & Aakash Tomar', '2026-09-16 11:24:00'),
  ('pay_ce70ca169e2c73a7440930dd', 'hall_73d60ffef2698f81c5636a7f', 'bkg_278e54b47906d4cff1397451', 'COMMISSION', '16839', 'BANK', 'PAID', '', 'Platform commission (5%) — Ritika & Aakash Tomar', '2026-09-17 11:24:00'),
  ('pay_4802921c791da3470ac2cc23', 'hall_73d60ffef2698f81c5636a7f', 'bkg_6dfb3b029a55b198972388e2', 'BOOKING', '264000', 'UPI', 'PAID', 'ADV-2388E2', 'Advance — Priya Kapoor & Aarav Nair', '2026-09-17 11:24:00'),
  ('pay_cd2f71922a9024d502cb3b6e', 'hall_73d60ffef2698f81c5636a7f', 'bkg_34614c7b593bbdf5563640a9', 'BOOKING', '189000', 'UPI', 'PAID', 'ADV-3640A9', 'Advance — The Khetan Family', '2026-10-01 11:24:00'),
  ('pay_8327e30fed2a281385f3e32b', 'hall_7cab4e6cf83da04b19106f2d', 'bkg_39b839d5dac899f04ee1ef28', 'BOOKING', '194000', 'UPI', 'PAID', 'ADV-E1EF28', 'Advance — Sirisha & Vikas Reddy', '2026-04-28 11:24:00'),
  ('pay_44cc49bf6b1ac363770f64a2', 'hall_7cab4e6cf83da04b19106f2d', 'bkg_39b839d5dac899f04ee1ef28', 'BOOKING', '580900', 'BANK', 'PAID', 'FIN-E1EF28', 'Final settlement — Sirisha & Vikas Reddy', '2026-05-19 11:24:00'),
  ('pay_db366ca7115c6f529cfe4192', 'hall_7cab4e6cf83da04b19106f2d', 'bkg_39b839d5dac899f04ee1ef28', 'COMMISSION', '15498', 'BANK', 'PAID', '', 'Platform commission (2%) — Sirisha & Vikas Reddy', '2026-05-20 11:24:00'),
  ('pay_91ab52ba74fe801dca221994', 'hall_7cab4e6cf83da04b19106f2d', 'bkg_62ab288dbac638e19af40c9e', 'BOOKING', '104000', 'UPI', 'PAID', 'ADV-F40C9E', 'Advance — The Muppalla Family', '2026-06-24 11:24:00'),
  ('pay_32c872b1aa45e548f48ab2b5', 'hall_7cab4e6cf83da04b19106f2d', 'bkg_62ab288dbac638e19af40c9e', 'BOOKING', '310620', 'BANK', 'PAID', 'FIN-F40C9E', 'Final settlement — The Muppalla Family', '2026-07-15 11:24:00'),
  ('pay_d55142faa21ea1e6900b38f1', 'hall_7cab4e6cf83da04b19106f2d', 'bkg_62ab288dbac638e19af40c9e', 'COMMISSION', '8292', 'BANK', 'PAID', '', 'Platform commission (2%) — The Muppalla Family', '2026-07-16 11:24:00'),
  ('pay_6d729547c0533c52aa34a6c0', 'hall_7cab4e6cf83da04b19106f2d', 'bkg_cc6df3c7372108300b5fc5f4', 'BOOKING', '55000', 'UPI', 'PAID', 'ADV-5FC5F4', 'Advance — Divya & Arjun Pellikuthuru', '2026-08-18 11:24:00'),
  ('pay_183c6d297c601b9fae2a09d7', 'hall_7cab4e6cf83da04b19106f2d', 'bkg_cc6df3c7372108300b5fc5f4', 'BOOKING', '164820', 'CASH', 'PAID', 'FIN-5FC5F4', 'Final settlement — Divya & Arjun Pellikuthuru', '2026-09-08 11:24:00'),
  ('pay_f9336d30fdb284e6db76cd31', 'hall_7cab4e6cf83da04b19106f2d', 'bkg_cc6df3c7372108300b5fc5f4', 'COMMISSION', '4396', 'BANK', 'PAID', '', 'Platform commission (2%) — Divya & Arjun Pellikuthuru', '2026-09-09 11:24:00'),
  ('pay_161c8e0db31cc2c311658449', 'hall_7cab4e6cf83da04b19106f2d', 'bkg_f6bbb0ad067ad8a991c5f104', 'BOOKING', '150000', 'UPI', 'PAID', 'ADV-C5F104', 'Advance — Ananya Iyer & Nikhil Rao', '2026-09-24 11:24:00'),
  ('pay_90ecf274aeb9c102a5709696', 'hall_267e67d2b3976b10ecee0cfa', 'bkg_eade19ff87ab649bbedbeae9', 'BOOKING', '351000', 'UPI', 'PAID', 'ADV-DBEAE9', 'Advance — Sneha & Vaibhav Dixit', '2026-03-31 11:24:00'),
  ('pay_38cb1f9e9bc311dfb77a63be', 'hall_267e67d2b3976b10ecee0cfa', 'bkg_eade19ff87ab649bbedbeae9', 'BOOKING', '1051000', 'CASH', 'PAID', 'FIN-DBEAE9', 'Final settlement — Sneha & Vaibhav Dixit', '2026-04-21 11:24:00'),
  ('pay_ba8d04a25f695a7027d9d35d', 'hall_267e67d2b3976b10ecee0cfa', 'bkg_eade19ff87ab649bbedbeae9', 'COMMISSION', '70100', 'BANK', 'PAID', '', 'Platform commission (5%) — Sneha & Vaibhav Dixit', '2026-04-22 11:24:00'),
  ('pay_61bc4d01e4ca7d8849d1fa9f', 'hall_267e67d2b3976b10ecee0cfa', 'bkg_e9280678e2d05d3321a55e80', 'BOOKING', '217000', 'UPI', 'PAID', 'ADV-A55E80', 'Advance — The Kapoor Family', '2026-06-04 11:24:00'),
  ('pay_33431750742314e75c071fed', 'hall_267e67d2b3976b10ecee0cfa', 'bkg_e9280678e2d05d3321a55e80', 'BOOKING', '652250', 'CASH', 'PAID', 'FIN-A55E80', 'Final settlement — The Kapoor Family', '2026-06-25 11:24:00'),
  ('pay_70c72ef27624a4120be19be8', 'hall_267e67d2b3976b10ecee0cfa', 'bkg_e9280678e2d05d3321a55e80', 'COMMISSION', '43463', 'BANK', 'PAID', '', 'Platform commission (5%) — The Kapoor Family', '2026-06-26 11:24:00'),
  ('pay_d813d0a8ba6e31a0cca7db99', 'hall_267e67d2b3976b10ecee0cfa', 'bkg_f6fb0fbfaa0b334b98745929', 'BOOKING', '325000', 'UPI', 'PAID', 'ADV-745929', 'Advance — Fatima Sheikh & Imran Ali', '2026-07-14 11:24:00'),
  ('pay_45115b4557bd760486a60854', 'hall_267e67d2b3976b10ecee0cfa', 'bkg_f6fb0fbfaa0b334b98745929', 'BOOKING', '975100', 'CASH', 'PAID', 'FIN-745929', 'Final settlement — Fatima Sheikh & Imran Ali', '2026-08-04 11:24:00'),
  ('pay_1ad08088f612dcbb77be28c6', 'hall_267e67d2b3976b10ecee0cfa', 'bkg_f6fb0fbfaa0b334b98745929', 'COMMISSION', '65005', 'BANK', 'PAID', '', 'Platform commission (5%) — Fatima Sheikh & Imran Ali', '2026-08-05 11:24:00'),
  ('pay_5fa8f2d4137cf39825ff2959', 'hall_267e67d2b3976b10ecee0cfa', 'bkg_49423d4c159f49894bfb6cb5', 'BOOKING', '106000', 'UPI', 'PAID', 'ADV-FB6CB5', 'Advance — Yash & Nidhi Srivastava', '2026-09-22 11:24:00'),
  ('pay_eab02fcec72a918c24cb3273', 'hall_267e67d2b3976b10ecee0cfa', 'bkg_06e94cb717e3d0330b83f1a8', 'BOOKING', '377000', 'UPI', 'PAID', 'ADV-83F1A8', 'Advance — The Tandon Family', '2026-10-23 11:24:00'),
  ('pay_9d3a50cbe6e8ddce33e7f74a', 'hall_7458d7142ede56e3013363e1', 'bkg_c1019a5de5e0a5fe5a64aaed', 'BOOKING', '146000', 'UPI', 'PAID', 'ADV-64AAED', 'Advance — Meghana & Prithvi Shetty', '2026-05-20 11:24:00'),
  ('pay_e1f65dda32b97c262ce375d4', 'hall_7458d7142ede56e3013363e1', 'bkg_c1019a5de5e0a5fe5a64aaed', 'BOOKING', '437580', 'CASH', 'PAID', 'FIN-64AAED', 'Final settlement — Meghana & Prithvi Shetty', '2026-06-10 11:24:00'),
  ('pay_1ef3d283ea4b2169ba4729c1', 'hall_7458d7142ede56e3013363e1', 'bkg_c1019a5de5e0a5fe5a64aaed', 'COMMISSION', '40851', 'BANK', 'PAID', '', 'Platform commission (7%) — Meghana & Prithvi Shetty', '2026-06-11 11:24:00'),
  ('pay_952b5025632e285f5b1d4abe', 'hall_7458d7142ede56e3013363e1', 'bkg_2cec6cf9a0ad6d554a4f701b', 'BOOKING', '52000', 'UPI', 'PAID', 'ADV-4F701B', 'Advance — The Fernandes Family', '2026-07-27 11:24:00'),
  ('pay_e6b371c7a073367eedf9b2e8', 'hall_7458d7142ede56e3013363e1', 'bkg_2cec6cf9a0ad6d554a4f701b', 'BOOKING', '157370', 'BANK', 'PAID', 'FIN-4F701B', 'Final settlement — The Fernandes Family', '2026-08-17 11:24:00'),
  ('pay_b31ffbb7e459aa41bc765e7a', 'hall_7458d7142ede56e3013363e1', 'bkg_2cec6cf9a0ad6d554a4f701b', 'COMMISSION', '14656', 'BANK', 'PAID', '', 'Platform commission (7%) — The Fernandes Family', '2026-08-18 11:24:00'),
  ('pay_b27a3e8d3687432c8b614917', 'hall_7458d7142ede56e3013363e1', 'bkg_9ab2b028c4a34c976dec74a2', 'BOOKING', '95000', 'UPI', 'PAID', 'ADV-EC74A2', 'Advance — Ayesha & Rehan Qadri', '2026-09-29 11:24:00'),
  ('pay_7d01e51bea23d06269344bcc', 'hall_1ef2949ac6388b32d7241db8', 'bkg_f45a21fe7fb38a4a17e0fe46', 'BOOKING', '114000', 'UPI', 'PAID', 'ADV-E0FE46', 'Advance — Zainab & Faiz Ahmed', '2026-06-29 11:24:00'),
  ('pay_6938950aec8b816385896d38', 'hall_1ef2949ac6388b32d7241db8', 'bkg_f45a21fe7fb38a4a17e0fe46', 'BOOKING', '340620', 'CASH', 'PAID', 'FIN-E0FE46', 'Final settlement — Zainab & Faiz Ahmed', '2026-07-20 11:24:00'),
  ('pay_642368b1c8d90ffd72b71629', 'hall_1ef2949ac6388b32d7241db8', 'bkg_f45a21fe7fb38a4a17e0fe46', 'COMMISSION', '22731', 'BANK', 'PAID', '', 'Platform commission (5%) — Zainab & Faiz Ahmed', '2026-07-21 11:24:00'),
  ('pay_7894240f6b31d8bcdf8fac90', 'hall_73d60ffef2698f81c5636a7f', NULL, 'SUBSCRIPTION', '5999', 'UPI', 'PAID', '', 'Growth plan subscription', '2026-07-27 11:24:00'),
  ('pay_5b58a9b83e010fb4a97e455a', 'hall_73d60ffef2698f81c5636a7f', NULL, 'SUBSCRIPTION', '5999', 'CARD', 'PAID', '', 'Growth plan subscription', '2026-08-26 11:24:00'),
  ('pay_2b96b13301cc256d17a1d3e1', 'hall_73d60ffef2698f81c5636a7f', NULL, 'SUBSCRIPTION', '5999', 'UPI', 'PAID', '', 'Growth plan subscription', '2026-09-25 11:24:00'),
  ('pay_28ef8cbceb746967167012b0', 'hall_7cab4e6cf83da04b19106f2d', NULL, 'SUBSCRIPTION', '11999', 'UPI', 'PAID', '', 'Premium plan subscription', '2026-07-27 11:24:00'),
  ('pay_f781de148c8bde8f7e8cc3cd', 'hall_7cab4e6cf83da04b19106f2d', NULL, 'SUBSCRIPTION', '11999', 'CARD', 'PAID', '', 'Premium plan subscription', '2026-08-26 11:24:00'),
  ('pay_3ec2baeb4c52cc6b46f66792', 'hall_7cab4e6cf83da04b19106f2d', NULL, 'SUBSCRIPTION', '11999', 'UPI', 'PAID', '', 'Premium plan subscription', '2026-09-25 11:24:00'),
  ('pay_a90850afe787aee537bba13b', 'hall_267e67d2b3976b10ecee0cfa', NULL, 'SUBSCRIPTION', '5999', 'UPI', 'PAID', '', 'Growth plan subscription', '2026-07-27 11:24:00'),
  ('pay_4ec82fe38210837f44679d26', 'hall_267e67d2b3976b10ecee0cfa', NULL, 'SUBSCRIPTION', '5999', 'CARD', 'PAID', '', 'Growth plan subscription', '2026-08-26 11:24:00'),
  ('pay_e42bb56c178050ce5a97ead4', 'hall_267e67d2b3976b10ecee0cfa', NULL, 'SUBSCRIPTION', '5999', 'UPI', 'PAID', '', 'Growth plan subscription', '2026-09-25 11:24:00'),
  ('pay_df4c1d481c30d94ac81c4b5c', 'hall_7458d7142ede56e3013363e1', NULL, 'SUBSCRIPTION', '2499', 'UPI', 'PAID', '', 'Starter plan subscription', '2026-07-27 11:24:00'),
  ('pay_98bcff9c525622ce0786d04b', 'hall_7458d7142ede56e3013363e1', NULL, 'SUBSCRIPTION', '2499', 'CARD', 'PAID', '', 'Starter plan subscription', '2026-08-26 11:24:00'),
  ('pay_fb0f206eb1dbac2546b55847', 'hall_7458d7142ede56e3013363e1', NULL, 'SUBSCRIPTION', '2499', 'UPI', 'PAID', '', 'Starter plan subscription', '2026-09-25 11:24:00'),
  ('pay_4e7940de93330fa135c6bed5', 'hall_1ef2949ac6388b32d7241db8', NULL, 'SUBSCRIPTION', '5999', 'UPI', 'PAID', '', 'Growth plan subscription', '2026-07-27 11:24:00'),
  ('pay_ac7448e329b1ec4bbc481f15', 'hall_1ef2949ac6388b32d7241db8', NULL, 'SUBSCRIPTION', '5999', 'CARD', 'PAID', '', 'Growth plan subscription', '2026-08-26 11:24:00'),
  ('pay_672824b2d92486cb525a4984', 'hall_1ef2949ac6388b32d7241db8', NULL, 'SUBSCRIPTION', '5999', 'UPI', 'PENDING', '', 'Growth plan subscription', '2026-09-25 11:24:00');

-- ── platform_settings ─────────────────────────────────────────────
INSERT INTO "platform_settings" ("key", "value") VALUES
  ('siteName', 'MerrageHall'),
  ('commissionPct', '5'),
  ('supportEmail', 'support@merragehall.com'),
  ('rootDomain', 'merragehall.app');

-- restore staff → hall assignments (circular FK with halls.owner_id)
UPDATE "users" SET hall_id = 'hall_73d60ffef2698f81c5636a7f' WHERE id = 'usr_69ef6c1620a2ed7814a7ec05';
UPDATE "users" SET hall_id = 'hall_73d60ffef2698f81c5636a7f' WHERE id = 'usr_30ae6a47fb2a947978c52638';
UPDATE "users" SET hall_id = 'hall_7cab4e6cf83da04b19106f2d' WHERE id = 'usr_a3fbdccbbb7cc7e58e55396f';

COMMIT;

-- ══════════════════════════════════════════════════════════ VERIFICATION
-- row counts after import (should match the numbers in the header):
--   select 'plans' t, count(*) from plans union all
--   select 'users', count(*) from users union all
--   select 'halls', count(*) from halls union all
--   select 'bookings', count(*) from bookings union all
--   select 'payments', count(*) from payments;

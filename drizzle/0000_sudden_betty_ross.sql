CREATE TYPE "public"."addon_category" AS ENUM('DECOR', 'LIGHTING', 'SOUND', 'STAGE', 'FURNITURE', 'PHOTOGRAPHY', 'VEHICLE', 'ENTERTAINMENT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."booking_slot" AS ENUM('LUNCH', 'DINNER', 'FULL_DAY');--> statement-breakpoint
CREATE TYPE "public"."booking_source" AS ENUM('WEBSITE', 'DASHBOARD');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."diet_type" AS ENUM('VEG', 'NON_VEG', 'VEGAN', 'JAIN');--> statement-breakpoint
CREATE TYPE "public"."hall_status" AS ENUM('PENDING', 'ACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."menu_category" AS ENUM('STARTER', 'SOUP', 'SALAD', 'MAIN_COURSE', 'BREAD', 'RICE', 'DESSERT', 'DRINKS', 'LIVE_COUNTER');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('CASH', 'UPI', 'BANK', 'CARD');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PAID', 'PENDING', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('BOOKING', 'SUBSCRIPTION', 'COMMISSION');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('SUPER_ADMIN', 'HALL_OWNER', 'HALL_STAFF', 'CUSTOMER');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "addons" (
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
--> statement-breakpoint
CREATE TABLE "bookings" (
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
--> statement-breakpoint
CREATE TABLE "halls" (
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
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" text PRIMARY KEY NOT NULL,
	"hall_id" text NOT NULL,
	"name" text NOT NULL,
	"category" "menu_category" DEFAULT 'MAIN_COURSE' NOT NULL,
	"diet_type" "diet_type" DEFAULT 'VEG' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price_per_plate" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_packages" (
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
--> statement-breakpoint
CREATE TABLE "payments" (
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
--> statement-breakpoint
CREATE TABLE "plans" (
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
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"hall_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"status" "subscription_status" DEFAULT 'TRIALING' NOT NULL,
	"price_monthly" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ends_at" timestamp,
	CONSTRAINT "subscriptions_hall_id_unique" UNIQUE("hall_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
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
--> statement-breakpoint
ALTER TABLE "addons" ADD CONSTRAINT "addons_hall_id_halls_id_fk" FOREIGN KEY ("hall_id") REFERENCES "public"."halls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_hall_id_halls_id_fk" FOREIGN KEY ("hall_id") REFERENCES "public"."halls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_booked_by_user_id_users_id_fk" FOREIGN KEY ("booked_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "halls" ADD CONSTRAINT "halls_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_hall_id_halls_id_fk" FOREIGN KEY ("hall_id") REFERENCES "public"."halls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_packages" ADD CONSTRAINT "menu_packages_hall_id_halls_id_fk" FOREIGN KEY ("hall_id") REFERENCES "public"."halls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_hall_id_halls_id_fk" FOREIGN KEY ("hall_id") REFERENCES "public"."halls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_hall_id_halls_id_fk" FOREIGN KEY ("hall_id") REFERENCES "public"."halls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_hall_id_halls_id_fk" FOREIGN KEY ("hall_id") REFERENCES "public"."halls"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookings_hall_date_idx" ON "bookings" USING btree ("hall_id","event_date");--> statement-breakpoint
CREATE INDEX "bookings_date_idx" ON "bookings" USING btree ("event_date");
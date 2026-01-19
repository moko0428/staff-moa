CREATE TYPE "public"."company_verify_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('남성', '여성', '미정');--> statement-breakpoint
CREATE TYPE "public"."pay_type" AS ENUM('hourly', 'daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('recruiting', 'completed', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('pending', 'reviewed', 'resolved_ban', 'resolved_no_action');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('member', 'manager', 'pending_manager', 'rejected_manager', 'admin');--> statement-breakpoint
CREATE TABLE "followers" (
	"follower_id" uuid,
	"following_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"avatar" text,
	"cover_image" text,
	"recent_photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" "user_role" DEFAULT 'member' NOT NULL,
	"kakao_id" text,
	"phone" text,
	"mbti" text,
	"gender" "gender" DEFAULT '미정',
	"birth_date" date,
	"height" numeric,
	"weight" numeric(5, 2),
	"personality" text,
	"features" text,
	"experiences" jsonb,
	"bio" text,
	"documents" jsonb,
	"company_name" text,
	"business_number" text,
	"company_certificate" text,
	"company_verify_status" "company_verify_status",
	"is_banned" boolean DEFAULT false NOT NULL,
	"banned_at" timestamp with time zone,
	"banned_until" timestamp with time zone,
	"banned_reason" text,
	"banned_by_admin_id" uuid,
	"last_ban_update_at" timestamp with time zone,
	"stats" jsonb,
	"views" jsonb,
	"attendance_score" integer DEFAULT 50 NOT NULL,
	"favorites" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"reported_user_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"resolved_by_admin_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "followers" ADD CONSTRAINT "followers_follower_id_profiles_user_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "followers" ADD CONSTRAINT "followers_following_id_profiles_user_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_banned_by_admin_id_users_id_fk" FOREIGN KEY ("banned_by_admin_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_profiles_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_user_id_profiles_user_id_fk" FOREIGN KEY ("reported_user_id") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_admin_id_profiles_user_id_fk" FOREIGN KEY ("resolved_by_admin_id") REFERENCES "public"."profiles"("user_id") ON DELETE set null ON UPDATE no action;
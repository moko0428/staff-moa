-- event_briefing이 이미 존재할 수 있으므로 조건부로 추가
DO $$ BEGIN
  ALTER TYPE "public"."notification_type" ADD VALUE 'event_briefing';
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"auth" text NOT NULL,
	"p256dh" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
ALTER TABLE "member_schedules" ADD COLUMN IF NOT EXISTS "staff_status" text DEFAULT 'waiting' NOT NULL;--> statement-breakpoint
ALTER TABLE "member_schedules" ADD COLUMN IF NOT EXISTS "assigned_role" text;--> statement-breakpoint
ALTER TABLE "member_schedules" ADD COLUMN IF NOT EXISTS "checkin_status" text DEFAULT 'not_checked' NOT NULL;--> statement-breakpoint
ALTER TABLE "member_schedules" ADD COLUMN IF NOT EXISTS "checked_in_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "member_schedules" ADD COLUMN IF NOT EXISTS "arrived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "member_schedules" ADD COLUMN IF NOT EXISTS "manager_memo" text;--> statement-breakpoint
ALTER TABLE "member_schedules" ADD COLUMN IF NOT EXISTS "movement_status" text;--> statement-breakpoint
ALTER TABLE "member_schedules" ADD COLUMN IF NOT EXISTS "checked_out_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "event_positions" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "manual_staff" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_profiles_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

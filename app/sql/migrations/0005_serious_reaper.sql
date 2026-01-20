CREATE TYPE "public"."manager_schedule_status" AS ENUM('upcoming', 'ongoing', 'completed');--> statement-breakpoint
CREATE TYPE "public"."member_schedule_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TABLE "member_schedules" (
	"member_schedule_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" bigint NOT NULL,
	"member_id" uuid NOT NULL,
	"status" "member_schedule_status" DEFAULT 'pending' NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "member_schedules" ADD CONSTRAINT "member_schedules_post_id_posts_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("post_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_schedules" ADD CONSTRAINT "member_schedules_member_id_profiles_user_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "member_schedules" ADD COLUMN "selected_part" text;--> statement-breakpoint
ALTER TABLE "member_schedules" ADD COLUMN "selected_slot_index" integer;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "recruit_male" integer;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "recruit_female" integer;
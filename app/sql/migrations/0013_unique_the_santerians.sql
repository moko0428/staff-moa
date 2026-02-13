ALTER TABLE "personal_schedules" ADD COLUMN "manager_contact_type" text DEFAULT 'phone';--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "manager_contact_type" text DEFAULT 'phone' NOT NULL;